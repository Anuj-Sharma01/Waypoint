# WayPoint — Setup Guide

## Prerequisites
- Docker Desktop → https://www.docker.com/products/docker-desktop
- Git → https://git-scm.com

---

## Setup (3 steps)

### Step 1 — Clone the repo
```bash
git clone https://github.com/Anuj-Sharma01/Waypoint.git
cd Waypoint
```

### Step 2 — Add the API key
```bash
# Windows PowerShell
"GROQ_API_KEY=gsk_YOUR_JUDGES_KEY_HERE" | Out-File -FilePath waypoint-backend/.env -Encoding utf8 -NoNewline

# Mac/Linux
echo "GROQ_API_KEY=gsk_YOUR_JUDGES_KEY_HERE" > waypoint-backend/.env
```

> **Note for judges:** A working Groq API key has been provided separately.
> Groq is free — get your own at https://console.groq.com if needed.

### Step 3 — Run everything
```bash
docker-compose up --build
```

Wait 2–3 minutes for first build. Then open:
- **App** → http://localhost:5173
- **API Docs (Swagger)** → http://localhost:8000/docs

## That's it! 🚀

---

## What's included

| Component | Details |
|-----------|---------|
| Frontend | React 18 + Tailwind, port 5173 |
| Backend | FastAPI + Uvicorn, port 8000 |
| LLM | Groq Llama 3.3 70B (requires API key) |
| Course data | Coursera Dataset 2021 — 3,522 real courses (bundled, no download needed) |

---

## Stopping the app
```bash
docker-compose down
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port already in use | Run `docker-compose down` first |
| Frontend can't reach backend | Run `docker ps` — both containers must show "healthy" |
| API key error | Check `waypoint-backend/.env` — must be `GROQ_API_KEY=gsk_...` with no quotes |
| Windows .env encoding error | Use the PowerShell `Out-File` command above, not `echo` |
| Build fails on first run | Docker is pulling base images — wait 5 mins and retry |

---

## Testing the API directly

Once running, open http://localhost:8000/docs for interactive Swagger UI.

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
