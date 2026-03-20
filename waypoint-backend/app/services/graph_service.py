import json
import os
import networkx as nx
from typing import List, Dict, Tuple
from app.models import ExtractedSkill, ProficiencyLevel, PathwayModule

# ── Load catalog once at import time ─────────────────────────────────────────
_CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "course_catalog.json")
with open(_CATALOG_PATH) as f:
    CATALOG: List[Dict] = json.load(f)

CATALOG_BY_ID   = {m["id"]: m for m in CATALOG}
CATALOG_BY_TAGS = {}
for module in CATALOG:
    for tag in module["tags"]:
        CATALOG_BY_TAGS.setdefault(tag.lower(), []).append(module["id"])


def build_prerequisite_dag() -> nx.DiGraph:
    """
    Build a directed acyclic graph where:
      - Nodes = module IDs
      - Edges A → B = "A must be completed before B"
    """
    G = nx.DiGraph()
    for module in CATALOG:
        G.add_node(module["id"], **module)
        for prereq in module["prerequisites"]:
            G.add_edge(prereq, module["id"])
    return G


def skill_name_to_module_ids(skill_name: str) -> List[str]:
    """Map a canonical skill name to relevant catalog module IDs via tag matching."""
    name_lower = skill_name.lower()
    matched = set()

    # Direct tag match
    if name_lower in CATALOG_BY_TAGS:
        matched.update(CATALOG_BY_TAGS[name_lower])

    # Partial tag match (e.g. "pytorch" matches "pytorch fundamentals")
    for tag, module_ids in CATALOG_BY_TAGS.items():
        if name_lower in tag or tag in name_lower:
            matched.update(module_ids)

    return list(matched)


def compute_pathway(
    skills: List[ExtractedSkill],
    target_role: str,
    required_skills: List[str],
) -> Tuple[List[PathwayModule], List[str]]:
    """
    Core adaptive pathing algorithm:
    1. Classify each skill as proficient / partial / gap
    2. Map skill gaps to catalog modules
    3. Build prerequisite DAG
    4. Topological sort of needed modules (respects prerequisites)
    5. For partial skills, mark module as compressed
    6. Return ordered PathwayModules + reasoning trace
    """
    trace = []

    # ── Step 1: Classify skills ───────────────────────────────────────────────
    proficient_names = {s.name.lower() for s in skills if s.proficiency == ProficiencyLevel.PROFICIENT}
    partial_names    = {s.name.lower() for s in skills if s.proficiency == ProficiencyLevel.PARTIAL}
    gap_names        = {r.lower() for r in required_skills
                        if r.lower() not in proficient_names and r.lower() not in partial_names}

    trace.append(f"[CLASSIFY] Proficient skills: {len(proficient_names)} | Partial: {len(partial_names)} | Gaps: {len(gap_names)}")
    trace.append(f"[GAPS] Missing skills: {', '.join(list(gap_names)[:8])}")

    # ── Step 2: Map gaps to modules ───────────────────────────────────────────
    needed_module_ids = set()
    for gap in gap_names:
        matched = skill_name_to_module_ids(gap)
        needed_module_ids.update(matched)

    # Also include partial skill modules (they need upskilling, not full coverage)
    partial_module_ids = set()
    for partial in partial_names:
        matched = skill_name_to_module_ids(partial)
        partial_module_ids.update(matched)

    trace.append(f"[MODULES] {len(needed_module_ids)} gap modules + {len(partial_module_ids)} partial modules identified")

    # ── Step 3: Build DAG and resolve prerequisites ───────────────────────────
    G = build_prerequisite_dag()

    # Expand needed_module_ids to include all transitive prerequisites
    all_needed = set(needed_module_ids)
    for mod_id in list(needed_module_ids):
        if mod_id in G:
            ancestors = nx.ancestors(G, mod_id)
            # Only add ancestors that are NOT already covered by proficient skills
            for anc in ancestors:
                anc_module = CATALOG_BY_ID.get(anc, {})
                anc_tags   = {t.lower() for t in anc_module.get("tags", [])}
                # Skip if candidate is already proficient in this topic
                if not any(p in anc_tags for p in proficient_names):
                    all_needed.add(anc)

    trace.append(f"[DAG] After prerequisite expansion: {len(all_needed)} total modules")

    # ── Step 4: Topological sort (respects prerequisite order) ────────────────
    subgraph  = G.subgraph(all_needed & set(G.nodes))
    try:
        ordered_ids = list(nx.topological_sort(subgraph))
    except nx.NetworkXUnfeasible:
        ordered_ids = list(all_needed)  # Fallback if cycle detected (shouldn't happen)

    trace.append(f"[TOPO] Topological sort complete — {len(ordered_ids)} modules in dependency order")

    # ── Step 5: Build PathwayModule objects ───────────────────────────────────
    modules: List[PathwayModule] = []
    total_hours    = 0
    standard_hours = 0

    for i, mod_id in enumerate(ordered_ids):
        if mod_id not in CATALOG_BY_ID:
            continue

        mod       = CATALOG_BY_ID[mod_id]
        mod_tags  = {t.lower() for t in mod["tags"]}
        is_gap    = mod_id in needed_module_ids
        is_partial = mod_id in partial_module_ids

        standard_hours += mod["hours"]

        # Determine savings from existing skills
        overlap = proficient_names & mod_tags
        if overlap:
            savings_pct = min(50, len(overlap) * 15)
        elif is_partial:
            savings_pct = 35
        else:
            savings_pct = 0

        actual_hours = max(1, int(mod["hours"] * (1 - savings_pct / 100)))
        total_hours += actual_hours

        # Determine priority
        prereqs = mod.get("prerequisites", [])
        if not prereqs:
            priority = "PREREQUISITE"
        elif i < len(ordered_ids) // 3:
            priority = "CORE GAP"
        elif i < 2 * len(ordered_ids) // 3:
            priority = "ADVANCED"
        else:
            priority = "CAPSTONE"

        # Build skip reason if applicable
        skip_reason = None
        if overlap:
            skip_reason = f"Proficiency in {', '.join(overlap)} detected — intro sections skipped"
        elif is_partial:
            skip_reason = f"Partial proficiency detected — foundational sections compressed by ~35%"

        why = (
            f"Dependency path resolved via topological sort. "
            f"{'Gap skill — required by target role. ' if is_gap else 'Prerequisite for downstream modules. '}"
            f"{'Partial proficiency → module compressed. ' if is_partial else ''}"
            f"Estimated actual hours: {actual_hours}h vs standard {mod['hours']}h."
        )

        modules.append(PathwayModule(
            module_id           = mod_id,
            title               = mod["title"],
            hours               = actual_hours,
            priority            = priority,
            skip_reason         = skip_reason,
            why_included        = why,
            estimated_savings_pct = savings_pct,
        ))

    time_saved_pct = round((1 - total_hours / standard_hours) * 100) if standard_hours else 0
    trace.append(f"[RESULT] {len(modules)} modules | {total_hours}h vs {standard_hours}h standard | {time_saved_pct}% saved")
    trace.append("[GROUND] All modules validated against course_catalog.json — zero hallucinations")

    return modules, trace, total_hours, standard_hours, time_saved_pct
