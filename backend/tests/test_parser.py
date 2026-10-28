import pytest
import pandas as pd
from pathlib import Path
from backend.app.services.parser import (
    parse_dataset_file, discover_excel_sheets, ParsingError
)

def test_parse_valid_csv(tmp_path):
    csv_file = tmp_path / "valid.csv"
    csv_file.write_text("id,feature1,feature2\n1,10.5,A\n2,20.0,B\n3,30.2,C\n", encoding="utf-8")
    
    df, meta = parse_dataset_file(csv_file, "valid.csv")
    assert len(df) == 3
    assert list(df.columns) == ["id", "feature1", "feature2"]
    assert meta["format"] == "csv"
    assert meta["delimiter"] == ","

def test_parse_semicolon_csv(tmp_path):
    csv_file = tmp_path / "semi.csv"
    csv_file.write_text("id;feature1;target\n1;100;0\n2;200;1\n", encoding="utf-8")
    
    df, meta = parse_dataset_file(csv_file, "semi.csv")
    assert len(df) == 2
    assert "target" in df.columns
    assert meta["delimiter"] == ";"

def test_parse_empty_csv(tmp_path):
    csv_file = tmp_path / "empty.csv"
    csv_file.write_text("", encoding="utf-8")
    
    with pytest.raises(ParsingError) as exc:
        parse_dataset_file(csv_file, "empty.csv")
    assert exc.value.error_code == "EMPTY_FILE"

def test_unsupported_format(tmp_path):
    bad_file = tmp_path / "document.pdf"
    bad_file.write_text("dummy", encoding="utf-8")
    
    with pytest.raises(ParsingError) as exc:
        parse_dataset_file(bad_file, "document.pdf")
    assert exc.value.error_code == "UNSUPPORTED_FORMAT"

def test_parse_excel_multisheet(tmp_path):
    xlsx_file = tmp_path / "test.xlsx"
    with pd.ExcelWriter(xlsx_file, engine="openpyxl") as writer:
        pd.DataFrame({"a": [1, 2]}).to_excel(writer, sheet_name="SheetA", index=False)
        pd.DataFrame({"b": [3, 4]}).to_excel(writer, sheet_name="SheetB", index=False)
        
    sheets = discover_excel_sheets(xlsx_file)
    assert sheets == ["SheetA", "SheetB"]
    
    df, meta = parse_dataset_file(xlsx_file, "test.xlsx", selected_sheet="SheetB")
    assert "b" in df.columns
    assert meta["sheet_name"] == "SheetB"
