# WayPoint — Setup Guide

## Prerequisites
- Docker Desktop → https://www.docker.com/products/docker-desktop
- Git → https://git-scm.com

> **Note:** Docker Desktop must be **running** before you start. Look for the Docker whale icon in your taskbar/menu bar.

---

## Setup (3 steps)

### Step 1 — Clone the repo
```bash
git clone https://github.com/Anuj-Sharma01/Waypoint.git
cd Waypoint
```

### Step 2 — Add the API key

**Windows PowerShell:**
```powershell
"GROQ_API_KEY=gsk_YOUR_KEY_HERE" | Out-File -FilePath waypoint-backend/.env -Encoding utf8 -NoNewline
```

**Mac/Linux Terminal:**
```bash
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > waypoint-backend/.env
```

> **Note for judges:** A working Groq API key has been provided separately in the submission.
> Don't have one? Get a free key in 30 seconds at https://console.groq.com

### Step 3 — Run everything
```bash
docker-compose up --build
```

First build takes **3–5 minutes** (Docker pulls base images). Subsequent runs take ~30 seconds.

Once you see this in the terminal:
```
backend   | INFO:     Application startup complete.
frontend  | ➜  Local:   http://localhost:5173/
```

Open your browser:
- **App** → http://localhost:5173
- **API Docs (Swagger)** → http://localhost:8000/docs

## That's it! 🚀

---

## What's included

| Component | Details |
|-----------|---------|
| Frontend | React 18 + Tailwind CSS, port 5173 |
| Backend | FastAPI + Uvicorn, port 8000 |
| LLM | Groq Llama 3.3 70B (requires API key) |
| Course data | Coursera Dataset 2021 — 3,522 real courses (bundled, no download needed) |
| Graph engine | NetworkX DAG built from O*NET v28.2 taxonomy |

---

## Try it — Quick demo

Once running, try this flow:

**1. Generate a pathway:**
- Go to http://localhost:5173/upload
- Paste this resume:
```
Software Engineer, 2 years Python, SQL, Git. Basic Docker. Learning PyTorch.
```
- Paste this job description:
```
ML Engineer
Requires PyTorch, Feature Engineering, MLOps, Transformers, A/B Testing.
```
- Click **Generate Learning Pathway**

**2. Score a resume:**
- Go to http://localhost:5173/score
- Upload a PDF resume or paste text
- Paste the same job description
- Click **Score My Resume**

**3. Take a skill test:**
- Go to http://localhost:5173/test
- After running the analysis above, your gap skills appear automatically
- Click any skill to start the adaptive test

**4. Search courses:**
- Go to http://localhost:5173/courses
- Search any skill — e.g. "Spring Boot", "Machine Learning", "Leadership"

---

## Stopping the app
```bash
docker-compose down
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker-compose` not found | Make sure Docker Desktop is installed and running |
| Port 5173 or 8000 already in use | Run `docker-compose down` first, then retry |
| Frontend shows "Cannot connect to backend" | Wait 30 more seconds — backend may still be starting |
| Frontend can't reach backend | Run `docker ps` — both `waypoint-backend` and `waypoint-frontend` must show **Up** |
| API key error / 401 Unauthorized | Check `waypoint-backend/.env` — must be exactly `GROQ_API_KEY=gsk_...` with no quotes or spaces |
| Windows .env encoding error | Use the PowerShell `Out-File` command above — do NOT use `echo` on Windows |
| Build fails on first run | Docker is downloading base images — wait 5 mins and run `docker-compose up --build` again |
| `permission denied` on Mac/Linux | Run `chmod +x` on the relevant file or prefix with `sudo` |
| Pathway generation takes too long | Normal — Groq API call takes 5–15 seconds depending on load |

---

## Testing the API directly

Open http://localhost:8000/docs for interactive Swagger UI — all endpoints are documented and testable there.

Quick test via curl:
```bash
curl -X POST http://localhost:8000/pathway/text \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Python developer, 2 years. SQL, Git, basic Docker.",
    "target_role": "ML Engineer",
    "job_description": "ML Engineer\nRequires PyTorch, Feature Engineering, MLOps."
  }'
```

Expected response includes `modules[]` with `course_url` fields pointing to real Coursera courses.

---

## Tools used to build WayPoint

| Tool | Role |
|------|------|
| Groq API (Llama 3.3 70B) | Skill extraction, pathway generation, adaptive Q&A |
| NetworkX | Prerequisite DAG construction and traversal |
| FastAPI | Backend REST API |
| React 18 + Tailwind | Frontend UI |
| pdfplumber | PDF resume parsing |
| O*NET v28.2 | Skill taxonomy and role-skill mapping |
| Coursera Dataset 2021 (Kaggle) | 3,522 real course URLs |
| Docker + Compose | Containerisation and deployment |
| Claude (Anthropic) | AI pair programming assistant used throughout development |
