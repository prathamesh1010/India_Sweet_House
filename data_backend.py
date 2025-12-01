import pandas as pd
import numpy as np
import re
from pathlib import Path

file_path   = r"C:/Users/User/Downloads/data4.xlsx"
output_file = r"C:/Users/User/Downloads/clean_outlets3.xlsx"

# ------------------------------
# Helpers
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
    df_str = df0.applymap(norm_upper)

    # A) exact
    eq_pos = list(zip(*np.where(df_str.values == "PARTICULARS")))
    if eq_pos:
        return int(eq_pos[0][0]), int(eq_pos[0][1])

    # B) contains
    has_pos = list(zip(*np.where(df_str.applymap(lambda s: isinstance(s, str) and "PARTICULARS" in s).values)))
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

# ------------------------------
# 1) Read workbook with NO header (keep raw layout)
# ------------------------------
df0 = pd.read_excel(file_path, header=None, engine="openpyxl")

# ------------------------------
# 2) Detect header row/column
# ------------------------------
hdr_row, part_col = detect_header(df0)
print(f"[INFO] Header detected at row={hdr_row}, particulars_col={part_col}")

# Rows above header where Outlet/Manager live (adjust if needed)
outlet_row  = max(hdr_row - 1, 0)   # often the outlet names
manager_row = max(hdr_row - 3, 0)   # often the managers

# ------------------------------
# 3) Build headered DataFrame from hdr_row
#    and create a column index map to original df0
# ------------------------------
# Start with the slice from header row
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
# Apply the same mask to BOTH df_after and the index map
df_after = df_after.loc[:, ~empty_cols_mask].copy()
orig_idx_after = orig_idx_after[~empty_cols_mask]

# ------------------------------
# 4) Filter required metrics
# ------------------------------
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
if df_req.empty:
    print("DEBUG — Available 'Particulars' values (first 30):")
    print(df_after["Particulars"].dropna().unique()[:30])
    raise ValueError("None of the required rows were found under 'Particulars'.")

# ------------------------------
# 5) Detect all outlet (Month, %) column pairs by **position**
# ------------------------------
cols = list(df_req.columns)
month_re = re.compile(r"^[A-Za-z]+-\d{2}(?:\.\d+)?$")
pct_re   = re.compile(r"^%(?:\.\d+)?$")

outlet_blocks = []
for i in range(1, len(cols) - 1):  # 0 is 'Particulars'
    cname = norm_str(cols[i])
    nname = norm_str(cols[i+1])
    if month_re.match(cname) and (nname == "%" or pct_re.match(nname)):
        outlet_blocks.append((i, cols[i], cols[i+1]))

if not outlet_blocks:
    print("DEBUG — Columns after 'Particulars':", cols[:20], " ... total:", len(cols))
    raise ValueError("No Month/% pairs detected (e.g., 'June-25' followed by '%').")

print(f"[INFO] Detected {len(outlet_blocks)} outlet blocks.")

# ------------------------------
# 6) Name lookup with robust vertical + lateral scanning
# ------------------------------
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

# ------------------------------
# 7) Build final rows
# ------------------------------
final_rows = []

for (val_idx, val_col_name, pct_col_name) in outlet_blocks:
    # Map df_req/df_after column position -> original df0 column index
    # NOTE: df_req doesn't change columns vs df_after, only rows. So positions match.
    orig_col_idx = int(orig_idx_after[val_idx])

    # Outlet / Manager via robust scanning
    outlet_name  = get_name(df0, outlet_row,  orig_col_idx, max_up=6, max_dx=2)
    manager_name = get_name(df0, manager_row, orig_col_idx, max_up=8, max_dx=2)

    # Skip consolidated summary column if it happens to be detected
    if outlet_name.lower() == "consolidated summary":
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

# ------------------------------
# 8) Order + numeric coercion
# ------------------------------
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

# ------------------------------
# 9) Save
# ------------------------------
Path(output_file).parent.mkdir(parents=True, exist_ok=True)
df_final.to_excel(output_file, index=False)
print(f"✅ Clean file saved at: {output_file} | rows: {len(df_final)}")

# Optional: quick sanity check
print("Parsed first 5 names:")
print(df_final[["Outlet","Outlet Manager","Month"]].head())
