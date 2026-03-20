# Waypoint — Complete Setup Guide

## Prerequisites
- Docker Desktop installed → https://www.docker.com/products/docker-desktop
- Git installed → https://git-scm.com

## Setup (3 steps)

### Step 1 — Clone the repo
```bash
git clone https://github.com/Anuj-Sharma01/Waypoint.git
cd Waypoint
```

### Step 2 — Add the API key
```bash
# Windows PowerShell
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > waypoint-backend/.env

# Mac/Linux
echo "GROQ_API_KEY=gsk_YOUR_KEY_HERE" > waypoint-backend/.env
```

### Step 3 — Run everything
```bash
docker-compose up --build
```
Wait 2-3 minutes for first build. Then open:
- **App** → http://localhost:5173
- **API Docs** → http://localhost:8000/docs

## That's it! 🚀

## Stopping the app
```bash
docker-compose down
```

## Troubleshooting
| Problem | Fix |
|---------|-----|
| Port already in use | Run `docker-compose down` first |
| Frontend can't reach backend | Make sure both containers are running: `docker ps` |
| API key error | Check `waypoint-backend/.env` has the correct key |
