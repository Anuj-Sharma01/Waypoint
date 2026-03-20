from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import extract, pathway, catalog

app = FastAPI(
    title="Waypoint API",
    description="AI-Adaptive Onboarding Engine — skill gap analysis and personalized learning pathways",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract.router,  prefix="/extract",  tags=["Extract"])
app.include_router(pathway.router,  prefix="/pathway",  tags=["Pathway"])
app.include_router(catalog.router,  prefix="/catalog",  tags=["Catalog"])

@app.get("/health")
def health():
    return {"status": "ok", "app": "Waypoint"}
