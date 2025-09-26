import pandas as pd
import numpy as np
import re
import traceback

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
