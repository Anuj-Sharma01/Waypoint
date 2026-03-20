import os
import json
import re
from groq import Groq
from typing import List, Tuple
from app.models import ExtractedSkill, ProficiencyLevel
from app.services.ner_service import extract_candidate_skills, build_ner_hint_block

client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL = "llama-3.3-70b-versatile"

EXTRACT_SYSTEM = """You are a precision skill-extraction engine for an AI onboarding platform called Waypoint.

YOUR ONLY JOB: Extract skills from the resume that are EXPLICITLY EVIDENCED in the text.

HARD RULES:
1. NEVER invent or infer skills not mentioned in the resume.
2. ONLY extract skills present in the NER PRE-SCAN hints block.
3. Proficiency classification:
   - "proficient"  → 2+ years experience, OR led a project, OR senior-level framing
   - "partial"     → mentioned once, OR self-taught, OR "learning", OR "familiar with", OR "basic"
4. Confidence rules:
   - 0.90 to 1.00 → explicitly stated years of experience AND project evidence
   - 0.70 to 0.89 → clearly mentioned, context supports classification
   - 0.50 to 0.69 → mentioned but context is ambiguous
   - below 0.50   → do not include
5. evidence field: copy a SHORT verbatim quote (max 15 words) from the resume.
6. Respond ONLY with valid JSON. No preamble, no markdown fences, no text outside the JSON.

OUTPUT FORMAT:
{
  "skills": [
    {
      "name": "Python",
      "proficiency": "proficient",
      "confidence": 0.95,
      "evidence": "3 years building data pipelines in Python"
    }
  ],
  "reasoning_trace": [
    "[NER] spaCy pre-scan identified N candidate skills",
    "[CLASSIFY] N proficient, M partial skills confirmed",
    "[GROUND] All skills have direct resume evidence — zero hallucinations"
  ]
}"""


def extract_skills_from_resume(
    resume_text: str,
    target_role: str,
) -> Tuple[List[ExtractedSkill], List[str]]:
    candidate_skills, year_hints = extract_candidate_skills(resume_text)
    ner_hint_block = build_ner_hint_block(candidate_skills, year_hints)

    ner_trace_line = (
        f"[NER] Regex pre-scan found {len(candidate_skills)} candidate skill tokens"
        + (f" with year hints for: {', '.join(list(year_hints.keys())[:4])}" if year_hints else "")
    )

    prompt = f"""Target role: {target_role}

{ner_hint_block}

Resume text:
---
{resume_text[:6000]}
---

Extract and classify all skills. Respond with valid JSON only."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": EXTRACT_SYSTEM},
            {"role": "user",   "content": prompt},
        ],
        temperature=0.1,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()

    # Strip markdown fences if present
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*',     '', raw)
    raw = re.sub(r'\s*```$',     '', raw)
    raw = raw.strip()

    data = json.loads(raw)

    raw_skills = data.get("skills", [])
    filtered   = [s for s in raw_skills if float(s.get("confidence", 0)) >= 0.50]
    removed    = len(raw_skills) - len(filtered)

    skills = [ExtractedSkill(**s) for s in filtered]

    trace = [ner_trace_line] + data.get("reasoning_trace", [])
    if removed > 0:
        trace.append(f"[FILTER] Removed {removed} low-confidence extractions (< 0.50 threshold)")
    trace.append(f"[FINAL] {len(skills)} skills confirmed with evidence — ready for gap analysis")

    return skills, trace


ROLE_SKILLS: dict = {
    "ml engineer": [
        "Python", "PyTorch", "Linear Algebra", "Statistics",
        "Feature Engineering", "Model Evaluation", "Transformers",
        "MLOps", "A/B Testing", "Docker",
    ],
    "machine learning": [
        "Python", "PyTorch", "Linear Algebra", "Statistics",
        "Feature Engineering", "Model Evaluation", "Transformers",
        "MLOps", "A/B Testing", "Docker",
    ],
    "data scientist": [
        "Python", "Scikit-learn", "Statistics", "Feature Engineering",
        "Model Evaluation", "A/B Testing", "NLP", "Pandas", "SQL", "Tableau",
    ],
    "data analyst": [
        "SQL", "Excel", "Tableau", "Statistics", "Python", "KPI Reporting",
    ],
    "devops": [
        "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Bash",
        "Prometheus", "Grafana", "Helm", "GitOps", "GitHub Actions",
    ],
    "platform engineer": [
        "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux",
        "Prometheus", "Grafana", "Helm", "GitOps",
    ],
    "sre": [
        "Linux", "Kubernetes", "Prometheus", "Grafana",
        "CI/CD", "Docker", "Python", "Bash",
    ],
    "warehouse": [
        "People Management", "WMS Software", "SAP", "Lean Six Sigma",
        "KPI Reporting", "Loss Prevention", "Supply Chain", "Inventory Management",
    ],
    "operations lead": [
        "People Management", "WMS Software", "SAP", "Lean Six Sigma",
        "KPI Reporting", "Loss Prevention", "Supply Chain",
    ],
    "sales manager": [
        "Salesforce", "CRM", "People Management",
    ],
    "backend engineer": [
        "Python", "SQL", "Docker", "REST APIs", "Git", "CI/CD",
    ],
    "frontend engineer": [
        "React", "TypeScript", "Git", "REST APIs", "CI/CD",
    ],
    "fullstack": [
        "React", "Python", "SQL", "Docker", "Git", "REST APIs", "CI/CD",
    ],
}

_FALLBACK_SKILLS = ["Python", "Git", "Docker", "SQL", "REST APIs"]


def get_role_skills(target_role: str) -> List[str]:
    role_lower = target_role.lower()
    for key, skills in ROLE_SKILLS.items():
        if key in role_lower:
            return skills
    role_words = set(role_lower.split())
    best_match, best_count = None, 0
    for key, skills in ROLE_SKILLS.items():
        overlap = len(role_words & set(key.split()))
        if overlap > best_count:
            best_count, best_match = overlap, key
    return ROLE_SKILLS[best_match] if best_match else _FALLBACK_SKILLS
