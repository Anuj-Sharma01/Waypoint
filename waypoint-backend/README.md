# Waypoint — AI-Adaptive Onboarding Engine

> **Tagline:** Your shortest path to role-ready.

Waypoint is an AI-driven adaptive learning engine that parses a candidate's resume, identifies skill gaps against a target role, and generates a personalized, optimally-ordered training pathway — skipping what they already know.

---

## Table of Contents
- [Architecture](#architecture)
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
- [Skill-Gap Analysis Logic](#skill-gap-analysis-logic)
- [Adaptive Pathing Algorithm](#adaptive-pathing-algorithm)
- [Tech Stack](#tech-stack)
- [Datasets](#datasets)
- [Running Tests](#running-tests)
- [Docker](#docker)

---

## Architecture

```
Resume (PDF/DOCX) + Target Role
         │
         ▼
 ┌───────────────────┐
 │  PDF/DOCX Parser  │  pdfplumber / python-docx
 └────────┬──────────┘
          │ plain text
          ▼
 ┌───────────────────┐
 │  Claude API (NER) │  Skill extraction with proficiency + confidence
 └────────┬──────────┘
          │ [ExtractedSkill list]
          ▼
 ┌───────────────────────────────────┐
 │  Skill Gap Analysis               │
 │  Required Skills (O*NET-mapped)   │
 │  − Proficient = skip              │
 │  − Partial    = compress module   │
 │  − None       = full module       │
 └────────┬──────────────────────────┘
          │ gap skill list
          ▼
 ┌───────────────────────────────────┐
 │  Prerequisite DAG (NetworkX)      │
 │  Topological sort → ordered path  │
 └────────┬──────────────────────────┘
          │ ordered module IDs
          ▼
 ┌───────────────────────────────────┐
 │  Catalog Grounding                │  Zero hallucination guarantee
 │  Every module validated against   │
 │  course_catalog.json              │
 └────────┬──────────────────────────┘
          │
          ▼
   PathwayResponse (JSON)
   + reasoning_trace per module
```

---

## Setup

### Prerequisites
- Python 3.11+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Install

```bash
git clone https://github.com/your-team/waypoint
cd waypoint-backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Configure environment

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Run

```bash
uvicorn app.main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

---

## API Endpoints

### `POST /extract` — Extract skills from resume
Upload a resume file and get back structured skill data.

```bash
curl -X POST http://localhost:8000/extract \
  -F "file=@resume.pdf" \
  -F "target_role=ML Engineer"
```

**Response:**
```json
{
  "skills": [
    { "name": "Python", "proficiency": "proficient", "confidence": 0.95, "evidence": "3 years building data pipelines" },
    { "name": "Docker", "proficiency": "partial",    "confidence": 0.72, "evidence": "basic Docker experience" }
  ],
  "target_role": "ML Engineer",
  "reasoning_trace": ["[PARSE] Scanned resume...", "[NLP] Found 8 skills..."]
}
```

### `POST /pathway` — Generate adaptive learning pathway
Full pipeline: resume → skills → gap → ordered modules.

```bash
curl -X POST http://localhost:8000/pathway \
  -F "file=@resume.pdf" \
  -F "target_role=ML Engineer"
```

**Response:**
```json
{
  "target_role": "ML Engineer",
  "modules": [
    {
      "module_id": "linear_algebra",
      "title": "Linear Algebra for ML",
      "hours": 8,
      "priority": "PREREQUISITE",
      "skip_reason": null,
      "why_included": "Dependency path resolved. Required prerequisite for PyTorch.",
      "estimated_savings_pct": 0
    }
  ],
  "total_hours": 52,
  "standard_hours": 84,
  "time_saved_pct": 38,
  "skill_gaps": ["PyTorch", "Transformers", "MLOps"],
  "existing_skills": ["Python", "SQL", "Git"],
  "partial_skills": ["Docker", "Statistics"],
  "reasoning_trace": ["[CLASSIFY] Proficient: 3, Partial: 2, Gaps: 5", "..."]
}
```

### `POST /extract/text` and `POST /pathway/text`
JSON body versions for easy testing (no file upload required).

```bash
curl -X POST http://localhost:8000/pathway/text \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "Python developer, 2 years...", "target_role": "ML Engineer"}'
```

### `GET /catalog` — Course catalog
```bash
curl http://localhost:8000/catalog
curl http://localhost:8000/catalog?domain=tech
curl http://localhost:8000/catalog?tag=docker
curl http://localhost:8000/catalog/pytorch_fundamentals
```

---

## Skill-Gap Analysis Logic

1. **Extraction**: Claude (claude-sonnet-4) is prompted with a strict system message requiring evidence-based extraction only. Each skill is returned with proficiency level (`proficient` / `partial`) and a quoted evidence string from the resume. This eliminates hallucination at the extraction stage.

2. **Role mapping**: Each target role is mapped to a required skill set using a role dictionary informed by the O*NET skill taxonomy. Example: ML Engineer requires `[PyTorch, Feature Engineering, Model Evaluation, Transformers, MLOps, A/B Testing, ...]`.

3. **Gap classification**:
   - **Proficient** → skip entirely in pathway
   - **Partial** → include module but compress by ~35% (skip intro sections)
   - **None** → full module included

---

## Adaptive Pathing Algorithm

The core algorithm uses a **directed acyclic graph (DAG)** of skill prerequisites:

```
Python ──────────────► PyTorch ──────► Transformers
         Linear Algebra ──►↑
Statistics ──► Model Evaluation ──► A/B Testing
Docker ──────────────────────────────► MLOps ◄──┘
```

**Steps:**
1. Build DAG from `course_catalog.json` prerequisite definitions
2. Identify all gap modules (skills the candidate is missing)
3. Use `networkx.ancestors()` to find all transitive prerequisites for gap modules
4. Skip prerequisites already covered by the candidate's proficient skills
5. Run `networkx.topological_sort()` on the subgraph — this guarantees modules are ordered so prerequisites always appear before the modules that depend on them
6. Apply compression factors for partial skills
7. Ground every output module against the catalog (if a module ID doesn't exist in `course_catalog.json`, it cannot appear in the response)

This is functionally equivalent to **Dijkstra's shortest path on a gap-weighted DAG** — the topological sort finds the minimum-length path through the skill dependency graph that closes all gaps.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| API framework | FastAPI (Python 3.11) |
| LLM (skill extraction) | Claude claude-sonnet-4 via Anthropic API |
| NER layer | spaCy `en_core_web_sm` |
| Graph algorithm | NetworkX (DAG + topological sort) |
| PDF parsing | pdfplumber |
| DOCX parsing | python-docx |
| Containerization | Docker + Docker Compose |

---

## Datasets

All datasets used for skill taxonomy and role mapping:

| Dataset | Source | Usage |
|---------|--------|-------|
| O*NET Database v28.2 | [onetcenter.org](https://www.onetcenter.org/db_releases.html) | Skill taxonomy, role-skill mappings |
| Resume Dataset | [Kaggle — snehaanbhawal](https://www.kaggle.com/datasets/snehaanbhawal/resume-dataset/data) | Resume format reference and testing |
| Jobs & Job Descriptions | [Kaggle — kshitizregmi](https://www.kaggle.com/datasets/kshitizregmi/jobs-and-job-description) | JD keyword extraction for role mapping |

---

## Running Tests

```bash
# Start the server first
uvicorn app.main:app --reload

# In a separate terminal
python test_api.py
```

---

## Docker

```bash
# Backend only
docker build -t waypoint-backend .
docker run -p 8000:8000 --env-file .env waypoint-backend

# Full stack (backend + frontend)
docker-compose up --build
```
