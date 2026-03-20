"""
Quick integration test — run with:
    python test_api.py

Make sure the server is running first:
    uvicorn app.main:app --reload
"""
import requests
import json

BASE = "http://localhost:8000"

JUNIOR_DEV_RESUME = """
John Doe — Software Engineer
Experience: 2 years at TechCorp building REST APIs in Python.
Skills: Python (OOP, Flask, FastAPI), SQL (PostgreSQL), Git, Docker basics.
Education: B.Tech Computer Science.
Projects: Built a data pipeline using Pandas and NumPy for ETL processing.
Self-taught statistics from online courses. Learning PyTorch.
"""

ML_ENGINEER_RESUME = """
Jane Smith — Senior ML Engineer
5 years experience. Expert in PyTorch, TensorFlow, scikit-learn.
Deep knowledge of transformers, BERT, GPT fine-tuning.
Proficient in MLflow, Docker, Kubernetes, CI/CD pipelines.
Strong statistics and linear algebra background.
Experience with A/B testing and model evaluation metrics (AUC, F1, NDCG).
"""

WAREHOUSE_RESUME = """
Ravi Kumar — Logistics Coordinator
4 years at Global Logistics managing inventory and coordinating shipments.
Proficient in Excel, basic WMS software, and warehouse safety protocols.
Familiar with KPI reporting. No people management experience yet.
Seeking to move into Warehouse Operations Lead role.
"""

def test_health():
    r = requests.get(f"{BASE}/health")
    print(f"✅ Health: {r.json()}")

def test_catalog():
    r = requests.get(f"{BASE}/catalog")
    modules = r.json()
    print(f"✅ Catalog: {len(modules)} modules loaded")

    r2 = requests.get(f"{BASE}/catalog?domain=tech")
    print(f"✅ Catalog (tech only): {len(r2.json())} modules")

def test_extract(resume_text, role, label):
    r = requests.post(f"{BASE}/extract/text", json={
        "resume_text": resume_text,
        "target_role": role,
    })
    if r.status_code != 200:
        print(f"❌ Extract [{label}]: {r.status_code} — {r.text}")
        return

    data = r.json()
    skills = data["skills"]
    print(f"\n✅ Extract [{label}]:")
    print(f"   Skills found: {len(skills)}")
    for s in skills[:5]:
        print(f"   • {s['name']} ({s['proficiency']}, conf={s['confidence']:.2f})")
    print(f"   Trace lines: {len(data['reasoning_trace'])}")

def test_pathway(resume_text, role, label):
    r = requests.post(f"{BASE}/pathway/text", json={
        "resume_text": resume_text,
        "target_role": role,
    })
    if r.status_code != 200:
        print(f"❌ Pathway [{label}]: {r.status_code} — {r.text}")
        return

    data = r.json()
    print(f"\n✅ Pathway [{label}]:")
    print(f"   Modules: {len(data['modules'])}")
    print(f"   Hours: {data['total_hours']}h (standard: {data['standard_hours']}h)")
    print(f"   Time saved: {data['time_saved_pct']}%")
    print(f"   Gaps: {data['skill_gaps'][:4]}")
    for m in data["modules"][:3]:
        print(f"   {m['priority']:12} │ {m['title']} ({m['hours']}h)")
    print(f"   Trace lines: {len(data['reasoning_trace'])}")

if __name__ == "__main__":
    print("=== Waypoint API Integration Tests ===\n")
    test_health()
    test_catalog()
    test_extract(JUNIOR_DEV_RESUME,   "ML Engineer",             "Junior Dev → ML Engineer")
    test_extract(WAREHOUSE_RESUME,    "Warehouse Operations Lead", "Logistics → Warehouse Lead")
    test_pathway(JUNIOR_DEV_RESUME,   "ML Engineer",             "Junior Dev → ML Engineer")
    test_pathway(ML_ENGINEER_RESUME,  "ML Engineer",             "Senior ML (should compress heavily)")
    test_pathway(WAREHOUSE_RESUME,    "Warehouse Operations Lead", "Logistics → Warehouse Lead")
    print("\n=== All tests complete ===")
