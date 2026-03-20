"""
NeuralPath -- Proficiency Estimator
Person C deliverable: extracts skills from raw resume text and assigns
a proficiency score 0.0-1.0 per skill using keyword signals.

The score is used as `proficiency_boost` in get_learning_path() to skip
modules the hire already knows -- directly hitting the "reducing redundant
training" product impact criterion.

Run standalone to test:
    py -3 proficiency_estimator.py

Or import into Person A's API:
    from proficiency_estimator import estimate_proficiency, extract_skills_from_text
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Tuple


# ── 1. Proficiency signal keywords ───────────────────────────────────────────
# Each tier maps to a 0.0-1.0 score multiplier.
# We scan the sentence/phrase around each skill mention for these signals.

PROFICIENCY_SIGNALS = {
    # Expert tier → 0.9
    0.9: [
        "expert", "lead", "led", "senior", "principal", "architect",
        "10+ years", "10 years", "8+ years", "8 years", "9 years",
        "extensive", "deep expertise", "specialist", "master",
        "head of", "director of", "spearheaded", "pioneered",
    ],
    # Advanced tier → 0.7
    0.7: [
        "advanced", "proficient", "strong", "solid", "experienced",
        "5+ years", "5 years", "6 years", "7 years", "4+ years",
        "designed", "architected", "built", "developed", "implemented",
        "managed", "owned", "responsible for", "delivered",
    ],
    # Intermediate tier → 0.5
    0.5: [
        "intermediate", "working knowledge", "familiar", "comfortable",
        "2+ years", "2 years", "3 years", "3+ years", "1+ years",
        "used", "worked with", "experience with", "exposure to",
        "contributed", "assisted", "supported",
    ],
    # Beginner tier → 0.2
    0.2: [
        "basic", "beginner", "learning", "exposure", "introductory",
        "some experience", "limited", "entry level", "junior",
        "less than 1 year", "coursework", "studied", "pursuing",
        "intern", "trainee",
    ],
}

# Default score when skill is mentioned but no signal words found
DEFAULT_PROFICIENCY = 0.4


# ── 2. O*NET skill name → resume keyword aliases ──────────────────────────────
# Resume writers don't say "Active Listening" -- they say "communication".
# This maps O*NET canonical names to common resume phrases.

SKILL_ALIASES = {
    "Reading Comprehension":          ["reading", "documentation", "technical reading", "comprehension"],
    "Active Listening":               ["listening", "communication", "interpersonal", "stakeholder"],
    "Writing":                        ["writing", "documentation", "reports", "technical writing",
                                       "content", "copywriting", "authored"],
    "Speaking":                       ["presentation", "public speaking", "communication", "presenting",
                                       "speech", "verbal"],
    "Mathematics":                    ["mathematics", "math", "statistics", "quantitative", "calculus",
                                       "algebra", "numerical"],
    "Science":                        ["science", "research", "scientific", "laboratory", "physics",
                                       "chemistry", "biology"],
    "Critical Thinking":              ["critical thinking", "analytical", "analysis", "problem solving",
                                       "reasoning", "logical"],
    "Active Learning":                ["learning", "self-learning", "upskilling", "adaptable",
                                       "continuous learning", "fast learner"],
    "Learning Strategies":            ["training", "coaching", "mentoring", "pedagogy",
                                       "curriculum", "instructional"],
    "Monitoring":                     ["monitoring", "observing", "tracking", "oversight",
                                       "surveillance", "metrics"],
    "Social Perceptiveness":          ["empathy", "emotional intelligence", "interpersonal",
                                       "team dynamics", "culture"],
    "Coordination":                   ["coordination", "cross-functional", "collaboration",
                                       "teamwork", "liaison"],
    "Instructing":                    ["instructing", "teaching", "training", "mentoring",
                                       "coaching", "tutoring"],
    "Negotiation":                    ["negotiation", "negotiating", "contracts", "deals",
                                       "procurement", "vendor"],
    "Persuasion":                     ["persuasion", "influence", "stakeholder management",
                                       "buy-in", "advocacy"],
    "Service Orientation":            ["customer service", "client relations", "support",
                                       "customer success", "helpdesk"],
    "Complex Problem Solving":        ["problem solving", "troubleshooting", "debugging",
                                       "root cause", "resolution"],
    "Judgment and Decision Making":   ["decision making", "judgment", "prioritization",
                                       "risk assessment", "governance"],
    "Systems Analysis":               ["systems analysis", "requirements", "architecture",
                                       "system design", "analysis"],
    "Systems Evaluation":             ["evaluation", "assessment", "testing", "qa",
                                       "quality assurance", "benchmarking"],
    "Time Management":                ["time management", "deadline", "prioritization",
                                       "scheduling", "agile", "sprint"],
    "Management of Personnel Resources": ["people management", "team management", "hr",
                                          "hiring", "performance review", "headcount"],
    "Management of Financial Resources": ["budget", "financial management", "p&l",
                                           "cost management", "forecasting", "capex"],
    "Management of Material Resources":  ["resource management", "inventory", "supply chain",
                                           "procurement", "logistics", "assets"],
    "Operations Analysis":            ["operations", "process improvement", "workflow",
                                       "optimization", "lean", "six sigma"],
    "Operations Monitoring":          ["monitoring", "kpi", "dashboards", "performance",
                                       "metrics", "reporting"],
    "Quality Control Analysis":       ["quality control", "qc", "qa", "inspection",
                                       "compliance", "standards", "iso"],
    "Technology Design":              ["design", "system design", "architecture",
                                       "solution design", "engineering"],
    "Equipment Selection":            ["equipment", "procurement", "vendor selection",
                                       "specification", "tools"],
    "Installation":                   ["installation", "deployment", "setup", "configuration",
                                       "infrastructure", "devops"],
    "Equipment Maintenance":          ["maintenance", "upkeep", "servicing",
                                       "preventive maintenance", "repair"],
    "Troubleshooting":                ["troubleshooting", "debugging", "issue resolution",
                                       "incident response", "support"],
    "Repairing":                      ["repair", "fixing", "maintenance", "restoration"],
    "Programming":                    ["programming", "coding", "software development",
                                       "python", "java", "javascript", "c++", "sql",
                                       "developer", "engineer", "backend", "frontend"],
    "Science":                        ["data science", "machine learning", "ml", "ai",
                                       "deep learning", "nlp", "research"],
}


# ── 3. Core proficiency estimator ────────────────────────────────────────────

@dataclass
class SkillEstimate:
    skill:       str
    score:       float          # 0.0 – 1.0
    tier:        str            # "expert" / "advanced" / "intermediate" / "beginner" / "mentioned"
    evidence:    str            # the sentence where this was found
    boost:       float          # score to pass as proficiency_boost to get_learning_path()


def _tier_label(score: float) -> str:
    if score >= 0.85: return "expert"
    if score >= 0.65: return "advanced"
    if score >= 0.40: return "intermediate"
    if score >= 0.15: return "beginner"
    return "mentioned"


def _get_context(text: str, keyword: str, window: int = 120) -> str:
    """Return the surrounding characters around a keyword match."""
    idx = text.lower().find(keyword.lower())
    if idx == -1:
        return ""
    start = max(0, idx - window)
    end   = min(len(text), idx + len(keyword) + window)
    return text[start:end]


def estimate_proficiency(resume_text: str,
                         target_skills: List[str] = None
                         ) -> Dict[str, SkillEstimate]:
    """
    Parse resume_text and return a dict of {skill_name: SkillEstimate}
    for every O*NET skill found.

    Args:
        resume_text   : raw resume as a string (paste the whole thing)
        target_skills : optional list of skill names to limit to
                        (e.g. only score skills in the gap)

    Returns:
        dict {skill_name -> SkillEstimate}
    """
    text_lower = resume_text.lower()
    skills_to_check = target_skills if target_skills else list(SKILL_ALIASES.keys())

    results: Dict[str, SkillEstimate] = {}

    for skill in skills_to_check:
        aliases = SKILL_ALIASES.get(skill, [skill.lower()])
        best_score    = 0.0
        best_evidence = ""

        for alias in aliases:
            if alias.lower() not in text_lower:
                continue

            # Get surrounding context
            context = _get_context(resume_text, alias)
            if not context:
                continue

            context_lower = context.lower()

            # Score based on proficiency signals in context
            matched_score = DEFAULT_PROFICIENCY
            for score_val, keywords in sorted(PROFICIENCY_SIGNALS.items(),
                                               reverse=True):
                for kw in keywords:
                    if kw in context_lower:
                        matched_score = score_val
                        break
                else:
                    continue
                break

            if matched_score > best_score:
                best_score    = matched_score
                best_evidence = context.strip().replace("\n", " ")

        if best_score > 0:
            results[skill] = SkillEstimate(
                skill    = skill,
                score    = best_score,
                tier     = _tier_label(best_score),
                evidence = best_evidence[:200],
                boost    = best_score,   # pass directly as proficiency_boost
            )

    return results


def get_proficiency_boost(estimates: Dict[str, SkillEstimate]) -> float:
    """
    Compute a single proficiency_boost float (0.0-1.0) to pass into
    get_learning_path(). Uses the median score across detected skills.
    A senior hire with strong scores gets a higher boost -> more modules skipped.
    """
    if not estimates:
        return 0.0
    scores = [e.score for e in estimates.values()]
    scores.sort()
    mid = len(scores) // 2
    median = scores[mid] if len(scores) % 2 != 0 else (scores[mid-1] + scores[mid]) / 2
    return round(median, 2)


def extract_skills_from_text(resume_text: str,
                              min_score: float = 0.2
                              ) -> List[Tuple[str, float]]:
    """
    Simplified interface: returns a sorted list of (skill_name, score) tuples
    for skills found in the resume above min_score threshold.
    Suitable for passing to Person A's API as current_skills.
    """
    estimates = estimate_proficiency(resume_text)
    found = [(skill, est.score) for skill, est in estimates.items()
             if est.score >= min_score]
    return sorted(found, key=lambda x: x[1], reverse=True)


# ── 4. Pretty printer ─────────────────────────────────────────────────────────

def print_estimates(estimates: Dict[str, SkillEstimate], title: str = ""):
    tier_order = {"expert": 0, "advanced": 1, "intermediate": 2,
                  "beginner": 3, "mentioned": 4}
    sorted_est = sorted(estimates.values(),
                        key=lambda e: tier_order.get(e.tier, 5))
    print(f"\n{'='*60}")
    if title:
        print(f"  {title}")
    print(f"  Skills detected: {len(estimates)}")
    boost = get_proficiency_boost(estimates)
    print(f"  Proficiency boost: {boost}  (pass this to get_learning_path)")
    print(f"{'='*60}")
    print(f"  {'Skill':<40} {'Score':>6}  {'Tier':<14}  Evidence snippet")
    print(f"  {'-'*38}  {'-'*6}  {'-'*12}  {'-'*20}")
    for e in sorted_est:
        snippet = e.evidence[:50].replace("\n", " ") + "..." if e.evidence else "-"
        print(f"  {e.skill:<40} {e.score:>6.2f}  {e.tier:<14}  {snippet}")


# ── 5. Test resumes ───────────────────────────────────────────────────────────

SAMPLE_RESUME_SENIOR_DEV = """
John Smith | Senior Software Engineer | 8 years experience

EXPERIENCE
Senior Software Engineer, TechCorp (2019-2024)
- Led development of microservices architecture using Python and Java
- Architected distributed systems handling 10M+ daily requests
- Mentored team of 5 junior developers, conducted code reviews
- Spearheaded migration to Kubernetes, reducing deployment time by 60%
- Expert in system design, algorithms, and data structures
- Deep expertise in backend programming and API design
- Managed cross-functional collaboration with product and design teams
- Advanced proficiency in SQL databases and query optimization

EDUCATION
B.Sc. Computer Science — strong foundation in mathematics and algorithms
"""

SAMPLE_RESUME_WAREHOUSE = """
Maria Garcia | Warehouse Associate | 3 years

EXPERIENCE
Stock Associate, RetailMart (2021-2024)
- Responsible for inventory management and stock replenishment
- Basic computer skills, used warehouse management software
- Assisted team coordination for loading and unloading
- Some experience with equipment operation and safety procedures
- Worked with team members to meet daily targets
- Basic reporting of stock levels to supervisor
- Entry level experience with quality checks on incoming goods

SKILLS
- Basic math for counting inventory
- Communication with team
- Following instructions from management
"""

SAMPLE_RESUME_DATA_ANALYST = """
Priya Patel | Data Analyst | 4 years experience

EXPERIENCE
Data Analyst, FinanceCo (2020-2024)
- Advanced proficiency in Python and SQL for data analysis
- Strong experience with statistical modeling and quantitative analysis
- Developed dashboards and KPI monitoring systems
- Proficient in data visualization and reporting
- Comfortable with machine learning concepts, exposure to scikit-learn
- Collaborated cross-functionally with engineering and product teams
- 3 years experience with Excel and financial modeling
- Working knowledge of Tableau and Power BI

EDUCATION
B.Sc. Mathematics and Statistics
"""


# ── 6. Main ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("\nNeuralPath -- Proficiency Estimator\n")

    # Test 1: Senior developer
    print("Parsing Resume 1: Senior Software Engineer...")
    est1 = estimate_proficiency(SAMPLE_RESUME_SENIOR_DEV)
    print_estimates(est1, "Senior Software Engineer")
    boost1 = get_proficiency_boost(est1)

    # Test 2: Warehouse worker
    print("\nParsing Resume 2: Warehouse Associate...")
    est2 = estimate_proficiency(SAMPLE_RESUME_WAREHOUSE)
    print_estimates(est2, "Warehouse Associate")
    boost2 = get_proficiency_boost(est2)

    # Test 3: Data analyst
    print("\nParsing Resume 3: Data Analyst...")
    est3 = estimate_proficiency(SAMPLE_RESUME_DATA_ANALYST)
    print_estimates(est3, "Data Analyst")
    boost3 = get_proficiency_boost(est3)

    # Summary comparison
    print(f"\n{'='*60}")
    print(f"  Proficiency boost comparison")
    print(f"{'='*60}")
    print(f"  Senior Dev   boost={boost1:.2f}  -> skips more modules (experienced)")
    print(f"  Data Analyst boost={boost2:.2f}  -> skips some modules")
    print(f"  Warehouse    boost={boost3:.2f}  -> skips fewer modules (entry level)")

    print(f"\n  How to use in get_learning_path():")
    print(f"    result = get_learning_path(")
    print(f"        G, skill_matrix,")
    print(f"        current_soc = '15-1252.00',")
    print(f"        target_soc  = '15-1299.08',")
    print(f"        proficiency_boost = {boost1}   # from estimate_proficiency()")
    print(f"    )")

    print(f"\n  extract_skills_from_text() output for Senior Dev:")
    skills_list = extract_skills_from_text(SAMPLE_RESUME_SENIOR_DEV)
    for skill, score in skills_list:
        bar = "#" * int(score * 20)
        print(f"    {skill:<40} {score:.2f}  {bar}")

    print("\nDone.\n")
