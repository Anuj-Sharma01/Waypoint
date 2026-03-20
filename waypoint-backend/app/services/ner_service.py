"""
NER layer for skill entity extraction.
Uses regex + keyword matching (spaCy removed for Python 3.13 compatibility).
"""

import re
from typing import List, Tuple

TECH_SKILLS = {
    "python", "java", "javascript", "typescript", "go", "golang", "rust",
    "c++", "c#", "scala", "r", "julia", "bash", "shell",
    "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn", "huggingface",
    "transformers", "bert", "gpt", "llm", "nlp", "spacy", "nltk", "opencv",
    "mlflow", "wandb", "ray", "xgboost", "lightgbm", "catboost",
    "pandas", "numpy", "spark", "hadoop", "kafka", "airflow", "dbt",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "tableau", "power bi", "looker", "excel",
    "linear algebra", "statistics", "probability", "calculus",
    "feature engineering", "model evaluation", "a/b testing",
    "docker", "kubernetes", "k8s", "terraform", "ansible", "helm",
    "ci/cd", "github actions", "jenkins", "argocd", "gitops",
    "prometheus", "grafana", "datadog", "linux", "networking", "aws", "gcp", "azure",
    "react", "vue", "angular", "fastapi", "django", "flask", "nodejs",
    "rest", "graphql", "grpc",
    "git", "agile", "scrum", "jira", "oop", "design patterns",
}

OPERATIONAL_SKILLS = {
    "warehouse management", "wms", "sap", "erp", "inventory management",
    "supply chain", "logistics", "procurement", "lean", "six sigma",
    "dmaic", "kaizen", "5s", "kpi", "sla", "otp", "loss prevention",
    "people management", "team management", "performance management",
    "coaching", "delegation", "conflict resolution",
    "forklift", "safety protocols", "osha",
}

BUSINESS_SKILLS = {
    "salesforce", "crm", "sales", "account management", "business development",
    "project management", "pmp", "stakeholder management",
    "financial modeling", "communication",
}

ALL_SKILLS = TECH_SKILLS | OPERATIONAL_SKILLS | BUSINESS_SKILLS


def extract_candidate_skills(text: str) -> Tuple[List[Tuple[str, str]], dict]:
    text_lower = text.lower()
    found: List[Tuple[str, str]] = []
    found_names: set = set()

    for skill in ALL_SKILLS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        matches = list(re.finditer(pattern, text_lower))
        if matches:
            m = matches[0]
            start = max(0, m.start() - 40)
            end   = min(len(text), m.end() + 40)
            context = text[start:end].replace("\n", " ").strip()
            canonical = _canonicalize(skill)
            if canonical and canonical not in found_names:
                found.append((canonical, context))
                found_names.add(canonical)

    # Year/experience extraction
    year_hints: dict = {}
    exp_patterns = [
        r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+(?:with|in)\s+)?([a-zA-Z\s/\+#]+)',
        r'([a-zA-Z\s/\+#]+)\s*\((\d+)\+?\s*years?\)',
    ]
    for pat in exp_patterns:
        for match in re.finditer(pat, text_lower):
            groups = match.groups()
            if groups[0].isdigit():
                years, skill_raw = int(groups[0]), groups[1].strip()
            else:
                skill_raw, years = groups[0].strip(), int(groups[1])
            canonical = _canonicalize(skill_raw)
            if canonical:
                year_hints[canonical] = years

    return found, year_hints


def _canonicalize(token: str) -> str:
    mapping = {
        "sklearn": "Scikit-learn", "scikit-learn": "Scikit-learn", "scikit learn": "Scikit-learn",
        "pytorch": "PyTorch", "tensorflow": "TensorFlow", "k8s": "Kubernetes",
        "kubernetes": "Kubernetes", "ci/cd": "CI/CD", "nlp": "NLP", "llm": "LLMs",
        "linear algebra": "Linear Algebra", "feature engineering": "Feature Engineering",
        "model evaluation": "Model Evaluation", "a/b testing": "A/B Testing",
        "power bi": "Power BI", "github actions": "GitHub Actions",
        "people management": "People Management", "team management": "People Management",
        "inventory management": "Inventory Management",
        "warehouse management": "WMS Software", "wms": "WMS Software",
        "supply chain": "Supply Chain", "loss prevention": "Loss Prevention",
        "six sigma": "Lean Six Sigma", "lean": "Lean Six Sigma", "golang": "Go",
    }
    t = token.strip().lower()
    if t in mapping:
        return mapping[t]
    if t in ALL_SKILLS:
        return token.strip().title()
    return ""


def build_ner_hint_block(candidate_skills: List[Tuple[str, str]], year_hints: dict) -> str:
    if not candidate_skills:
        return ""
    lines = ["[NER PRE-SCAN — use these as extraction hints, do not hallucinate beyond them]"]
    for skill, context in candidate_skills[:30]:
        years = year_hints.get(skill)
        year_str = f" ({years} years mentioned)" if years else ""
        lines.append(f"  • {skill}{year_str} — context: \"{context}\"")
    return "\n".join(lines)
