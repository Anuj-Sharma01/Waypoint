"""
NeuralPath — O*NET Data Loader
Person C utility: downloads Skills and Task Statements from O*NET 30.2,
loads them into pandas DataFrames, and prints column names + first 5 rows.

Usage:
    pip install pandas openpyxl requests
    python onet_loader.py
"""

import os
import urllib.request
import pandas as pd

# ── Config ────────────────────────────────────────────────────────────────────

ONET_VERSION  = "30.2"
ONET_BASE_URL = "https://www.onetcenter.org/dl_files/database/db_30_2_excel/"
DATA_DIR      = "onet_data"

# Files we want: (remote filename with %20 encoding, local save name)
FILES = [
    ("Skills.xlsx",                "Skills.xlsx"),
    ("Task%20Statements.xlsx",     "Task Statements.xlsx"),
    ("Occupation%20Data.xlsx",     "Occupation Data.xlsx"),
    ("Job%20Zones.xlsx",           "Job Zones.xlsx"),
    ("Technology%20Skills.xlsx",   "Technology Skills.xlsx"),
    ("Content%20Model%20Reference.xlsx", "Content Model Reference.xlsx"),
]


# ── Download ──────────────────────────────────────────────────────────────────

def download_onet_files():
    """Download O*NET Excel files if not already present locally."""
    os.makedirs(DATA_DIR, exist_ok=True)

    for remote_name, local_name in FILES:
        local_path = os.path.join(DATA_DIR, local_name)
        if os.path.exists(local_path):
            print(f"  [skip]  {local_name} already exists")
            continue
        url = ONET_BASE_URL + remote_name
        print(f"  [fetch] {local_name} ...", end=" ", flush=True)
        try:
            urllib.request.urlretrieve(url, local_path)
            size_kb = os.path.getsize(local_path) // 1024
            print(f"done ({size_kb} KB)")
        except Exception as e:
            print(f"FAILED — {e}")
            print(f"         Manually download from: {url}")


# ── Load ──────────────────────────────────────────────────────────────────────

def load_excel(filename: str) -> pd.DataFrame:
    """Load an O*NET Excel file from the local data directory."""
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"File not found: {path}\n"
            f"Run download_onet_files() first, or manually place the file there."
        )
    return pd.read_excel(path, engine="openpyxl")


def inspect(df: pd.DataFrame, label: str) -> None:
    """Print column names, dtypes, shape, and first 5 rows."""
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"{'='*60}")

    print("\nColumns:")
    for i, (col, dtype) in enumerate(zip(df.columns, df.dtypes), 1):
        print(f"  {i:>2}. {col:<45} ({dtype})")

    print("\nFirst 5 rows:")
    pd.set_option("display.max_columns", None)
    pd.set_option("display.max_colwidth", 60)
    pd.set_option("display.width", 120)
    print(df.head().to_string(index=False))


# ── Key columns reference (for NeuralPath graph building) ─────────────────────

def print_neuralpath_guide():
    print("""
╔══════════════════════════════════════════════════════════════╗
║         NeuralPath — Key Columns to Use                      ║
╠══════════════════════════════════════════════════════════════╣
║  Skills.xlsx                                                 ║
║    O*NET-SOC Code   → occupation identifier (e.g. 15-1252.00)║
║    Element ID       → skill identifier (e.g. 2.A.1.a)       ║
║    Element Name     → skill name (e.g. "Reading Comprehension")
║    Scale ID         → IM = importance, LV = level            ║
║    Data Value       → score 0–7 (importance/level of skill)  ║
║                                                              ║
║  Task Statements.xlsx                                        ║
║    O*NET-SOC Code   → occupation identifier                  ║
║    Task ID          → unique task number                     ║
║    Task             → plain-English task description         ║
║    Task Type        → Core or Supplemental                   ║
║                                                              ║
║  Occupation Data.xlsx                                        ║
║    O*NET-SOC Code   → occupation identifier                  ║
║    Title            → job title (e.g. "Software Developer")  ║
║    Description      → full job description                   ║
╚══════════════════════════════════════════════════════════════╝
""")


# ── Bonus: quick skill lookup for a given occupation ─────────────────────────

def get_top_skills(skills_df: pd.DataFrame, soc_code: str, n: int = 10) -> pd.DataFrame:
    """
    Return the top-N most important skills for a given O*NET-SOC code.

    Example:
        skills_df = load_excel("Skills.xlsx")
        print(get_top_skills(skills_df, "15-1252.00"))  # Software Developer
    """
    mask = (
        (skills_df["O*NET-SOC Code"] == soc_code) &
        (skills_df["Scale ID"] == "IM")            # IM = Importance scale
    )
    subset = skills_df[mask].copy()
    subset = subset.sort_values("Data Value", ascending=False)
    return subset[["Element Name", "Data Value"]].head(n).reset_index(drop=True)


def get_occupation_skills_matrix(skills_df: pd.DataFrame) -> pd.DataFrame:
    """
    Pivot Skills into a wide occupation × skill matrix (importance scores).
    Rows = SOC codes, Columns = skill names, Values = importance score (0–7).
    This is the input format for the gap analysis in the DAG builder.

    Returns a DataFrame with shape (~900 occupations × 35 skills).
    """
    im_only = skills_df[skills_df["Scale ID"] == "IM"].copy()
    matrix = im_only.pivot_table(
        index="O*NET-SOC Code",
        columns="Element Name",
        values="Data Value",
        aggfunc="mean"
    )
    return matrix.fillna(0).round(2)


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\nO*NET {ONET_VERSION} Data Loader — NeuralPath\n")

    # 1. Download
    print("Downloading files (skips if already present)...")
    download_onet_files()

    # 2. Load the two primary files
    print("\nLoading Skills...")
    skills_df = load_excel("Skills.xlsx")

    print("Loading Task Statements...")
    tasks_df = load_excel("Task Statements.xlsx")

    # 3. Inspect
    inspect(skills_df, "Skills.xlsx")
    inspect(tasks_df, "Task Statements.xlsx")

    # 4. Bonus: occupation × skill matrix
    print("\n" + "="*60)
    print("  Occupation × Skill importance matrix (first 3 rows, 5 cols)")
    print("="*60)
    matrix = get_occupation_skills_matrix(skills_df)
    print(f"  Matrix shape: {matrix.shape[0]} occupations × {matrix.shape[1]} skills")
    print(matrix.iloc[:3, :5].to_string())

    # 5. Bonus: top skills for a sample occupation
    print("\n" + "="*60)
    print("  Top 10 skills for SOC 15-1252.00 (Software Developer)")
    print("="*60)
    try:
        top = get_top_skills(skills_df, "15-1252.00")
        print(top.to_string(index=False))
    except KeyError:
        print("  (Column name mismatch — check inspect output above for exact names)")

    # 6. Print NeuralPath guide
    print_neuralpath_guide()

    print("Done. DataFrames ready: skills_df, tasks_df\n")
