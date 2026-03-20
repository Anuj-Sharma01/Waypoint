"""
Waypoint — 4 Persona Integration Tests
Run with: python test_personas.py  (server must be running on port 8000)

Tests all 4 cross-domain personas required by the hackathon judges:
  1. Junior Dev       → ML Engineer        (tech)
  2. Data Analyst     → Data Scientist     (tech)
  3. SysAdmin         → DevOps Engineer    (tech)
  4. Logistics Coord  → Warehouse Lead     (operational)

Each test validates:
  - Skills extracted correctly
  - Skill gaps identified
  - Pathway modules are grounded (exist in /catalog)
  - Reasoning trace present
  - Time saved vs standard track
"""

import requests
import sys
import json

BASE = "http://localhost:8000"

# ── 4 Demo Personas ───────────────────────────────────────────────────────────

PERSONAS = [
    {
        "label": "Junior Dev → ML Engineer",
        "role": "ML Engineer",
        "resume": """
John Doe — Software Engineer
Experience: 2 years at TechCorp building REST APIs and web services in Python.
Skills: Python (OOP, Flask, FastAPI), SQL (PostgreSQL), Git, Docker basics.
Education: B.Tech Computer Science, 2022.
Projects:
  - Built an ETL pipeline using Pandas and NumPy to process 1M daily records.
  - Contributed to a recommendation system using collaborative filtering.
Self-taught statistics from Coursera. Currently learning PyTorch.
Tools: VSCode, Postman, Linux command line.
""",
        "expect_have":    ["Python", "SQL", "Git"],
        "expect_gaps":    ["PyTorch", "Transformers", "MLOps"],
        "expect_partial": ["Docker", "Statistics"],
    },
    {
        "label": "Data Analyst → Data Scientist",
        "role": "Data Scientist",
        "resume": """
Priya Sharma — Data Analyst
3 years at FinCorp analyzing business data and building dashboards.
Proficient in: SQL (advanced), Excel (pivot tables, VLOOKUP), Tableau, Python basics (pandas, matplotlib).
Statistics: degree-level knowledge of distributions and hypothesis testing.
Projects:
  - Designed executive dashboards tracking 15+ KPIs using Tableau.
  - Wrote SQL queries for ad-hoc analysis across 10M-row datasets.
  - Basic Python scripting for data cleaning tasks.
No experience with machine learning models or sklearn. Familiar with the concept of A/B testing.
""",
        "expect_have":    ["SQL", "Excel", "Tableau", "Statistics"],
        "expect_gaps":    ["Scikit-learn", "Feature Engineering", "Model Evaluation"],
        "expect_partial": ["Python", "A/B Testing"],
    },
    {
        "label": "SysAdmin → DevOps Engineer",
        "role": "DevOps Engineer",
        "resume": """
Arjun Mehta — System Administrator
5 years managing Linux servers and enterprise networking at InfraCo.
Expert in: Linux (RHEL, Ubuntu), Bash scripting, Networking (TCP/IP, DNS, firewalls), Git.
Experience with Docker containers (basic usage, not orchestration).
Set up basic Jenkins CI pipelines for a small team.
No experience with Kubernetes, Terraform, or cloud infrastructure as code.
Certifications: RHCSA, CCNA.
""",
        "expect_have":    ["Linux", "Bash", "Networking", "Git"],
        "expect_gaps":    ["Kubernetes", "Terraform", "Prometheus", "GitOps"],
        "expect_partial": ["Docker", "CI/CD"],
    },
    {
        "label": "Logistics Coordinator → Warehouse Lead",
        "role": "Warehouse Operations Lead",
        "resume": """
Sunita Patel — Logistics Coordinator
4 years at Global Freight coordinating inbound and outbound shipments.
Skills: Inventory Management (manual and system-based), Excel (intermediate), warehouse safety protocols (OSHA certified).
Familiar with basic WMS software for tracking shipments. KPI reporting experience (basic dashboards).
No people management experience. No SAP or ERP system experience.
Education: B.Com Logistics & Supply Chain Management.
""",
        "expect_have":    ["Inventory Management", "Excel"],
        "expect_gaps":    ["People Management", "SAP", "Lean Six Sigma", "Loss Prevention"],
        "expect_partial": ["WMS Software", "KPI Reporting"],
    },
]

# ── Test runner ────────────────────────────────────────────────────────────────

def check(condition: bool, label: str):
    symbol = "✅" if condition else "❌"
    print(f"   {symbol} {label}")
    return condition

def run_persona_test(persona: dict) -> bool:
    print(f"\n{'─'*60}")
    print(f"  PERSONA: {persona['label']}")
    print(f"{'─'*60}")
    all_pass = True

    # ── Test /extract/text ────────────────────────────────────────────────────
    r = requests.post(f"{BASE}/extract/text", json={
        "resume_text": persona["resume"],
        "target_role": persona["role"],
    })
    if r.status_code != 200:
        print(f"  ❌ /extract/text failed: {r.status_code} — {r.text[:200]}")
        return False

    ext = r.json()
    skill_names  = {s["name"].lower() for s in ext["skills"]}
    proficient   = {s["name"].lower() for s in ext["skills"] if s["proficiency"] == "proficient"}
    partial      = {s["name"].lower() for s in ext["skills"] if s["proficiency"] == "partial"}

    print(f"\n  Extraction:")
    all_pass &= check(len(ext["skills"]) > 0, f"Skills found: {len(ext['skills'])}")
    all_pass &= check(len(ext["reasoning_trace"]) >= 3, f"Reasoning trace: {len(ext['reasoning_trace'])} lines")
    all_pass &= check(
        all(s.get("evidence") for s in ext["skills"]),
        "All skills have evidence quotes"
    )
    all_pass &= check(
        all(0.5 <= s.get("confidence", 0) <= 1.0 for s in ext["skills"]),
        "All confidence scores in range [0.5, 1.0]"
    )

    for expected in persona["expect_have"][:2]:
        found = expected.lower() in proficient
        all_pass &= check(found, f"Proficient in '{expected}'")

    for expected in persona["expect_partial"][:1]:
        found = expected.lower() in partial or expected.lower() in skill_names
        all_pass &= check(found, f"Partial/detected: '{expected}'")

    # ── Test /pathway/text ────────────────────────────────────────────────────
    r2 = requests.post(f"{BASE}/pathway/text", json={
        "resume_text": persona["resume"],
        "target_role": persona["role"],
    })
    if r2.status_code != 200:
        print(f"  ❌ /pathway/text failed: {r2.status_code} — {r2.text[:200]}")
        return False

    path = r2.json()
    module_ids = {m["module_id"] for m in path["modules"]}

    # Fetch catalog to validate grounding
    catalog_r = requests.get(f"{BASE}/catalog")
    catalog_ids = {m["id"] for m in catalog_r.json()}
    hallucinated = module_ids - catalog_ids

    print(f"\n  Pathway:")
    all_pass &= check(len(path["modules"]) > 0, f"Modules generated: {len(path['modules'])}")
    all_pass &= check(path["total_hours"] > 0, f"Total hours: {path['total_hours']}h")
    all_pass &= check(path["standard_hours"] >= path["total_hours"], f"Standard hours: {path['standard_hours']}h")
    all_pass &= check(path["time_saved_pct"] > 0, f"Time saved: {path['time_saved_pct']}%")
    all_pass &= check(len(hallucinated) == 0, f"Zero hallucinations (all modules in catalog)")
    all_pass &= check(len(path["reasoning_trace"]) >= 4, f"Reasoning trace: {len(path['reasoning_trace'])} lines")
    all_pass &= check(
        all(m.get("why_included") for m in path["modules"]),
        "All modules have why_included trace"
    )

    for gap in persona["expect_gaps"][:2]:
        in_gaps = gap.lower() in {g.lower() for g in path["skill_gaps"]}
        all_pass &= check(in_gaps, f"Gap identified: '{gap}'")

    print(f"\n  First 3 modules:")
    for m in path["modules"][:3]:
        skip = f" [{m['skip_reason'][:40]}...]" if m.get("skip_reason") else ""
        print(f"    {m['priority']:14} │ {m['title']} ({m['hours']}h){skip}")

    if hallucinated:
        print(f"\n  ⚠️  Hallucinated module IDs: {hallucinated}")

    return all_pass


def run_all():
    print("\n" + "═"*60)
    print("  WAYPOINT — 4 PERSONA INTEGRATION TESTS")
    print("═"*60)

    # Health check
    try:
        r = requests.get(f"{BASE}/health", timeout=3)
        print(f"\n✅ Server reachable: {r.json()}")
    except Exception:
        print(f"\n❌ Cannot reach {BASE}. Is the server running?")
        print("   Run: uvicorn app.main:app --reload")
        sys.exit(1)

    results = []
    for persona in PERSONAS:
        passed = run_persona_test(persona)
        results.append((persona["label"], passed))

    print(f"\n{'═'*60}")
    print("  SUMMARY")
    print("═"*60)
    for label, passed in results:
        symbol = "✅ PASS" if passed else "❌ FAIL"
        print(f"  {symbol}  {label}")

    total  = len(results)
    passed = sum(1 for _, p in results if p)
    print(f"\n  {passed}/{total} personas passed all checks")

    if passed == total:
        print("\n  🚀 All systems go — ready for demo!\n")
    else:
        print("\n  ⚠️  Fix failing tests before demo\n")
        sys.exit(1)


if __name__ == "__main__":
    run_all()
