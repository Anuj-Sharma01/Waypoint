"""
NeuralPath — Skill Prerequisite DAG Builder v2 (fixed)
Run: py -3 build_skill_dag.py
"""

import os
import pickle
import pandas as pd
import networkx as nx

DATA_DIR = "onet_data"


def load_data():
    def xl(name):
        return pd.read_excel(os.path.join(DATA_DIR, name), engine="openpyxl")
    print("Loading O*NET files...")
    skills_df    = xl("Skills.xlsx")
    job_zones_df = xl("Job Zones.xlsx")
    occ_df       = xl("Occupation Data.xlsx")
    print(f"  Skills:      {len(skills_df):,} rows")
    print(f"  Job Zones:   {len(job_zones_df):,} rows")
    print(f"  Occupations: {len(occ_df):,} rows")
    return skills_df, job_zones_df, occ_df


def build_skill_matrix(skills_df):
    im = skills_df[skills_df["Scale ID"] == "IM"].copy()
    matrix = im.pivot_table(
        index="O*NET-SOC Code",
        columns="Element Name",
        values="Data Value",
        aggfunc="mean"
    ).fillna(0).round(2)
    return matrix


def build_dag(skills_df, job_zones_df):
    G = nx.DiGraph()

    im = skills_df[skills_df["Scale ID"] == "IM"]
    lv = skills_df[skills_df["Scale ID"] == "LV"]
    all_skills = im["Element Name"].unique().tolist()

    skill_avg_importance = im.groupby("Element Name")["Data Value"].mean().round(2)
    skill_avg_level      = lv.groupby("Element Name")["Data Value"].mean().round(2)

    for skill in all_skills:
        G.add_node(skill,
                   importance=float(skill_avg_importance.get(skill, 3.0)),
                   level=float(skill_avg_level.get(skill, 3.0)))

    # Prerequisite rules based on O*NET skill domain knowledge
    prerequisite_rules = [
        ("Reading Comprehension",  "Active Learning"),
        ("Reading Comprehension",  "Learning Strategies"),
        ("Reading Comprehension",  "Writing"),
        ("Active Listening",       "Speaking"),
        ("Active Listening",       "Social Perceptiveness"),
        ("Mathematics",            "Science"),
        ("Critical Thinking",      "Judgment and Decision Making"),
        ("Critical Thinking",      "Complex Problem Solving"),
        ("Critical Thinking",      "Systems Analysis"),
        ("Systems Analysis",       "Systems Evaluation"),
        ("Complex Problem Solving","Operations Analysis"),
        ("Science",                "Technology Design"),
        ("Technology Design",      "Equipment Selection"),
        ("Equipment Selection",    "Installation"),
        ("Installation",           "Equipment Maintenance"),
        ("Equipment Maintenance",  "Troubleshooting"),
        ("Troubleshooting",        "Repairing"),
        ("Operations Analysis",    "Programming"),
        ("Social Perceptiveness",  "Coordination"),
        ("Coordination",           "Instructing"),
        ("Coordination",           "Negotiation"),
        ("Coordination",           "Persuasion"),
        ("Instructing",            "Service Orientation"),
        ("Critical Thinking",      "Time Management"),
        ("Time Management",        "Management of Personnel Resources"),
        ("Management of Personnel Resources", "Management of Financial Resources"),
        ("Management of Personnel Resources", "Management of Material Resources"),
        ("Mathematics",            "Quality Control Analysis"),
        ("Operations Analysis",    "Operations Monitoring"),
        ("Operations Monitoring",  "Quality Control Analysis"),
    ]

    for prereq, skill in prerequisite_rules:
        if prereq in G.nodes and skill in G.nodes and prereq != skill:
            if not G.has_edge(prereq, skill):
                G.add_edge(prereq, skill,
                           weight=float(skill_avg_importance.get(skill, 3.0)),
                           reason=f"Domain rule: {prereq} -> {skill}")

    # Job Zone based edges
    jz     = job_zones_df[["O*NET-SOC Code", "Job Zone"]].dropna()
    jz_map = dict(zip(jz["O*NET-SOC Code"], jz["Job Zone"]))

    im_with_zone = im.copy()
    im_with_zone["Job Zone"] = im_with_zone["O*NET-SOC Code"].map(jz_map)
    im_with_zone = im_with_zone.dropna(subset=["Job Zone"])

    skill_zone = (
        im_with_zone[im_with_zone["Data Value"] >= 3.5]
        .groupby("Element Name")["Job Zone"].mean().round(2)
    )
    skill_zone_list = list(skill_zone.sort_values().items())

    for i in range(len(skill_zone_list) - 1):
        s1, z1 = skill_zone_list[i]
        s2, z2 = skill_zone_list[i + 1]
        if z2 - z1 > 0.4 and s1 in G.nodes and s2 in G.nodes:
            if not G.has_edge(s1, s2):
                G.add_edge(s1, s2,
                           weight=float(skill_avg_importance.get(s2, 3.0)),
                           reason=f"Zone progression {z1:.1f}->{z2:.1f}")

    # Remove cycles
    cycles_removed = 0
    while True:
        try:
            cycle = nx.find_cycle(G, orientation="original")
            weakest = min(cycle, key=lambda e: G[e[0]][e[1]].get("weight", 0))
            G.remove_edge(weakest[0], weakest[1])
            cycles_removed += 1
        except nx.NetworkXNoCycle:
            break

    print(f"\nDAG built:")
    print(f"  Nodes (skills):        {G.number_of_nodes()}")
    print(f"  Edges (prerequisites): {G.number_of_edges()}")
    print(f"  Cycles removed:        {cycles_removed}")
    print(f"  Is valid DAG:          {nx.is_directed_acyclic_graph(G)}")
    return G


def find_soc_in_matrix(skill_matrix, occ_df, keyword):
    matches = occ_df[occ_df["Title"].str.lower().str.contains(keyword.lower())]
    for _, row in matches.iterrows():
        soc = row["O*NET-SOC Code"]
        if soc in skill_matrix.index:
            return soc, row["Title"]
    return None, None


def get_learning_path(G, skill_matrix, current_soc, target_soc, proficiency_boost=0.0):
    IMPORTANCE_THRESHOLD = 3.0

    if current_soc not in skill_matrix.index:
        raise ValueError(f"SOC '{current_soc}' not in matrix. Sample: {list(skill_matrix.index[:3])}")
    if target_soc not in skill_matrix.index:
        raise ValueError(f"SOC '{target_soc}' not in matrix. Sample: {list(skill_matrix.index[:3])}")

    current_profile = skill_matrix.loc[current_soc]
    target_profile  = skill_matrix.loc[target_soc]
    boosted_current = (current_profile * (1 + proficiency_boost)).clip(upper=7.0)

    gap = {}
    for skill in target_profile.index:
        target_score  = target_profile[skill]
        current_score = boosted_current.get(skill, 0)
        gap_size = target_score - current_score
        if target_score >= IMPORTANCE_THRESHOLD and gap_size > 0.3:
            gap[skill] = round(gap_size, 2)

    if not gap:
        return {
            "skill_gap": [], "ordered_path": [], "prereqs_added": [],
            "reasoning_trace": [{"step": 1, "skill": "N/A",
                                  "reason": "No significant skill gap found."}],
            "time_reduction": 100.0, "gap_details": {},
            "total_skills": len(skill_matrix.columns),
            "skills_to_learn": 0, "skills_skipped": len(skill_matrix.columns)
        }

    gap_skills = set(gap.keys())
    gap_nodes  = [s for s in gap_skills if s in G.nodes]
    subgraph   = G.subgraph(gap_nodes).copy()

    prereqs_added = set()
    for skill in list(gap_nodes):
        for prereq in nx.ancestors(G, skill):
            if prereq not in gap_skills and prereq in G.nodes:
                subgraph.add_node(prereq)
                prereqs_added.add(prereq)
                for s, t, d in G.edges(prereq, data=True):
                    if t in subgraph.nodes:
                        subgraph.add_edge(s, t, **d)

    try:
        ordered_path = list(nx.topological_sort(subgraph))
    except nx.NetworkXUnfeasible:
        ordered_path = sorted(gap_skills, key=lambda s: gap.get(s, 0), reverse=True)

    reasoning_trace = []
    for i, skill in enumerate(ordered_path, 1):
        gap_size     = gap.get(skill, 0)
        predecessors = [p for p in G.predecessors(skill) if p in subgraph.nodes]
        successors   = [s for s in G.successors(skill)   if s in subgraph.nodes]
        is_prereq    = skill in prereqs_added
        if is_prereq:
            reason = (f"Prerequisite -- learn before: "
                      f"{', '.join(successors) if successors else 'downstream skills'}.")
        else:
            reason = (f"Gap score {gap_size:.2f}. "
                      + (f"Builds on: {', '.join(predecessors)}."
                         if predecessors else "No prerequisites needed."))
        reasoning_trace.append({
            "step": i, "skill": skill, "gap_score": gap_size,
            "is_prereq": is_prereq, "prerequisites": predecessors,
            "unlocks": successors, "reason": reason
        })

    total_skills   = len(skill_matrix.columns)
    skills_skipped = total_skills - len(ordered_path)
    return {
        "skill_gap":       list(gap_skills),
        "ordered_path":    ordered_path,
        "prereqs_added":   list(prereqs_added),
        "reasoning_trace": reasoning_trace,
        "time_reduction":  round((skills_skipped / total_skills) * 100, 1),
        "gap_details":     gap,
        "total_skills":    total_skills,
        "skills_to_learn": len(ordered_path),
        "skills_skipped":  skills_skipped,
    }


def print_pathway(result, current_title, target_title):
    print(f"\n  From : {current_title}")
    print(f"  To   : {target_title}")
    print(f"  Skills to learn : {result['skills_to_learn']} / {result['total_skills']}")
    print(f"  Skills skipped  : {result['skills_skipped']}")
    print(f"  Training saved  : {result['time_reduction']}%")
    print(f"\n  Ordered learning path:")
    for i, skill in enumerate(result["ordered_path"], 1):
        g    = result["gap_details"].get(skill, 0)
        flag = " [prereq]" if skill in result.get("prereqs_added", []) else ""
        print(f"    {i:>2}. {skill:<42} gap={g:.2f}{flag}")
    print(f"\n  Reasoning trace (first 5 steps):")
    for entry in result["reasoning_trace"][:5]:
        print(f"\n    Step {entry['step']}: {entry['skill']}")
        print(f"      {entry['reason']}")


if __name__ == "__main__":
    print("\nNeuralPath -- DAG Builder v2\n")

    skills_df, job_zones_df, occ_df = load_data()

    print("\nBuilding skill matrix...")
    skill_matrix = build_skill_matrix(skills_df)
    print(f"  {skill_matrix.shape[0]} occupations x {skill_matrix.shape[1]} skills")

    print("\nBuilding prerequisite DAG...")
    G = build_dag(skills_df, job_zones_df)

    print(f"\n  All prerequisite edges:")
    for u, v in sorted(G.edges(), key=lambda x: x[0]):
        print(f"    {u:<35} -> {v}")

    print(f"\nSaving to onet_data/skill_dag.pkl ...")
    with open(os.path.join(DATA_DIR, "skill_dag.pkl"), "wb") as f:
        pickle.dump({"graph": G, "skill_matrix": skill_matrix, "occ_df": occ_df}, f)
    print("  Saved.")

    print("\n" + "="*60)
    print("  TEST 1: Tech role gap")
    print("="*60)
    soc1, title1 = find_soc_in_matrix(skill_matrix, occ_df, "database admin")
    soc2, title2 = find_soc_in_matrix(skill_matrix, occ_df, "software develop")
    if soc1 and soc2:
        r1 = get_learning_path(G, skill_matrix, soc1, soc2, proficiency_boost=0.2)
        print_pathway(r1, title1, title2)
    else:
        print(f"  SOC not found (soc1={soc1}, soc2={soc2})")

    print("\n" + "="*60)
    print("  TEST 2: Cross-domain -- labor to management")
    print("="*60)
    soc3, title3 = find_soc_in_matrix(skill_matrix, occ_df, "stock")
    soc4, title4 = find_soc_in_matrix(skill_matrix, occ_df, "operations manager")
    if not soc3:
        soc3, title3 = skill_matrix.index[0], occ_df[occ_df["O*NET-SOC Code"] == skill_matrix.index[0]]["Title"].values[0]
    if not soc4:
        soc4, title4 = skill_matrix.index[-1], occ_df[occ_df["O*NET-SOC Code"] == skill_matrix.index[-1]]["Title"].values[0]
    r2 = get_learning_path(G, skill_matrix, soc3, soc4)
    print_pathway(r2, title3, title4)

    print("\n" + "="*60)
    print("  Done -- skill_dag.pkl ready for Person A")
    print("="*60)
    print("  Person A loads it with:")
    print("    import pickle")
    print("    data         = pickle.load(open('onet_data/skill_dag.pkl','rb'))")
    print("    G            = data['graph']")
    print("    skill_matrix = data['skill_matrix']")
    print("    occ_df       = data['occ_df']")
    print()
