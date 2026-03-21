from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models import PathwayResponse
from app.services.claude_service import extract_skills_from_resume, get_role_skills
from app.services.graph_service import compute_pathway
from app.services.pdf_service import extract_text_from_upload

router = APIRouter()


@router.post("", response_model=PathwayResponse, summary="Generate adaptive learning pathway")
async def generate_pathway(
    file: UploadFile  = File(...),
    target_role: str  = Form(...),
    job_description: str = Form(""),   # optional full JD text
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    resume_text = await extract_text_from_upload(file)
    if len(resume_text.strip()) < 50:
        raise HTTPException(status_code=422, detail="Resume text too short.")

    skills, extract_trace   = extract_skills_from_resume(resume_text, target_role)
    required_skills         = get_role_skills(target_role, job_description)  # dynamic!
    modules, path_trace, total_hours, standard_hours, time_saved_pct = compute_pathway(
        skills=skills, target_role=target_role, required_skills=required_skills,
    )

    full_trace = extract_trace + path_trace
    proficient = [s.name for s in skills if s.proficiency == "proficient"]
    partial    = [s.name for s in skills if s.proficiency == "partial"]
    gaps       = [r for r in required_skills if r.lower() not in {s.name.lower() for s in skills}]

    return PathwayResponse(
        target_role=target_role, modules=modules,
        total_hours=total_hours, standard_hours=standard_hours,
        time_saved_pct=time_saved_pct, skill_gaps=gaps,
        existing_skills=proficient, partial_skills=partial,
        reasoning_trace=full_trace,
    )


@router.post("/text", response_model=PathwayResponse, summary="Generate pathway from plain text")
async def generate_pathway_from_text(body: dict):
    resume_text      = body.get("resume_text", "").strip()
    target_role      = body.get("target_role", "").strip()
    job_description  = body.get("job_description", "").strip()  # optional

    if not resume_text: raise HTTPException(status_code=400, detail="resume_text is required.")
    if not target_role: raise HTTPException(status_code=400, detail="target_role is required.")

    skills, extract_trace   = extract_skills_from_resume(resume_text, target_role)
    required_skills         = get_role_skills(target_role, job_description)  # dynamic!
    modules, path_trace, total_hours, standard_hours, time_saved_pct = compute_pathway(
        skills=skills, target_role=target_role, required_skills=required_skills,
    )

    full_trace = extract_trace + path_trace
    proficient = [s.name for s in skills if s.proficiency == "proficient"]
    partial    = [s.name for s in skills if s.proficiency == "partial"]
    gaps       = [r for r in required_skills if r.lower() not in {s.name.lower() for s in skills}]

    return PathwayResponse(
        target_role=target_role, modules=modules,
        total_hours=total_hours, standard_hours=standard_hours,
        time_saved_pct=time_saved_pct, skill_gaps=gaps,
        existing_skills=proficient, partial_skills=partial,
        reasoning_trace=full_trace,
    )
