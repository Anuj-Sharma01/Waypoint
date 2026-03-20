"""
NeuralPath -- Demo Profiles
4 test profiles for the hackathon demo switcher.
Person B uses these in the frontend dropdown.
Person A uses these to test the API endpoints.

Run standalone to validate all 4 profiles work end-to-end:
    py -3 demo_profiles.py

Each profile has:
    - name          : display name for UI dropdown
    - current_soc   : person's current role SOC code
    - target_soc    : target role SOC code
    - resume_text   : sample resume to feed into proficiency_estimator
    - proficiency_boost : pre-computed boost (or compute live from resume)
"""

import pickle
import os
import sys

# ── 4 Demo Profiles ───────────────────────────────────────────────────────────

DEMO_PROFILES = [

    # ── Profile 1: ML Engineer (tech) ────────────────────────────────────────
    {
        "id":            "ml_engineer",
        "name":          "ML Engineer",
        "emoji":         "🤖",
        "current_role":  "Data Analyst",
        "target_role":   "Machine Learning Engineer",
        "current_soc":   "15-2051.01",   # Business Intelligence Analyst
        "target_soc":    "15-1252.00",   # Software Developers
        "proficiency_boost": 0.5,
        "description":   "Analyst transitioning to ML engineering — strong data skills, needs systems and programming depth.",
        "resume_text": """
Alex Chen | Data Analyst | 3 years experience

EXPERIENCE
Data Analyst, DataCorp (2021–2024)
- Strong proficiency in Python and SQL for data pipeline development
- Advanced experience with statistical analysis and quantitative modeling
- Developed KPI monitoring dashboards using Tableau and Power BI
- Familiar with machine learning concepts, exposure to scikit-learn
- Collaborated cross-functionally with engineering and product teams
- Working knowledge of data visualization and business reporting
- 2 years experience with Excel, financial modeling, and forecasting
- Comfortable with Jupyter notebooks and exploratory data analysis

EDUCATION
B.Sc. Mathematics and Computer Science
Strong foundation in linear algebra, calculus, and algorithms
""",
    },

    # ── Profile 2: Data Scientist (tech) ─────────────────────────────────────
    {
        "id":            "data_scientist",
        "name":          "Data Scientist",
        "emoji":         "📊",
        "current_role":  "Junior Software Developer",
        "target_role":   "Data Scientist",
        "current_soc":   "15-1252.00",   # Software Developers
        "target_soc":    "15-2051.01",   # Business Intelligence Analysts
        "proficiency_boost": 0.45,
        "description":   "Junior dev transitioning to data science — solid coding base, needs statistics and analytics depth.",
        "resume_text": """
Priya Sharma | Junior Software Developer | 2 years

EXPERIENCE
Junior Software Developer, StartupXYZ (2022–2024)
- Working knowledge of Python, JavaScript, and REST APIs
- Some experience with databases and SQL queries
- Assisted in building backend services and microservices
- Familiar with version control using Git and GitHub
- Basic understanding of algorithms and data structures
- Entry level exposure to cloud platforms (AWS, GCP)
- Contributed to code reviews and team standups
- Learning agile methodology and sprint planning

EDUCATION
B.Sc. Computer Science
Introductory coursework in statistics and probability
""",
    },

    # ── Profile 3: DevOps Engineer (tech) ────────────────────────────────────
    {
        "id":            "devops_engineer",
        "name":          "DevOps Engineer",
        "emoji":         "⚙️",
        "current_role":  "IT Support Specialist",
        "target_role":   "DevOps Engineer",
        "current_soc":   "15-1232.00",   # Computer User Support Specialists
        "target_soc":    "15-1244.00",   # Network and Computer Systems Administrators
        "proficiency_boost": 0.4,
        "description":   "IT support moving to DevOps — good troubleshooting foundation, needs infrastructure and automation skills.",
        "resume_text": """
Rahul Mehta | IT Support Specialist | 4 years

EXPERIENCE
IT Support Specialist, EnterpriseIT (2020–2024)
- Advanced troubleshooting of hardware, software, and network issues
- Proficient in Windows and Linux system administration
- Strong experience with installation and configuration of software
- Managed equipment maintenance and system monitoring
- Responsible for incident response and root cause analysis
- 3 years experience with helpdesk ticketing systems (Jira, ServiceNow)
- Working knowledge of networking protocols and TCP/IP
- Basic scripting experience in PowerShell and Bash
- Assisted in server setup, configuration, and deployment

EDUCATION
Diploma in Information Technology
Certifications: CompTIA A+, CompTIA Network+
""",
    },

    # ── Profile 4: Warehouse Ops Lead (non-tech / cross-domain) ──────────────
    {
        "id":            "warehouse_ops",
        "name":          "Warehouse Ops Lead",
        "emoji":         "📦",
        "current_role":  "Warehouse Associate",
        "target_role":   "Operations Manager",
        "current_soc":   "53-7065.00",   # Stockers and Order Fillers
        "target_soc":    "11-1021.00",   # General and Operations Managers
        "proficiency_boost": 0.2,
        "description":   "Warehouse worker moving to operations management — strong floor knowledge, needs leadership and financial skills.",
        "resume_text": """
Sunita Rao | Warehouse Associate | 5 years

EXPERIENCE
Senior Warehouse Associate, LogisticsPro (2019–2024)
- Responsible for inventory management, stock replenishment, and order fulfillment
- Led small team of 3 associates during peak shifts (informal leadership)
- Basic reporting of daily stock levels and discrepancies to supervisor
- Some experience with warehouse management software (WMS)
- Coordinated with delivery drivers for inbound and outbound shipments
- Followed quality checks and safety compliance procedures
- Entry level experience with budget tracking for department supplies
- Worked with team members to meet daily throughput targets
- Basic math for inventory counts and reconciliation

EDUCATION
High School Diploma
Short course in Warehouse Operations and Safety
""",
    },
]


# ── Validation: run all 4 profiles through the pipeline ──────────────────────

def validate_all_profiles():
    """
    Load the DAG and run all 4 profiles end-to-end.
    Prints a clean summary table for each.
    """

    dag_path = os.path.join("onet_data", "skill_dag.pkl")
    if not os.path.exists(dag_path):
        print("ERROR: onet_data/skill_dag.pkl not found.")
        print("Run build_skill_dag.py first.")
        sys.exit(1)

    print("Loading skill_dag.pkl ...")
    with open(dag_path, "rb") as f:
        data = pickle.load(f)
    G            = data["graph"]
    skill_matrix = data["skill_matrix"]
    occ_df       = data["occ_df"]
    print(f"  Graph: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")
    print(f"  Matrix: {skill_matrix.shape[0]} occupations x {skill_matrix.shape[1]} skills\n")

    # Import get_learning_path from build_skill_dag
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    try:
        from build_skill_dag import get_learning_path
    except ImportError:
        print("ERROR: build_skill_dag.py not found in same folder.")
        sys.exit(1)

    try:
        from proficiency_estimator import estimate_proficiency, get_proficiency_boost
        use_live_proficiency = True
    except ImportError:
        use_live_proficiency = False
        print("Note: proficiency_estimator.py not found, using preset boost values.\n")

    results = {}

    for profile in DEMO_PROFILES:
        print("=" * 62)
        print(f"  {profile['emoji']}  Profile: {profile['name']}")
        print(f"  {profile['current_role']} → {profile['target_role']}")
        print("=" * 62)

        # Check SOC codes exist in matrix
        cur_soc = profile["current_soc"]
        tgt_soc = profile["target_soc"]

        if cur_soc not in skill_matrix.index:
            # Find closest match by title
            matches = occ_df[occ_df["Title"].str.lower().str.contains(
                profile["current_role"].split()[0].lower())]
            for _, row in matches.iterrows():
                if row["O*NET-SOC Code"] in skill_matrix.index:
                    cur_soc = row["O*NET-SOC Code"]
                    print(f"  [auto] current SOC -> {cur_soc} ({row['Title']})")
                    break

        if tgt_soc not in skill_matrix.index:
            matches = occ_df[occ_df["Title"].str.lower().str.contains(
                profile["target_role"].split()[0].lower())]
            for _, row in matches.iterrows():
                if row["O*NET-SOC Code"] in skill_matrix.index:
                    tgt_soc = row["O*NET-SOC Code"]
                    print(f"  [auto] target SOC  -> {tgt_soc} ({row['Title']})")
                    break

        if cur_soc not in skill_matrix.index or tgt_soc not in skill_matrix.index:
            print(f"  SKIP: SOC codes not found in matrix")
            print(f"        current={cur_soc}, target={tgt_soc}")
            continue

        # Compute proficiency boost
        if use_live_proficiency:
            estimates = estimate_proficiency(profile["resume_text"])
            boost     = get_proficiency_boost(estimates)
            print(f"  Live proficiency boost: {boost:.2f}  "
                  f"({len(estimates)} skills detected in resume)")
        else:
            boost = profile["proficiency_boost"]
            print(f"  Preset proficiency boost: {boost:.2f}")

        # Run learning path
        result = get_learning_path(
            G, skill_matrix, cur_soc, tgt_soc,
            proficiency_boost=boost
        )

        results[profile["id"]] = {
            "profile":      profile,
            "result":       result,
            "current_soc":  cur_soc,
            "target_soc":   tgt_soc,
            "boost":        boost,
        }

        # Print summary
        print(f"\n  Skills to learn:   {result['skills_to_learn']} / {result['total_skills']}")
        print(f"  Skills skipped:    {result['skills_skipped']}")
        print(f"  Training saved:    {result['time_reduction']}%")

        print(f"\n  Learning path (ordered):")
        for i, skill in enumerate(result["ordered_path"], 1):
            gap  = result["gap_details"].get(skill, 0.0)
            flag = " [prereq]" if skill in result.get("prereqs_added", []) else ""
            print(f"    {i:>2}. {skill:<42} gap={gap:.2f}{flag}")

        print(f"\n  First reasoning step:")
        if result["reasoning_trace"]:
            t = result["reasoning_trace"][0]
            print(f"    {t['skill']}: {t['reason']}")
        print()

    # ── Cross-domain comparison table ────────────────────────────────────────
    print("=" * 62)
    print("  SUMMARY — All 4 profiles")
    print("=" * 62)
    print(f"  {'Profile':<22} {'From':<22} {'Skills':<10} {'Saved':>6}")
    print(f"  {'-'*20}  {'-'*20}  {'-'*8}  {'-'*6}")
    for pid, r in results.items():
        p    = r["profile"]
        res  = r["result"]
        name = p["name"]
        frm  = p["current_role"][:20]
        skls = f"{res['skills_to_learn']}/{res['total_skills']}"
        saved = f"{res['time_reduction']}%"
        print(f"  {name:<22} {frm:<22} {skls:<10} {saved:>6}")

    print(f"\n  This table proves cross-domain scalability to judges:")
    print(f"  tech roles AND operational/labor roles both produce valid pathways.")
    print()

    return results


# ── JSON export (for Person A's API + Person B's frontend) ───────────────────

def export_profiles_json():
    """
    Export profiles as a JSON-serialisable list.
    Person A: use as test payloads for API.
    Person B: use as the demo switcher data source in React.
    """
    import json
    export = []
    for p in DEMO_PROFILES:
        export.append({
            "id":               p["id"],
            "name":             p["name"],
            "emoji":            p["emoji"],
            "current_role":     p["current_role"],
            "target_role":      p["target_role"],
            "current_soc":      p["current_soc"],
            "target_soc":       p["target_soc"],
            "proficiency_boost":p["proficiency_boost"],
            "description":      p["description"],
            "resume_text":      p["resume_text"].strip(),
        })
    out_path = os.path.join("onet_data", "demo_profiles.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2, ensure_ascii=False)
    print(f"Exported to {out_path}")
    return export


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\nNeuralPath -- Demo Profile Validator\n")
    results = validate_all_profiles()
    print("Exporting profiles to JSON...")
    export_profiles_json()
    print("\nAll done.")
    print("Send onet_data/demo_profiles.json to Person B for the UI dropdown.")
    print("Send this file + build_skill_dag.py to Person A for API testing.")
