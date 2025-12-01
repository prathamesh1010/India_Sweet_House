from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import re
from pathlib import Path
import tempfile
import os
import traceback
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'xlsx', 'xls', 'csv'}

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ------------------------------
# Helper functions from data_backend.py
# ------------------------------
def norm_str(x):
    if pd.isna(x):
        return ""
    s = str(x)
    # remove NBSP & zero-widths; collapse whitespace
    s = s.replace("\xa0"," ").replace("\u200b","").replace("\u200c","").replace("\u200d","")
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def norm_upper(x):
    return norm_str(x).upper()

def detect_header(df0):
    """
    Return (hdr_row, part_col) using:
      A) exact 'PARTICULARS'
      B) substring 'PARTICULARS'
      C) fallback: row with most Month-YY tokens
    """
    # Apply norm_upper to all cells
    df_str = df0.copy()
    for col in df_str.columns:
        df_str[col] = df_str[col].apply(lambda x: norm_upper(x) if pd.notna(x) else "")

    # A) exact
    eq_pos = list(zip(*np.where(df_str.values == "PARTICULARS")))
    if eq_pos:
        return int(eq_pos[0][0]), int(eq_pos[0][1])

    # B) contains
    has_pos = list(zip(*np.where(df_str.apply(lambda s: isinstance(s, str) and "PARTICULARS" in s, axis=1).values)))
    if has_pos:
        return int(has_pos[0][0]), int(has_pos[0][1])

    # C) fallback
    month_re = re.compile(r"^[A-Z]+-\d{2}(?:\.\d+)?$")
    counts = [ sum(bool(month_re.match(v)) for v in df_str.iloc[i]) for i in range(df_str.shape[0]) ]
    hdr_row = int(np.argmax(counts))
    row_vals = list(df_str.iloc[hdr_row])
    if "PARTICULARS" in row_vals:
        part_col = row_vals.index("PARTICULARS")
    else:
        part_col = next((j for j, v in enumerate(row_vals) if norm_str(v)), 0)
    return hdr_row, part_col

def get_name(df_raw, base_row, base_col, max_up=6, max_dx=2):
    """
    Find a non-empty text near (base_row, base_col) by scanning up to 'max_up' rows
    upwards and +/- 'max_dx' columns laterally (0, -1, +1, -2, +2).
    Handles merged headers and slight misalignments.
    """
    h, w = df_raw.shape
    for up in range(0, max_up + 1):
        r = base_row - up
        if r < 0:
            break
        for dx in [0, -1, 1, -2, 2]:
            c = base_col + dx
            if 0 <= c < w:
                v = norm_str(df_raw.iat[r, c])
                if v:
                    return v
    return ""

def process_outlet_wise_worksheet(file_path):
    """
    Process the 'Outlet wise' worksheet from multi-sheet files (same format as data5.xlsx)
    """
    try:
        print("[INFO] Processing 'Outlet wise' worksheet")
        
        # Read the "Outlet wise" worksheet with no header to preserve raw layout
        # Limit to first 1000 rows for performance
        df0 = pd.read_excel(file_path, sheet_name="Outlet wise", header=None, engine="openpyxl", nrows=1000)
        print(f"[INFO] Raw data shape (limited to 1000 rows): {df0.shape}")
        
        # Detect header row/column using existing logic
        hdr_row, part_col = detect_header(df0)
        print(f"[INFO] Header detected at row={hdr_row}, particulars_col={part_col}")

        # Rows above header where Outlet/Manager live
        outlet_row = max(hdr_row - 1, 0)   # often the outlet names
        manager_row = max(hdr_row - 3, 0)  # often the managers

        # Build headered DataFrame from hdr_row
        df_after = df0.iloc[hdr_row:, :].copy()

        # Build a parallel array of original column indices
        orig_idx_full = np.arange(df0.shape[1])
        orig_idx_after = orig_idx_full.copy()

        # Set header from the first row of df_after
        df_after.columns = df_after.iloc[0]
        df_after = df_after.iloc[1:].reset_index(drop=True)

        # Slice columns from 'Particulars' **by position**
        df_after = df_after.iloc[:, part_col:].copy()
        orig_idx_after = orig_idx_after[part_col:]  # keep the same slice for the index map

        # Rename first column to 'Particulars'
        new_cols = list(df_after.columns)
        new_cols[0] = "Particulars"
        df_after.columns = new_cols

        # Compute a mask of entirely empty columns (over the data area)
        empty_cols_mask = df_after.isna().all(axis=0).values
        
        # Additional check: don't remove columns that might be outlet columns (have month patterns)
        month_re = re.compile(r"^[A-Za-z]+-\d{2}(?:\.\d+)?$")
        pct_re = re.compile(r"^%(?:\.\d+)?$")
        
        for i, col in enumerate(df_after.columns):
            if empty_cols_mask[i]:  # If column is empty
                col_name = norm_str(col)
                # Don't remove if it looks like a month column or % column
                if month_re.match(col_name) or pct_re.match(col_name):
                    empty_cols_mask[i] = False
        
        # Apply the same mask to BOTH df_after and the index map
        df_after = df_after.loc[:, ~empty_cols_mask].copy()
        orig_idx_after = orig_idx_after[~empty_cols_mask]

        print(f"[INFO] After filtering empty columns: {df_after.shape}")

        # Filter required metrics
        required_rows = [
            "Direct Income",
            "TOTAL REVENUE",
            "COGS",
            "Outlet Expenses",
            "EBIDTA",
            "Finance Cost",
            "01-Bank Charges",
            "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan",
            "04-MG",
            "PBT",
            "WASTAGE",
        ]
        
        df_after["Particulars"] = df_after["Particulars"].astype(str).apply(norm_str)
        df_req = df_after[df_after["Particulars"].isin(required_rows)].reset_index(drop=True)
        
        print(f"[INFO] Found {len(df_req)} required metric rows")
        
        if df_req.empty:
            print("DEBUG — Available 'Particulars' values (first 30):")
            available_particulars = df_after["Particulars"].dropna().unique()[:30]
            print(available_particulars)
            
            # Try to find similar matches
            print("DEBUG — Looking for similar matches...")
            for req_row in required_rows:
                matches = [p for p in available_particulars if req_row.lower() in str(p).lower()]
                if matches:
                    print(f"  '{req_row}' might match: {matches}")
            
            raise ValueError("None of the required rows were found under 'Particulars'.")

        # Detect all outlet (Month, %) column pairs by **position** - AFTER filtering
        cols = list(df_after.columns)  # Use df_after (after empty column filtering) instead of df_req
        month_re = re.compile(r"^[A-Za-z]+-\d{2}(?:\.\d+)?$")
        pct_re   = re.compile(r"^%(?:\.\d+)?$")

        outlet_blocks = []
        for i in range(1, len(cols) - 1):  # 0 is 'Particulars'
            cname = norm_str(cols[i])
            nname = norm_str(cols[i+1])
            if month_re.match(cname) and (nname == "%" or pct_re.match(nname)):
                outlet_blocks.append((i, cols[i], cols[i+1]))

        print(f"[INFO] Found {len(outlet_blocks)} outlet blocks")

        if not outlet_blocks:
            print("DEBUG — Columns after 'Particulars':", cols[:20], " ... total:", len(cols))
            print("DEBUG — Looking for month patterns...")
            for i, col in enumerate(cols[1:6]):  # Check first 5 columns after Particulars
                print(f"  Column {i+1}: '{col}' -> month_match: {bool(month_re.match(norm_str(col)))}")
            raise ValueError("No Month/% pairs detected (e.g., 'June-25' followed by '%').")

        # Build final rows
        final_rows = []
        skipped_count = 0

        for (val_idx, val_col_name, pct_col_name) in outlet_blocks:
            # Map df_after column position -> original df0 column index
            orig_col_idx = int(orig_idx_after[val_idx])

            # Outlet / Manager via robust scanning
            outlet_name  = get_name(df0, outlet_row,  orig_col_idx, max_up=6, max_dx=2)
            manager_name = get_name(df0, manager_row, orig_col_idx, max_up=8, max_dx=2)

            # Skip consolidated summary column if it happens to be detected
            if outlet_name.lower() == "consolidated summary" or "consolidated" in outlet_name.lower():
                skipped_count += 1
                continue

            # Month label
            month_label = norm_str(val_col_name)
            month = month_label.split("-")[0] if "-" in month_label else month_label

            row = {
                "Outlet": outlet_name,
                "Outlet Manager": manager_name,
                "Month": month
            }

            # Copy metrics by position
            for _, req_row in df_req.iterrows():
                metric = req_row["Particulars"]
                value  = req_row.iat[val_idx] if val_idx < df_req.shape[1] else np.nan
                row[metric] = value

            final_rows.append(row)

        df_final = pd.DataFrame(final_rows)
        print(f"[INFO] Created {len(df_final)} final outlet records")
        print(f"[INFO] Skipped {skipped_count} consolidated outlets")
        print(f"[INFO] Total outlet blocks processed: {len(outlet_blocks)}")

        # Order + numeric coercion
        required_order = [
            "Outlet", "Outlet Manager", "Month",
            "Direct Income", "TOTAL REVENUE", "COGS", "Outlet Expenses",
            "EBIDTA", "Finance Cost",
            "01-Bank Charges", "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan", "04-MG",
            "PBT", "WASTAGE"
        ]
        for c in required_order:
            if c not in df_final.columns:
                df_final[c] = np.nan
        df_final = df_final[required_order].copy()

        num_cols = [c for c in required_order if c not in ("Outlet", "Outlet Manager", "Month")]
        df_final[num_cols] = df_final[num_cols].apply(pd.to_numeric, errors="coerce")

        # Convert to list of dictionaries for JSON serialization
        df_final_clean = df_final.replace({np.nan: None})
        result_data = df_final_clean.to_dict('records')
        
        return {
            "success": True,
            "data": result_data,
            "outlets_count": len(df_final),
            "message": f"Successfully processed {len(df_final)} outlet records from 'Outlet wise' worksheet"
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Outlet wise worksheet processing failed: {str(e)}",
            "traceback": traceback.format_exc()
        }

def process_multi_worksheet_outlets(file_path, outlet_sheets):
    """
    Process multi-worksheet outlet files where each outlet has its own sheet
    """
    try:
        print(f"[INFO] Processing {len(outlet_sheets)} outlet sheets from multi-worksheet file")
        
        all_outlet_data = []
        processed_outlets = 0
        failed_outlets = 0
        
        # Required financial metrics to extract
        required_metrics = [
            "Direct Income",
            "TOTAL REVENUE", 
            "COGS",
            "Outlet Expenses",
            "EBIDTA",
            "Finance Cost",
            "01-Bank Charges",
            "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan",
            "04-MG",
            "PBT",
            "WASTAGE"
        ]
        
        for sheet_name in outlet_sheets:
            try:
                print(f"[INFO] Processing outlet sheet: {sheet_name}")
                
                # Read the sheet with no header to preserve raw layout
                df_raw = pd.read_excel(file_path, sheet_name=sheet_name, header=None, engine='openpyxl')
                
                # Find the header row containing "Particulars"
                hdr_row, part_col = detect_header(df_raw)
                print(f"[INFO] Header found at row {hdr_row}, column {part_col} for {sheet_name}")
                
                # Extract outlet name and manager from the sheet
                # Look for outlet name in the first few rows
                outlet_name = ""
                manager_name = ""
                month = "June-25"  # Default month, can be extracted from sheet if needed
                
                # Try to find outlet name and manager in the first few rows
                for row_idx in range(min(5, df_raw.shape[0])):
                    for col_idx in range(min(5, df_raw.shape[1])):
                        cell_value = str(df_raw.iloc[row_idx, col_idx]).strip()
                        if cell_value and cell_value != 'nan' and cell_value != 'None':
                            # Look for outlet name patterns
                            if any(keyword in cell_value.lower() for keyword in ['mg', 'nagar', 'layout', 'road', 'club', 'paakashaala', 'nagar', 'layout']):
                                outlet_name = cell_value
                            # Look for manager name patterns (contains numbers and names)
                            elif any(char.isdigit() for char in cell_value) and any(char.isalpha() for char in cell_value):
                                if '-' in cell_value:
                                    manager_name = cell_value.split('-', 1)[1].strip()
                                else:
                                    manager_name = cell_value
                
                # If we couldn't find outlet name, use sheet name
                if not outlet_name:
                    outlet_name = sheet_name
                
                # If we couldn't find manager name, use sheet name
                if not manager_name:
                    manager_name = sheet_name
                
                print(f"[INFO] Extracted - Outlet: {outlet_name}, Manager: {manager_name}")
                
                # Process the financial data from this sheet
                df_after = df_raw.iloc[hdr_row:, :].copy()
                
                # Check if we have enough rows
                if df_after.shape[0] < 2:
                    print(f"[WARNING] Not enough data rows in sheet {sheet_name}")
                    failed_outlets += 1
                    continue
                
                # Set column names from first row
                df_after.columns = df_after.iloc[0]
                df_after = df_after.iloc[1:].reset_index(drop=True)
                
                # Check if 'Particulars' column exists
                if 'Particulars' not in df_after.columns:
                    print(f"[WARNING] 'Particulars' column not found in sheet {sheet_name}")
                    failed_outlets += 1
                    continue
                
                # Filter to get only the required metrics
                df_after["Particulars"] = df_after["Particulars"].astype(str).apply(norm_str)
                df_metrics = df_after[df_after["Particulars"].isin(required_metrics)].reset_index(drop=True)
                
                if df_metrics.empty:
                    print(f"[WARNING] No required metrics found in sheet {sheet_name}")
                    failed_outlets += 1
                    continue
                
                # Extract the financial values (usually in the first data column after Particulars)
                # Look for the first column with numeric data
                data_column = None
                for col in df_metrics.columns[1:]:
                    if col != "Particulars" and col is not None:
                        # Check if this column has numeric data
                        try:
                            numeric_values = pd.to_numeric(df_metrics[col], errors='coerce')
                            if not numeric_values.isna().all() and numeric_values.sum() > 0:
                                data_column = col
                                break
                        except:
                            continue
                
                if data_column is None:
                    print(f"[WARNING] No numeric data column found in sheet {sheet_name}")
                    print(f"[DEBUG] Available columns: {list(df_metrics.columns)}")
                    failed_outlets += 1
                    continue
                
                # Create outlet record
                outlet_record = {
                    "Outlet": outlet_name,
                    "Outlet Manager": manager_name,
                    "Month": month
                }
                
                # Extract each metric value
                for _, row in df_metrics.iterrows():
                    metric_name = row["Particulars"]
                    metric_value = pd.to_numeric(row[data_column], errors='coerce')
                    if not pd.isna(metric_value):
                        outlet_record[metric_name] = float(metric_value)
                    else:
                        outlet_record[metric_name] = 0.0
                
                # Ensure all required metrics are present
                for metric in required_metrics:
                    if metric not in outlet_record:
                        outlet_record[metric] = 0.0
                
                all_outlet_data.append(outlet_record)
                processed_outlets += 1
                print(f"[INFO] Successfully processed {sheet_name} - Revenue: {outlet_record.get('TOTAL REVENUE', 0)}")
                
            except Exception as sheet_error:
                print(f"[ERROR] Failed to process sheet {sheet_name}: {str(sheet_error)}")
                failed_outlets += 1
                continue
        
        print(f"[INFO] Multi-worksheet processing complete: {processed_outlets} outlets processed, {failed_outlets} failed")
        
        if not all_outlet_data:
            raise ValueError("No outlet data could be extracted from any worksheet")
        
        # Convert to DataFrame for final processing
        df_final = pd.DataFrame(all_outlet_data)
        
        # Ensure proper column order
        required_order = [
            "Outlet", "Outlet Manager", "Month",
            "Direct Income", "TOTAL REVENUE", "COGS", "Outlet Expenses",
            "EBIDTA", "Finance Cost",
            "01-Bank Charges", "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan", "04-MG",
            "PBT", "WASTAGE"
        ]
        
        # Add missing columns
        for col in required_order:
            if col not in df_final.columns:
                df_final[col] = 0.0
        
        df_final = df_final[required_order].copy()
        
        # Convert to list of dictionaries for JSON serialization
        df_final_clean = df_final.replace({np.nan: None})
        result_data = df_final_clean.to_dict('records')
        
        return {
            "success": True,
            "data": result_data,
            "outlets_count": len(df_final),
            "processed_outlets": processed_outlets,
            "failed_outlets": failed_outlets,
            "message": f"Successfully processed {processed_outlets} outlets from {len(outlet_sheets)} worksheets (multi-worksheet format)"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Multi-worksheet processing failed: {str(e)}",
            "traceback": traceback.format_exc()
        }

def process_financial_data(file_path):
    """
    Process financial data using the logic from data_backend.py
    """
    try:
        # First, check if this file has an "Outlet wise" worksheet (like Outlet PL June-25.xlsx)
        try:
            # Read all sheet names to check for "Outlet wise" worksheet
            xl_file = pd.ExcelFile(file_path, engine='openpyxl')
            sheet_names = xl_file.sheet_names
            
            print(f"[INFO] Found {len(sheet_names)} worksheets: {sheet_names}")
            
            # Check if "Outlet wise" worksheet exists
            if "Outlet wise" in sheet_names:
                print("[INFO] Found 'Outlet wise' worksheet, processing it directly")
                return process_outlet_wise_worksheet(file_path)
            
        except Exception as multi_error:
            print(f"[INFO] Multi-worksheet detection failed, trying single sheet: {multi_error}")
        
        # First, try to read as a clean outlet-based format (like data5.xlsx)
        try:
            df_clean = pd.read_excel(file_path, engine="openpyxl")
            
            # Check if this is already in the clean format (outlets as rows)
            # Also check for financial metrics to ensure it's a complete clean format
            has_outlet_col = 'Outlet' in df_clean.columns
            has_manager_col = 'Outlet Manager' in df_clean.columns
            has_financial_metrics = any(col in df_clean.columns for col in ['TOTAL REVENUE', 'Direct Income', 'COGS', 'EBIDTA'])
            
            print(f"[DEBUG] Clean format detection: has_outlet_col={has_outlet_col}, has_manager_col={has_manager_col}, has_financial_metrics={has_financial_metrics}")
            print(f"[DEBUG] Available columns: {list(df_clean.columns)}")
            
            if has_outlet_col and has_manager_col and has_financial_metrics:
                print("[INFO] Detected clean outlet-based format")
                
                # Process the clean format directly
                df_final = df_clean.copy()
                
                # Ensure required columns exist
                required_columns = [
                    "Outlet", "Outlet Manager", "Month",
                    "Direct Income", "TOTAL REVENUE", "COGS", "Outlet Expenses",
                    "EBIDTA", "Finance Cost", "PBT", "WASTAGE"
                ]
                
                # Add missing columns with NaN values
                for col in required_columns:
                    if col not in df_final.columns:
                        df_final[col] = np.nan
                
                # Reorder columns
                df_final = df_final[required_columns].copy()
                
                # Convert numeric columns
                numeric_cols = [c for c in required_columns if c not in ("Outlet", "Outlet Manager", "Month")]
                df_final[numeric_cols] = df_final[numeric_cols].apply(pd.to_numeric, errors="coerce")
                
                # Filter out only consolidated summary outlets (include all outlets regardless of revenue)
                df_final_filtered = df_final[
                    (~df_final['Outlet'].str.contains('consolidated', case=False, na=False))
                ].copy()
                
                # Convert to list of dictionaries for JSON serialization
                # Replace NaN values with None for proper JSON serialization
                df_final_clean = df_final_filtered.replace({np.nan: None})
                result_data = df_final_clean.to_dict('records')
                
                return {
                    "success": True,
                    "data": result_data,
                    "outlets_count": len(df_final_filtered),
                    "message": f"Successfully processed {len(df_final_filtered)} outlet records from clean format (includes all outlets regardless of revenue status)"
                }
                
        except Exception as clean_error:
            print(f"[INFO] Clean format failed, trying raw format: {clean_error}")
            print(f"[DEBUG] Clean format error details: {str(clean_error)}")
            import traceback
            print(f"[DEBUG] Clean format traceback: {traceback.format_exc()}")
        
        # If clean format fails, try the original raw processing logic
        print("[INFO] Trying raw format processing...")
        
        # Read workbook with NO header (keep raw layout)
        # For large files, limit the number of rows to process
        df0 = pd.read_excel(file_path, header=None, engine="openpyxl", nrows=1000)
        print(f"[INFO] Raw data shape (limited to 1000 rows): {df0.shape}")
        
        # Detect header row/column
        hdr_row, part_col = detect_header(df0)
        print(f"[INFO] Header detected at row={hdr_row}, particulars_col={part_col}")

        # Rows above header where Outlet/Manager live (adjust if needed)
        outlet_row  = max(hdr_row - 1, 0)   # often the outlet names
        manager_row = max(hdr_row - 3, 0)   # often the managers

        # Build headered DataFrame from hdr_row
        df_after = df0.iloc[hdr_row:, :].copy()

        # Build a parallel array of original column indices
        orig_idx_full = np.arange(df0.shape[1])
        orig_idx_after = orig_idx_full.copy()

        # Set header from the first row of df_after
        df_after.columns = df_after.iloc[0]
        df_after = df_after.iloc[1:].reset_index(drop=True)

        # Slice columns from 'Particulars' **by position**
        df_after = df_after.iloc[:, part_col:].copy()
        orig_idx_after = orig_idx_after[part_col:]  # keep the same slice for the index map

        # Rename first column to 'Particulars'
        new_cols = list(df_after.columns)
        new_cols[0] = "Particulars"
        df_after.columns = new_cols

        # Compute a mask of entirely empty columns (over the data area)
        # Be more conservative - only remove columns that are completely empty AND don't have month patterns
        empty_cols_mask = df_after.isna().all(axis=0).values
        
        # Additional check: don't remove columns that might be outlet columns (have month patterns)
        month_re = re.compile(r"^[A-Za-z]+-\d{2}(?:\.\d+)?$")
        pct_re = re.compile(r"^%(?:\.\d+)?$")
        
        for i, col in enumerate(df_after.columns):
            if empty_cols_mask[i]:  # If column is empty
                col_name = norm_str(col)
                # Don't remove if it looks like a month column or % column
                if month_re.match(col_name) or pct_re.match(col_name):
                    empty_cols_mask[i] = False
        
        # Apply the same mask to BOTH df_after and the index map
        df_after = df_after.loc[:, ~empty_cols_mask].copy()
        orig_idx_after = orig_idx_after[~empty_cols_mask]

        print(f"[INFO] After filtering empty columns: {df_after.shape}")

        # Filter required metrics
        required_rows = [
            "Direct Income",
            "TOTAL REVENUE",
            "COGS",
            "Outlet Expenses",
            "EBIDTA",
            "Finance Cost",
            "01-Bank Charges",
            "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan",
            "04-MG",
            "PBT",
            "WASTAGE",
        ]
        
        # Additional interest-related metrics for better analysis
        interest_metrics = [
            "01-Bank Charges",
            "02-Interest on Borrowings", 
            "03-Interest on Vehicle Loan",
            "04-MG",
            "Finance Cost"
        ]
        df_after["Particulars"] = df_after["Particulars"].astype(str).apply(norm_str)
        df_req = df_after[df_after["Particulars"].isin(required_rows)].reset_index(drop=True)
        
        print(f"[INFO] Found {len(df_req)} required metric rows")
        
        if df_req.empty:
            print("DEBUG — Available 'Particulars' values (first 30):")
            available_particulars = df_after["Particulars"].dropna().unique()[:30]
            print(available_particulars)
            
            # Try to find similar matches
            print("DEBUG — Looking for similar matches...")
            for req_row in required_rows:
                matches = [p for p in available_particulars if req_row.lower() in str(p).lower()]
                if matches:
                    print(f"  '{req_row}' might match: {matches}")
            
            raise ValueError("None of the required rows were found under 'Particulars'.")

        # Detect all outlet (Month, %) column pairs by **position** - AFTER filtering
        cols = list(df_after.columns)  # Use df_after (after empty column filtering) instead of df_req
        month_re = re.compile(r"^[A-Za-z]+-\d{2}(?:\.\d+)?$")
        pct_re   = re.compile(r"^%(?:\.\d+)?$")

        outlet_blocks = []
        for i in range(1, len(cols) - 1):  # 0 is 'Particulars'
            cname = norm_str(cols[i])
            nname = norm_str(cols[i+1])
            if month_re.match(cname) and (nname == "%" or pct_re.match(nname)):
                outlet_blocks.append((i, cols[i], cols[i+1]))

        print(f"[INFO] Found {len(outlet_blocks)} outlet blocks")

        if not outlet_blocks:
            print("DEBUG — Columns after 'Particulars':", cols[:20], " ... total:", len(cols))
            print("DEBUG — Looking for month patterns...")
            for i, col in enumerate(cols[1:6]):  # Check first 5 columns after Particulars
                print(f"  Column {i+1}: '{col}' -> month_match: {bool(month_re.match(norm_str(col)))}")
            raise ValueError("No Month/% pairs detected (e.g., 'June-25' followed by '%').")

        # Build final rows
        final_rows = []
        skipped_count = 0

        for (val_idx, val_col_name, pct_col_name) in outlet_blocks:
            # Map df_after column position -> original df0 column index
            # val_idx now corresponds directly to orig_idx_after since we used df_after.columns
            orig_col_idx = int(orig_idx_after[val_idx])

            # Outlet / Manager via robust scanning
            outlet_name  = get_name(df0, outlet_row,  orig_col_idx, max_up=6, max_dx=2)
            manager_name = get_name(df0, manager_row, orig_col_idx, max_up=8, max_dx=2)

            # Skip consolidated summary column if it happens to be detected
            if outlet_name.lower() == "consolidated summary" or "consolidated" in outlet_name.lower():
                skipped_count += 1
                continue

            # Month label
            month_label = norm_str(val_col_name)
            month = month_label.split("-")[0] if "-" in month_label else month_label

            row = {
                "Outlet": outlet_name,
                "Outlet Manager": manager_name,
                "Month": month
            }

            # Copy metrics by position
            for _, req_row in df_req.iterrows():
                metric = req_row["Particulars"]
                value  = req_row.iat[val_idx] if val_idx < df_req.shape[1] else np.nan
                row[metric] = value

            # Note: Zero revenue outlets are now correctly included in calculations

            final_rows.append(row)

        df_final = pd.DataFrame(final_rows)
        print(f"[INFO] Created {len(df_final)} final outlet records")
        print(f"[INFO] Skipped {skipped_count} consolidated outlets")
        print(f"[INFO] Total outlet blocks processed: {len(outlet_blocks)}")

        # Order + numeric coercion
        required_order = [
            "Outlet", "Outlet Manager", "Month",
            "Direct Income", "TOTAL REVENUE", "COGS", "Outlet Expenses",
            "EBIDTA", "Finance Cost",
            "01-Bank Charges", "02-Interest on Borrowings",
            "03-Interest on Vehicle Loan", "04-MG",
            "PBT", "WASTAGE"
        ]
        for c in required_order:
            if c not in df_final.columns:
                df_final[c] = np.nan
        df_final = df_final[required_order].copy()

        num_cols = [c for c in required_order if c not in ("Outlet", "Outlet Manager", "Month")]
        df_final[num_cols] = df_final[num_cols].apply(pd.to_numeric, errors="coerce")

        # Convert to list of dictionaries for JSON serialization
        # Replace NaN values with None for proper JSON serialization
        df_final_clean = df_final.replace({np.nan: None})
        result_data = df_final_clean.to_dict('records')
        
        return {
            "success": True,
            "data": result_data,
            "outlets_count": len(df_final),
            "message": f"Successfully processed {len(df_final)} outlet records from raw format"
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Backend API is running"})

@app.route('/process-file', methods=['POST'])
def process_file():
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "error": "No file provided"
            }), 400

        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                "success": False,
                "error": "No file selected"
            }), 400

        if not allowed_file(file.filename):
            return jsonify({
                "success": False,
                "error": "File type not allowed. Please upload Excel files (.xlsx, .xls)"
            }), 400

        # Save uploaded file temporarily
        filename = secure_filename(file.filename)
        temp_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(temp_path)

        try:
            # Process the file using our backend logic
            result = process_financial_data(temp_path)
            
            # Clean up temporary file
            try:
                os.remove(temp_path)
            except PermissionError:
                # File might be in use, try to delete it later
                print(f"[WARNING] Could not delete temporary file {temp_path} - file may be in use")
            
            return jsonify(result)

        except Exception as e:
            # Clean up temporary file on error
            try:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            except PermissionError:
                print(f"[WARNING] Could not delete temporary file {temp_path} - file may be in use")
            raise e

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Processing failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@app.route('/interest-analysis', methods=['POST'])
def interest_analysis():
    """
    Endpoint specifically for interest cost analysis
    """
    try:
        data = request.get_json()
        if not data or 'financial_data' not in data:
            return jsonify({
                "success": False,
                "error": "No financial data provided"
            }), 400

        financial_data = data['financial_data']
        
        # Calculate interest analysis metrics
        interest_metrics = [
            '01-Bank Charges',
            '02-Interest on Borrowings', 
            '03-Interest on Vehicle Loan',
            '04-MG',
            'Finance Cost'
        ]
        
        # Calculate total interest costs
        total_interest = 0
        interest_breakdown = {}
        
        for metric in interest_metrics:
            total_amount = sum(parseFloat(item.get(metric, 0)) or 0 for item in financial_data)
            if total_amount > 0:
                interest_breakdown[metric] = {
                    'total_amount': total_amount,
                    'outlet_count': len([item for item in financial_data if item.get(metric, 0) and parseFloat(item.get(metric, 0)) > 0]),
                    'average_amount': total_amount / len(financial_data) if financial_data else 0
                }
                total_interest += total_amount
        
        # Calculate interest rates by outlet
        outlet_analysis = []
        for item in financial_data:
            outlet = item.get('Outlet', 'Unknown')
            manager = item.get('Outlet Manager', 'Unknown')
            revenue = parseFloat(item.get('TOTAL REVENUE', 0)) or 0
            
            outlet_interest = sum(parseFloat(item.get(metric, 0)) or 0 for metric in interest_metrics)
            interest_rate = (outlet_interest / revenue * 100) if revenue > 0 else 0
            
            outlet_analysis.append({
                'outlet': outlet,
                'manager': manager,
                'total_interest': outlet_interest,
                'revenue': revenue,
                'interest_rate': interest_rate,
                'interest_breakdown': {metric: parseFloat(item.get(metric, 0)) or 0 for metric in interest_metrics}
            })
        
        # Sort by interest rate for efficiency analysis
        outlet_analysis.sort(key=lambda x: x['interest_rate'])
        
        return jsonify({
            "success": True,
            "total_interest_costs": total_interest,
            "interest_breakdown": interest_breakdown,
            "outlet_analysis": outlet_analysis,
            "average_interest_rate": sum(item['interest_rate'] for item in outlet_analysis) / len(outlet_analysis) if outlet_analysis else 0,
            "message": f"Interest analysis completed for {len(financial_data)} outlets"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Interest analysis failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("Starting Financial Data Processing API...")
    print("API will be available at: http://localhost:5000")
    print("Health check: http://localhost:5000/health")
    print("Process file: POST http://localhost:5000/process-file")
    app.run(debug=True, host='0.0.0.0', port=5000)
