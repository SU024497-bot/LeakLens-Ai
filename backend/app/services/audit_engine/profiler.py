import math
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from backend.app.schemas.audit import ColumnProfile, CorrelationInfo, DatasetSummary

def infer_column_type(series: pd.Series, col_name: str) -> str:
    """Infers semantic data type accurately."""
    clean = series.dropna()
    total = len(series)
    unique_cnt = clean.nunique()
    
    if unique_cnt == 0:
        return "constant"
    if unique_cnt == 1:
        return "constant"
        
    lower_name = col_name.lower()
    
    # Check ID candidate
    if unique_cnt == total and (
        "id" in lower_name or "uuid" in lower_name or "key" in lower_name or "index" in lower_name or "code" in lower_name
    ):
        return "id_candidate"
        
    # Check boolean
    if unique_cnt == 2:
        vals = set(clean.unique())
        if vals.issubset({0, 1, True, False, "0", "1", "true", "false", "True", "False", "yes", "no", "Yes", "No", "Y", "N"}):
            return "boolean"
            
    # Check numeric
    if pd.api.types.is_numeric_dtype(series):
        # If float with few integers, could be categorical
        if unique_cnt <= 10 and total > 50:
            return "categorical"
        return "numeric"
        
    # Check datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if "date" in lower_name or "time" in lower_name or "timestamp" in lower_name or "year" in lower_name:
        try:
            pd.to_datetime(clean.iloc[:50], errors="raise")
            return "datetime"
        except Exception:
            pass
            
    # Categorical vs text
    if unique_cnt <= 50 or (unique_cnt / total < 0.15 and total > 30):
        return "categorical"
        
    if unique_cnt / total > 0.9 and total > 50:
        return "id_candidate"
        
    return "text"

def profile_dataset(
    df: pd.DataFrame,
    filename: str,
    file_format: str,
    sheet_name: Optional[str] = None,
    target_column: Optional[str] = None
) -> Tuple[DatasetSummary, List[ColumnProfile], List[CorrelationInfo]]:
    """Calculates comprehensive dataset profiling statistics and correlations."""
    row_count = len(df)
    col_count = len(df.columns)
    
    # Memory estimation in MB
    mem_bytes = df.memory_usage(deep=True).sum()
    mem_mb = round(mem_bytes / (1024 * 1024), 2)
    
    # Duplicate rows
    dup_row_count = int(df.duplicated().sum())
    dup_row_pct = round((dup_row_count / row_count * 100), 2) if row_count > 0 else 0.0
    
    # Missing cells
    total_cells = row_count * col_count
    total_missing = int(df.isna().sum().sum())
    total_missing_pct = round((total_missing / total_cells * 100), 2) if total_cells > 0 else 0.0
    
    # Target validation
    target_type = None
    if target_column and target_column in df.columns:
        target_type = infer_column_type(df[target_column], target_column)
        
    summary = DatasetSummary(
        filename=filename,
        file_format=file_format,
        sheet_name=sheet_name,
        row_count=row_count,
        column_count=col_count,
        memory_usage_mb=mem_mb,
        duplicate_row_count=dup_row_count,
        duplicate_row_percentage=dup_row_pct,
        total_missing_cells=total_missing,
        total_missing_percentage=total_missing_pct,
        target_column=target_column if target_column in df.columns else None,
        target_type=target_type,
        split_mode="single_dataset"
    )
    
    # Column Profiles
    column_profiles: List[ColumnProfile] = []
    
    for col in df.columns:
        series = df[col]
        null_count = int(series.isna().sum())
        null_pct = round((null_count / row_count * 100), 2) if row_count > 0 else 0.0
        clean_series = series.dropna()
        unique_count = int(clean_series.nunique())
        unique_pct = round((unique_count / row_count * 100), 2) if row_count > 0 else 0.0
        
        inferred = infer_column_type(series, col)
        
        # Sample values (up to 5 readable items)
        samples = []
        for val in clean_series.unique()[:5]:
            if isinstance(val, (np.integer, int)):
                samples.append(int(val))
            elif isinstance(val, (np.floating, float)):
                samples.append(round(float(val), 4) if not math.isnan(val) else None)
            else:
                samples.append(str(val)[:100])
                
        # Stats computation
        stats: Dict[str, Any] = {}
        suspicious_flags: List[str] = []
        
        if inferred == "constant":
            suspicious_flags.append("CONSTANT_COLUMN")
        if null_pct > 40.0:
            suspicious_flags.append("HIGH_MISSING_PERCENTAGE")
        if inferred == "id_candidate":
            suspicious_flags.append("POTENTIAL_HIGH_CARDINALITY_IDENTIFIER")
            
        if inferred in ("numeric", "boolean") and pd.api.types.is_numeric_dtype(series):
            num_series = pd.to_numeric(clean_series, errors="coerce").dropna()
            if not num_series.empty:
                stats["min"] = round(float(num_series.min()), 4)
                stats["max"] = round(float(num_series.max()), 4)
                stats["mean"] = round(float(num_series.mean()), 4)
                stats["std"] = round(float(num_series.std()), 4) if len(num_series) > 1 else 0.0
                stats["median"] = round(float(num_series.median()), 4)
                stats["q25"] = round(float(num_series.quantile(0.25)), 4)
                stats["q75"] = round(float(num_series.quantile(0.75)), 4)
        else:
            # Categorical frequency stats
            top_counts = clean_series.value_counts().head(5)
            top_dict = {}
            for k, v in top_counts.items():
                top_dict[str(k)[:50]] = int(v)
            stats["top_frequencies"] = top_dict
            
        column_profiles.append(ColumnProfile(
            name=col,
            inferred_type=inferred,
            total_count=row_count,
            null_count=null_count,
            null_percentage=null_pct,
            unique_count=unique_count,
            unique_percentage=unique_pct,
            sample_values=samples,
            stats=stats,
            suspicious_flags=suspicious_flags
        ))
        
    # Correlations computation
    correlations: List[CorrelationInfo] = []
    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    
    # Pairwise correlations between numeric columns (limit to top associations)
    if len(numeric_cols) >= 2:
        corr_matrix = df[numeric_cols].corr(method="pearson").abs()
        seen_pairs = set()
        
        for i in range(len(numeric_cols)):
            col1 = numeric_cols[i]
            for j in range(i + 1, len(numeric_cols)):
                col2 = numeric_cols[j]
                val = corr_matrix.loc[col1, col2]
                if not math.isnan(val) and val >= 0.5:
                    pair_key = tuple(sorted([col1, col2]))
                    if pair_key not in seen_pairs:
                        seen_pairs.add(pair_key)
                        interpretation = (
                            "Suspiciously near-identical" if val >= 0.98 else
                            "Very high linear association" if val >= 0.85 else
                            "Moderate-high correlation"
                        )
                        correlations.append(CorrelationInfo(
                            column1=col1,
                            column2=col2,
                            metric_name="Pearson |r|",
                            value=round(float(val), 4),
                            interpretation=interpretation
                        ))
                        
    # Sort correlations by highest value first
    correlations.sort(key=lambda x: x.value, reverse=True)
    correlations = correlations[:25]  # Keep most informative
    
    return summary, column_profiles, correlations
