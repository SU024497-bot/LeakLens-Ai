import shutil
import logging
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
import pandas as pd

from backend.app.core.config import settings
from backend.app.schemas.audit import (
    AuditResponse, WorksheetListResponse, ErrorResponse
)
from backend.app.services.cleanup import temporary_upload_file
from backend.app.services.parser import (
    parse_dataset_file, discover_excel_sheets, ParsingError
)
from backend.app.services.audit_engine.engine import audit_dataset
from backend.app.services.audit_engine.report_generator import (
    generate_json_report, generate_csv_report, generate_html_report
)

logger = logging.getLogger("leaklens.api")
router = APIRouter()

SAMPLE_DATASETS = {
    "clean_customer_churn": {
        "id": "clean_customer_churn",
        "name": "Customer Churn (Clean Baseline)",
        "filename": "sample_clean_churn.csv",
        "format": "csv",
        "recommended_target": "churn",
        "description": "Standard telecommunications customer dataset. Demonstrates passed quality checks and baseline low-risk profile."
    },
    "leaky_credit_risk": {
        "id": "leaky_credit_risk",
        "name": "Credit Risk (High-Leakage Benchmark)",
        "filename": "sample_leaky_credit.csv",
        "format": "csv",
        "recommended_target": "loan_default",
        "description": "Financial loan evaluation containing direct target replicas, post-discharge recovery amounts, constant features, and duplicate rows."
    },
    "multisheet_retail_sales": {
        "id": "multisheet_retail_sales",
        "name": "Multi-Sheet Retail Sales Workbook",
        "filename": "sample_multisheet_sales.xlsx",
        "format": "xlsx",
        "recommended_target": "high_value_order",
        "description": "Two-sheet Excel workbook illustrating worksheet discovery, constant columns, missing values, and mixed currency formatting."
    }
}

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "team": settings.TEAM_NAME,
        "members": settings.TEAM_MEMBERS,
        "brand_palette": {
            "primary": settings.COLOR_PRIMARY_INDIGO,
            "background": settings.COLOR_VANILLA
        }
    }

@router.get("/sample-datasets")
def list_sample_datasets():
    """Lists available built-in demo datasets for instant evaluation."""
    return list(SAMPLE_DATASETS.values())

@router.post("/audit-sample/{sample_id}", response_model=AuditResponse)
def audit_sample_dataset(sample_id: str, target_column: Optional[str] = None):
    """Executes a real audit on one of the built-in demo datasets."""
    if sample_id not in SAMPLE_DATASETS:
        raise HTTPException(status_code=404, detail=f"Sample dataset '{sample_id}' not found.")
        
    sample_info = SAMPLE_DATASETS[sample_id]
    sample_path = settings.TEMP_DIR.parent / "sample_data" / sample_info["filename"]
    
    if not sample_path.exists():
        raise HTTPException(status_code=500, detail=f"Sample file {sample_path.name} not found on disk.")
        
    target = target_column or sample_info.get("recommended_target")
    
    try:
        df, metadata = parse_dataset_file(sample_path, sample_info["filename"])
        audit_res = audit_dataset(df, metadata, target_column=target)
        return audit_res
    except ParsingError as pe:
        raise HTTPException(status_code=pe.status_code, detail=pe.message)
    except Exception as e:
        logger.exception("Error running sample audit")
        raise HTTPException(status_code=500, detail=f"Audit failed: {str(e)}")

@router.post("/worksheets", response_model=WorksheetListResponse)
async def list_worksheets(file: UploadFile = File(...)):
    """Inspects an uploaded Excel file temporarily to return its sheets."""
    if not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Worksheet discovery is only applicable to .xlsx files.")
        
    suffix = Path(file.filename).suffix
    with temporary_upload_file(suffix) as temp_path:
        with open(temp_path, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)
            
        try:
            sheets = discover_excel_sheets(temp_path)
            return WorksheetListResponse(
                filename=file.filename,
                worksheets=sheets,
                default_worksheet=sheets[0] if sheets else ""
            )
        except ParsingError as pe:
            raise HTTPException(status_code=pe.status_code, detail=pe.message)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to inspect Excel workbook: {str(e)}")

@router.post("/audit", response_model=AuditResponse)
async def audit_uploaded_dataset(
    file: UploadFile = File(...),
    target_column: Optional[str] = Form(None),
    selected_sheet: Optional[str] = Form(None),
    test_file: Optional[UploadFile] = File(None)
):
    """
    Main audit endpoint.
    Safely receives files into isolated temporary storage, enforces size limits,
    parses CSV/XLSX, evaluates quality and leakage heuristics, and guarantees
    immediate cleanup of temporary files.
    """
    orig_name = file.filename or "uploaded_dataset"
    suffix = Path(orig_name).suffix.lower()
    
    if suffix not in (".csv", ".xlsx"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{suffix}'. Please upload a valid .csv or .xlsx file."
        )
        
    with temporary_upload_file(suffix) as main_temp_path:
        # Stream file to disk while checking size limit
        total_bytes = 0
        with open(main_temp_path, "wb") as f_out:
            while chunk := await file.read(64 * 1024):
                total_bytes += len(chunk)
                if total_bytes > settings.MAX_FILE_SIZE_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
                    )
                f_out.write(chunk)
                
        # Handle optional test split file
        test_df = None
        if test_file and test_file.filename:
            test_suffix = Path(test_file.filename).suffix.lower()
            with temporary_upload_file(test_suffix) as test_temp_path:
                with open(test_temp_path, "wb") as t_out:
                    shutil.copyfileobj(test_file.file, t_out)
                try:
                    test_df, _ = parse_dataset_file(test_temp_path, test_file.filename)
                except Exception as e:
                    logger.warning(f"Could not parse optional test split file: {e}")
                    
        # Parse main dataset and run audit
        try:
            df, metadata = parse_dataset_file(
                main_temp_path,
                orig_name,
                selected_sheet=selected_sheet
            )
            
            # Clean up target string if empty
            clean_target = target_column.strip() if target_column and target_column.strip() else None
            
            audit_result = audit_dataset(
                df=df,
                parser_metadata=metadata,
                target_column=clean_target,
                test_df=test_df
            )
            return audit_result
            
        except ParsingError as pe:
            raise HTTPException(status_code=pe.status_code, detail=pe.message)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Unexpected error during audit execution")
            raise HTTPException(status_code=500, detail=f"Internal audit error: {str(e)}")

@router.post("/reports/json")
def download_json_report(audit_data: AuditResponse):
    """Generates a downloadable JSON audit report."""
    content = generate_json_report(audit_data)
    filename = f"leaklens_audit_{audit_data.summary.filename}.json"
    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/reports/csv")
def download_csv_report(audit_data: AuditResponse):
    """Generates a downloadable CSV findings report."""
    content = generate_csv_report(audit_data)
    filename = f"leaklens_findings_{audit_data.summary.filename}.csv"
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.post("/reports/html")
def download_html_report(audit_data: AuditResponse):
    """Generates a downloadable standalone HTML summary report."""
    content = generate_html_report(audit_data)
    filename = f"leaklens_report_{audit_data.summary.filename}.html"
    return Response(
        content=content,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
