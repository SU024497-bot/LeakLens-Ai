import io
import csv
import logging
from pathlib import Path
from typing import Tuple, List, Optional
import pandas as pd
import openpyxl
from backend.app.core.config import settings

logger = logging.getLogger("leaklens.parser")

class ParsingError(Exception):
    def __init__(self, message: str, error_code: str = "PARSE_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code

def discover_excel_sheets(file_path: Path) -> List[str]:
    """Inspects an XLSX workbook and returns its sheet names safely."""
    try:
        wb = openpyxl.load_workbook(filename=file_path, read_only=True, data_only=True)
        sheet_names = wb.sheetnames
        wb.close()
        if not sheet_names:
            raise ParsingError("The Excel workbook contains no worksheets.", error_code="EMPTY_WORKBOOK")
        return sheet_names
    except ParsingError:
        raise
    except Exception as e:
        logger.error(f"Failed to inspect Excel workbook {file_path.name}: {e}")
        raise ParsingError(f"Invalid or corrupted Excel workbook: {str(e)}", error_code="INVALID_EXCEL")

def detect_csv_delimiter_and_encoding(file_path: Path) -> Tuple[str, str]:
    """Tries common encodings and sniffs delimiter safely."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252", "iso-8859-1"]
    
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                sample = f.read(8192)
            if not sample.strip():
                raise ParsingError("CSV file is completely empty.", error_code="EMPTY_FILE")
            
            # Detect delimiter using Sniffer with fallback
            try:
                sniffer = csv.Sniffer()
                dialect = sniffer.sniff(sample, delimiters=[",", ";", "\t", "|"])
                delimiter = dialect.delimiter
            except Exception:
                # Heuristic fallback: count frequency in sample
                comma_count = sample.count(",")
                semi_count = sample.count(";")
                tab_count = sample.count("\t")
                if tab_count > comma_count and tab_count > semi_count:
                    delimiter = "\t"
                elif semi_count > comma_count:
                    delimiter = ";"
                else:
                    delimiter = ","
                    
            return delimiter, enc
        except (UnicodeDecodeError, UnicodeError):
            continue
        except ParsingError:
            raise
        except Exception:
            continue
            
    # Fallback default
    return ",", "utf-8"

def parse_dataset_file(
    file_path: Path,
    original_filename: str,
    selected_sheet: Optional[str] = None
) -> Tuple[pd.DataFrame, dict]:
    """
    Safely parses CSV or XLSX into a Pandas DataFrame with resource guards.
    Returns (DataFrame, metadata_dict).
    """
    file_size = file_path.stat().st_size
    if file_size == 0:
        raise ParsingError("The uploaded file is empty (0 bytes).", error_code="EMPTY_FILE")
    if file_size > settings.MAX_FILE_SIZE_BYTES:
        max_mb = settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise ParsingError(
            f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum limit of {max_mb} MB.",
            error_code="FILE_TOO_LARGE",
            status_code=413
        )
        
    lower_name = original_filename.lower()
    metadata = {
        "original_filename": original_filename,
        "file_size_bytes": file_size,
        "format": "csv" if lower_name.endswith(".csv") else "xlsx" if lower_name.endswith(".xlsx") else "unknown",
        "sheet_name": None,
        "warnings": []
    }
    
    if lower_name.endswith(".csv"):
        delimiter, encoding = detect_csv_delimiter_and_encoding(file_path)
        metadata["delimiter"] = delimiter
        metadata["encoding"] = encoding
        
        try:
            # First check raw header line for duplicate column names
            with open(file_path, "r", encoding=encoding, errors="replace") as f:
                first_line = f.readline().strip()
                if not first_line:
                    raise ParsingError("CSV file header row is empty.", error_code="EMPTY_HEADER")
                raw_headers = [h.strip() for h in first_line.split(delimiter)]
                metadata["raw_headers"] = raw_headers
                
            df = pd.read_csv(
                file_path,
                sep=delimiter,
                encoding=encoding,
                nrows=settings.MAX_ROWS + 1,
                on_bad_lines="skip"
            )
        except ParsingError:
            raise
        except Exception as e:
            logger.error(f"Failed to parse CSV: {e}")
            raise ParsingError(f"Could not parse CSV file: {str(e)}", error_code="CSV_PARSE_FAILED")
            
    elif lower_name.endswith(".xlsx"):
        sheets = discover_excel_sheets(file_path)
        metadata["available_sheets"] = sheets
        
        target_sheet = selected_sheet if (selected_sheet and selected_sheet in sheets) else sheets[0]
        metadata["sheet_name"] = target_sheet
        
        try:
            # Use data_only=True via openpyxl engine to avoid executing formulas
            df = pd.read_excel(
                file_path,
                sheet_name=target_sheet,
                nrows=settings.MAX_ROWS + 1,
                engine="openpyxl"
            )
            # Store raw headers
            metadata["raw_headers"] = [str(col) for col in df.columns]
        except Exception as e:
            logger.error(f"Failed to parse Excel sheet {target_sheet}: {e}")
            raise ParsingError(f"Could not parse Excel worksheet '{target_sheet}': {str(e)}", error_code="XLSX_PARSE_FAILED")
            
    elif lower_name.endswith(".xls"):
        raise ParsingError("Legacy binary Excel (.xls) format is not supported. Please save as modern .xlsx or .csv.", error_code="UNSUPPORTED_FORMAT")
    else:
        raise ParsingError(f"Unsupported file format '{Path(original_filename).suffix}'. Only .csv and .xlsx files are supported.", error_code="UNSUPPORTED_FORMAT")
        
    if df.empty:
        raise ParsingError("The dataset contains 0 rows of data.", error_code="EMPTY_DATASET")
        
    if len(df) > settings.MAX_ROWS:
        raise ParsingError(f"Dataset row count exceeds maximum allowed limit of {settings.MAX_ROWS:,} rows.", error_code="ROW_LIMIT_EXCEEDED")
        
    if len(df.columns) > settings.MAX_COLUMNS:
        raise ParsingError(f"Dataset column count ({len(df.columns)}) exceeds maximum allowed limit of {settings.MAX_COLUMNS} columns.", error_code="COLUMN_LIMIT_EXCEEDED")
        
    # Standardize column headers to string
    df.columns = [str(c).strip() for c in df.columns]
    
    return df, metadata
