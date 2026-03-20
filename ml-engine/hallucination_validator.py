    """
NeuralPath -- Hallucination Validator + Fixed Demo Profiles
Person C deliverable: validates every recommended course exists in the
locked catalog. Hallucination rate = 0% is a hard judging criterion (15%).

Also fixes Profiles 2 & 3 with bigger skill gaps for demo purposes.

Run:
    py -3 hallucination_validator.py
"""

import os, sys, json, pickle

# ── Locked Course Catalog ─────────────────────────────────────────────────────
# In production this comes from Person A's DB.
# For the hackathon demo, this is the locked catalog the LLM must stay within.
# Every recommendation is validated against this before returning to the UI.

COURSE_CATALOG = {
    # Basic Skills
    "Reading Comprehension": {
        "course_id":   "BC-001",
        "title":       "Professional Reading and Comprehension",
        "duration_hrs": 4,
        "provider":    "Coursera",
        "level":       "beginner",
    },
    "Active Listening": {
        "course_id":   "BC-002",
        "title":       "Active Listening and Communication Skills",
        "duration_hrs": 3,
        "provider":    "LinkedIn Learning",
        "level":       "beginner",
    },
    "Writing": {
        "course_id":   "BC-003",
        "title":       "Business Writing Essentials",
        "duration_hrs": 5,
        "provider":    "Coursera",
        "level":       "beginner",
    },
    "Speaking": {
        "course_id":   "BC-004",
        "title":       "Public Speaking and Presentation Skills",
        "duration_hrs": 6,
        "provider":    "Udemy",
        "level":       "beginner",
    },
    "Mathematics": {
        "course_id":   "BC-005",
        "title":       "Applied Mathematics for Professionals",
        "duration_hrs": 10,
        "provider":    "Khan Academy",
        "level":       "intermediate",
    },
    "Science": {
        "course_id":   "BC-006",
        "title":       "Scientific Thinking and Research Methods",
        "duration_hrs": 8,
        "provider":    "edX",
        "level":       "intermediate",
    },
    # Cognitive Skills
    "Critical Thinking": {
        "course_id":   "CG-001",
        "title":       "Critical Thinking and Problem Analysis",
        "duration_hrs": 6,
        "provider":    "Coursera",
        "level":       "intermediate",
    },
    "Active Learning": {
        "course_id":   "CG-002",
        "title":       "Learning How to Learn",
        "duration_hrs": 4,
        "provider":    "Coursera",
        "level":       "beginner",
    },
    "Learning Strategies": {
        "course_id":   "CG-003",
        "title":       "Effective Learning Strategies for Professionals",
        "duration_hrs": 5,
        "provider":    "LinkedIn Learning",
        "level":       "intermediate",
    },
    "Monitoring": {
        "course_id":   "CG-004",
        "title":       "Performance Monitoring and Metrics",
        "duration_hrs": 4,
        "provider":    "Udemy",
        "level":       "intermediate",
    },
    # Problem Solving
    "Complex Problem Solving": {
        "course_id":   "PS-001",
        "title":       "Structured Problem Solving Techniques",
        "duration_hrs": 8,
        "provider":    "edX",
        "level":       "advanced",
    },
    "Judgment and Decision Making": {
        "course_id":   "PS-002",
        "title":       "Decision Making Under Uncertainty",
        "duration_hrs": 6,
        "provider":    "Coursera",
        "level":       "advanced",
    },
    "Systems Analysis": {
        "course_id":   "PS-003",
        "title":       "Systems Thinking and Analysis",
        "duration_hrs": 10,
        "provider":    "edX",
        "level":       "advanced",
    },
    "Systems Evaluation": {
        "course_id":   "PS-004",
        "title":       "System Evaluation and Performance Assessment",
        "duration_hrs": 8,
        "provider":    "LinkedIn Learning",
        "level":       "advanced",
    },
    "Operations Analysis": {
        "course_id":   "PS-005",
        "title":       "Operations Research and Process Analysis",
        "duration_hrs": 12,
        "provider":    "Coursera",
        "level":       "advanced",
    },
    # Social Skills
    "Social Perceptiveness": {
        "course_id":   "SS-001",
        "title":       "Emotional Intelligence at Work",
        "duration_hrs": 5,
        "provider":    "LinkedIn Learning",
        "level":       "intermediate",
    },
    "Coordination": {
        "course_id":   "SS-002",
        "title":       "Cross-functional Team Coordination",
        "duration_hrs": 6,
        "provider":    "Udemy",
        "level":       "intermediate",
    },
    "Instructing": {
        "course_id":   "SS-003",
        "title":       "Training and Instructional Design",
        "duration_hrs": 8,
        "provider":    "Coursera",
        "level":       "intermediate",
    },
    "Negotiation": {
        "course_id":   "SS-004",
        "title":       "Negotiation Fundamentals",
        "duration_hrs": 6,
        "provider":    "Yale / Coursera",
        "level":       "advanced",
    },
    "Persuasion": {
        "course_id":   "SS-005",
        "title":       "Influence and Persuasion in Business",
        "duration_hrs": 5,
        "provider":    "LinkedIn Learning",
        "level":       "advanced",
    },
    "Service Orientation": {
        "course_id":   "SS-006",
        "title":       "Customer and Service Excellence",
        "duration_hrs": 4,
        "provider":    "Udemy",
        "level":       "beginner",
    },
    # Management Skills
    "Time Management": {
        "course_id":   "MG-001",
        "title":       "Time Management and Productivity",
        "duration_hrs": 4,
        "provider":    "LinkedIn Learning",
        "level":       "intermediate",
    },
    "Management of Personnel Resources": {
        "course_id":   "MG-002",
        "title":       "People Management Essentials",
        "duration_hrs": 12,
        "provider":    "Coursera",
        "level":       "advanced",
    },
    "Management of Financial Resources": {
        "course_id":   "MG-003",
        "title":       "Financial Management for Non-Finance Managers",
        "duration_hrs": 10,
        "provider":    "edX",
        "level":       "advanced",
    },
    "Management of Material Resources": {
        "course_id":   "MG-004",
        "title":       "Resource and Supply Chain Management",
        "duration_hrs": 8,
        "provider":    "Coursera",
        "level":       "advanced",
    },
    # Technical Skills
    "Programming": {
        "course_id":   "TC-001",
        "title":       "Programming Fundamentals",
        "duration_hrs": 20,
        "provider":    "freeCodeCamp",
        "level":       "intermediate",
    },
    "Technology Design": {
        "course_id":   "TC-002",
        "title":       "Technology and System Design Principles",
        "duration_hrs": 15,
        "provider":    "Coursera",
        "level":       "advanced",
    },
    "Equipment Selection": {
        "course_id":   "TC-003",
        "title":       "Equipment Selection and Procurement",
        "duration_hrs": 6,
        "provider":    "Udemy",
        "level":       "intermediate",
    },
    "Installation": {
        "course_id":   "TC-004",
        "title":       "System Installation and Configuration",
        "duration_hrs": 8,
        "provider":    "LinkedIn Learning",
        "level":       "intermediate",
    },
    "Equipment Maintenance": {
        "course_id":   "TC-005",
        "title":       "Preventive Maintenance Fundamentals",
        "duration_hrs": 6,
        "provider":    "Udemy",
        "level":       "intermediate",
    },
    "Troubleshooting": {
        "course_id":   "TC-006",
        "title":       "Systematic Troubleshooting Methods",
        "duration_hrs": 8,
        "provider":    "LinkedIn Learning",
        "level":       "intermediate",
    },
    "Repairing": {
        "course_id":   "TC-007",
        "title":       "Technical Repair and Maintenance",
        "duration_hrs": 10,
        "provider":    "Udemy",
        "level":       "intermediate",
    },
    # Operations
    "Operations Monitoring": {
        "course_id":   "OP-001",
        "title":       "Operations Monitoring and Control",
        "duration_hrs": 6,
        "provider":    "edX",
        "level":       "intermediate",
    },
    "Quality Control Analysis": {
        "course_id":   "OP-002",
        "title":       "Quality Control and Six Sigma Basics",
        "duration_hrs": 10,
        "provider":    "Coursera",
        "level":       "advanced",
    },
}


# ── Hallucination Validator ───────────────────────────────────────────────────

def validate_recommendations(recommended_skills: list) -> dict:
    """
    Checks every skill in recommended_skills against the locked catalog.

    Args:
        recommended_skills: list of skill name strings from get_learning_path()

    Returns:
        dict with:
            passed          : list of valid skills with course details
            failed          : list of skills NOT in catalog (hallucinations)
            hallucination_rate : float 0.0 - 100.0 (0.0 = perfect)
            total           : total recommendations checked
    """
    passed = []
    failed = []

    for skill in recommended_skills:
        if skill in COURSE_CATALOG:
            passed.append({
                "skill":      skill,
                "course":     COURSE_CATALOG[skill],
                "status":     "PASS",
            })
        else:
            failed.append({
                "skill":   skill,
                "status":  "FAIL -- not in catalog",
            })

    total = len(recommended_skills)
    hallucination_rate = (len(failed) / total * 100) if total > 0 else 0.0

    return {
        "passed":             passed,
        "failed":             failed,
        "hallucination_rate": round(hallucination_rate, 1),
        "total":              total,
        "passed_count":       len(passed),
        "failed_count":       len(failed),
    }


def enrich_pathway_with_courses(ordered_path: list,
                                 gap_details: dict) -> list:
    """
    Takes an ordered learning path from get_learning_path() and
    attaches the full course details from the catalog to each step.
    This is what Person A returns from the /pathway API endpoint.
    """
    enriched = []
    for i, skill in enumerate(ordered_path, 1):
        course = COURSE_CATALOG.get(skill)
        entry = {
            "step":      i,
            "skill":     skill,
            "gap_score": gap_details.get(skill, 0.0),
            "course":    course if course else None,
            "grounded":  course is not None,
        }
        enriched.append(entry)
    return enriched


def print_validation_report(validation: dict, title: str = ""):
    print(f"\n  {'='*56}")
    if title:
        print(f"  Validation: {title}")
    print(f"  Total recommendations : {validation['total']}")
    print(f"  Passed (in catalog)   : {validation['passed_count']}")
    print(f"  Failed (hallucinated) : {validation['failed_count']}")
    rate = validation['hallucination_rate']
    status = "PERFECT" if rate == 0 else "WARNING"
    print(f"  Hallucination rate    : {rate}%  [{status}]")

    if validation["failed"]:
        print(f"\n  Failed items (not in catalog):")
        for f in validation["failed"]:
            print(f"    - {f['skill']}")

    if validation["passed"]:
        print(f"\n  Passed items with course details:")
        for p in validation["passed"]:
            c = p["course"]
            print(f"    + {p['skill']:<42} "
                  f"{c['duration_hrs']}h  {c['provider']}")


# ── Fixed demo profiles with guaranteed gaps ──────────────────────────────────

FIXED_PROFILES = [
    {
        "id": "ml_engineer",
        "name": "ML Engineer",
        "emoji": "🤖",
        "current_soc": "43-9011.00",   # Computer Operators (lower zone)
        "target_soc":  "15-1252.00",   # Software Developers
        "boost":        0.1,
        "label":        "Computer Operator → Software Developer",
    },
    {
        "id": "data_scientist",
        "name": "Data Scientist",
        "emoji": "📊",
        "current_soc": "43-3031.00",   # Bookkeeping Clerks
        "target_soc":  "15-2051.01",   # Business Intelligence Analysts
        "boost":        0.1,
        "label":        "Bookkeeping Clerk → Business Intelligence Analyst",
    },
    {
        "id": "devops_engineer",
        "name": "DevOps Engineer",
        "emoji": "⚙️",
        "current_soc": "15-1232.00",   # Computer User Support
        "target_soc":  "15-1244.00",   # Network and Systems Admins
        "boost":        0.1,
        "label":        "IT Support → Network & Systems Admin",
    },
    {
        "id": "warehouse_ops",
        "name": "Warehouse Ops Lead",
        "emoji": "📦",
        "current_soc": "53-7065.00",   # Stockers and Order Fillers
        "target_soc":  "11-1021.00",   # General and Operations Managers
        "boost":        0.0,
        "label":        "Warehouse Associate → Operations Manager",
    },
]


# ── Main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\nNeuralPath -- Hallucination Validator\n")

    # Load pipeline
    dag_path = os.path.join("onet_data", "skill_dag.pkl")
    if not os.path.exists(dag_path):
        print("ERROR: run build_skill_dag.py first.")
        sys.exit(1)

    with open(dag_path, "rb") as f:
        data = pickle.load(f)
    G            = data["graph"]
    skill_matrix = data["skill_matrix"]
    occ_df       = data["occ_df"]

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from build_skill_dag import get_learning_path

    print(f"Catalog size: {len(COURSE_CATALOG)} courses\n")

    all_results = []
    total_recommendations = 0
    total_hallucinations  = 0

    for profile in FIXED_PROFILES:
        cur = profile["current_soc"]
        tgt = profile["target_soc"]

        # Auto-fix missing SOC codes
        def find_soc(keyword):
            matches = occ_df[occ_df["Title"].str.lower()
                             .str.contains(keyword.lower())]
            for _, row in matches.iterrows():
                if row["O*NET-SOC Code"] in skill_matrix.index:
                    return row["O*NET-SOC Code"], row["Title"]
            return None, None

        if cur not in skill_matrix.index:
            cur, _ = find_soc(profile["label"].split("→")[0].strip().split()[0])
        if tgt not in skill_matrix.index:
            tgt, _ = find_soc(profile["label"].split("→")[1].strip().split()[0])

        if not cur or not tgt:
            print(f"  SKIP {profile['name']}: SOC not found")
            continue

        result = get_learning_path(
            G, skill_matrix, cur, tgt,
            proficiency_boost=profile["boost"]
        )

        # Validate
        validation = validate_recommendations(result["ordered_path"])
        enriched   = enrich_pathway_with_courses(
            result["ordered_path"], result["gap_details"]
        )

        total_recommendations += validation["total"]
        total_hallucinations  += validation["failed_count"]

        print(f"\n{'='*60}")
        print(f"  {profile['emoji']}  {profile['name']}")
        print(f"  {profile['label']}")
        print(f"  Skills to learn: {result['skills_to_learn']} / "
              f"{result['total_skills']}   "
              f"Training saved: {result['time_reduction']}%")
        print_validation_report(validation)

        print(f"\n  Enriched pathway (skill + course):")
        for item in enriched[:6]:
            if item["course"]:
                c = item["course"]
                print(f"    {item['step']:>2}. {item['skill']:<35} "
                      f"-> {c['title'][:35]}")
            else:
                print(f"    {item['step']:>2}. {item['skill']:<35} "
                      f"-> [not in catalog]")
        if len(enriched) > 6:
            print(f"        ... and {len(enriched)-6} more steps")

        all_results.append({
            "profile":    profile,
            "result":     result,
            "validation": validation,
            "enriched":   enriched,
        })

    # ── Overall hallucination rate ────────────────────────────────────────────
    overall_rate = (
        round(total_hallucinations / total_recommendations * 100, 1)
        if total_recommendations > 0 else 0.0
    )

    print(f"\n{'='*60}")
    print(f"  OVERALL HALLUCINATION RATE")
    print(f"{'='*60}")
    print(f"  Total recommendations checked : {total_recommendations}")
    print(f"  Total hallucinations          : {total_hallucinations}")
    print(f"  Overall hallucination rate    : {overall_rate}%")
    status = "PERFECT -- ready for judges" if overall_rate == 0 else "NEEDS FIX"
    print(f"  Status                        : {status}")

    # ── Time reduction summary ────────────────────────────────────────────────
    print(f"\n{'='*60}")
    print(f"  TRAINING TIME REDUCTION (judge metric)")
    print(f"{'='*60}")
    print(f"  {'Profile':<24} {'Skills':<10} {'Saved':>8}  Interpretation")
    print(f"  {'-'*22}  {'-'*8}  {'-'*8}  {'-'*28}")
    for r in all_results:
        res  = r["result"]
        p    = r["profile"]
        skls = f"{res['skills_to_learn']}/{res['total_skills']}"
        saved = f"{res['time_reduction']}%"
        interp = ("big gap -- entry level"
                  if res["skills_to_learn"] > 15 else
                  "moderate gap" if res["skills_to_learn"] > 5 else
                  "small gap -- similar roles")
        print(f"  {p['name']:<24} {skls:<10} {saved:>8}  {interp}")

    # Save enriched results to JSON for Person A + B
    out = []
    for r in all_results:
        out.append({
            "profile_id":        r["profile"]["id"],
            "name":              r["profile"]["name"],
            "label":             r["profile"]["label"],
            "skills_to_learn":   r["result"]["skills_to_learn"],
            "time_reduction":    r["result"]["time_reduction"],
            "hallucination_rate":r["validation"]["hallucination_rate"],
            "enriched_pathway":  r["enriched"],
            "reasoning_trace":   r["result"]["reasoning_trace"],
        })
    out_path = os.path.join("onet_data", "validated_pathways.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"\nSaved enriched + validated pathways to {out_path}")
    print("Send validated_pathways.json to Person A + Person B.")
    print()
