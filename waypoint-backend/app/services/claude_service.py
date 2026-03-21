import os
import json
import re
from groq import Groq
from typing import List, Tuple
from app.models import ExtractedSkill, ProficiencyLevel
from app.services.ner_service import extract_candidate_skills, build_ner_hint_block

client = Groq(api_key=os.environ["GROQ_API_KEY"])
MODEL  = "llama-3.3-70b-versatile"

# ── Skill extraction prompt ───────────────────────────────────────────────────
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
6. Respond ONLY with valid JSON. No preamble, no markdown fences.

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
    "[NER] Pre-scan identified N candidate skills",
    "[CLASSIFY] N proficient, M partial skills confirmed",
    "[GROUND] All skills have direct resume evidence"
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
    raw = re.sub(r'^```json\s*', '', raw)
    raw = re.sub(r'^```\s*',     '', raw)
    raw = re.sub(r'\s*```$',     '', raw)
    raw = raw.strip()

    data       = json.loads(raw)
    raw_skills = data.get("skills", [])
    filtered   = [s for s in raw_skills if float(s.get("confidence", 0)) >= 0.50]
    removed    = len(raw_skills) - len(filtered)
    skills     = [ExtractedSkill(**s) for s in filtered]

    trace = [ner_trace_line] + data.get("reasoning_trace", [])
    if removed > 0:
        trace.append(f"[FILTER] Removed {removed} low-confidence extractions (< 0.50)")
    trace.append(f"[FINAL] {len(skills)} skills confirmed — ready for gap analysis")

    return skills, trace


# ── Dynamic role skill extraction ────────────────────────────────────────────

ROLE_SKILLS_SYSTEM = """You are a job requirements analyst. Given a job title or job description,
return the top 8-12 skills required for that role.

RULES:
1. Return ONLY a JSON array of skill name strings
2. Use canonical skill names (e.g. "Python" not "python programming")
3. Include both technical AND soft skills relevant to the role
4. Order from most critical to least critical
5. No preamble, no explanation, just the JSON array

Example output:
["Python", "PyTorch", "SQL", "Docker", "Statistics", "Feature Engineering", "Model Evaluation", "MLOps"]"""


def get_role_skills(target_role: str, job_description: str = "") -> List[str]:
    """
    Dynamically extract required skills for ANY role using Groq.
    Falls back to hardcoded list if API call fails.
    """
    try:
        content = job_description[:3000] if job_description else target_role

        prompt = f"""Role: {target_role}

Job Description:
{content}

Return the top 8-12 required skills as a JSON array."""

        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": ROLE_SKILLS_SYSTEM},
                {"role": "user",   "content": prompt},
            ],
            temperature=0.1,
            max_tokens=300,
        )

        raw = response.choices[0].message.content.strip()
        raw = re.sub(r'^```json\s*', '', raw)
        raw = re.sub(r'^```\s*',     '', raw)
        raw = re.sub(r'\s*```$',     '', raw)
        raw = raw.strip()

        skills = json.loads(raw)
        if isinstance(skills, list) and len(skills) > 0:
            return skills

    except Exception as e:
        print(f"[WARN] Dynamic role skill extraction failed: {e}. Using fallback.")

    # ── Fallback for common roles ─────────────────────────────────────────────
    fallbacks = {
        "ml engineer":       ["Python", "PyTorch", "Linear Algebra", "Statistics", "Feature Engineering", "Model Evaluation", "Transformers", "MLOps", "Docker"],
        "data scientist":    ["Python", "Scikit-learn", "Statistics", "Feature Engineering", "Model Evaluation", "A/B Testing", "SQL", "Pandas"],
        "devops":            ["Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Prometheus", "Grafana", "GitHub Actions"],
        "warehouse":         ["People Management", "WMS Software", "SAP", "Lean Six Sigma", "KPI Reporting", "Loss Prevention", "Inventory Management"],
        "data analyst":      ["SQL", "Excel", "Tableau", "Statistics", "Python", "KPI Reporting"],
        "backend engineer":  ["Python", "SQL", "Docker", "REST APIs", "Git", "CI/CD"],
        "frontend engineer": ["React", "TypeScript", "Git", "REST APIs", "CSS", "CI/CD"],
        "sales manager":     ["Salesforce", "CRM", "People Management", "Communication", "Negotiation"],
    }

    role_lower = target_role.lower()
    for key, skills in fallbacks.items():
        if any(word in role_lower for word in key.split()):
            return skills

    return ["Python", "Git", "Docker", "SQL", "REST APIs", "Communication"]
