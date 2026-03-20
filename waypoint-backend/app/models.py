from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class ProficiencyLevel(str, Enum):
    NONE      = "none"
    PARTIAL   = "partial"
    PROFICIENT = "proficient"


class ExtractedSkill(BaseModel):
    name: str                               = Field(..., description="Canonical skill name")
    proficiency: ProficiencyLevel           = Field(..., description="Detected proficiency level")
    confidence: float                       = Field(..., ge=0.0, le=1.0, description="Extraction confidence 0–1")
    evidence: str                           = Field(..., description="Quote or context from resume that supports this skill")


class ExtractRequest(BaseModel):
    resume_text: str                        = Field(..., description="Plain text of the candidate's resume")
    target_role: str                        = Field(..., description="Target job title e.g. 'ML Engineer'")


class ExtractResponse(BaseModel):
    skills: List[ExtractedSkill]
    target_role: str
    reasoning_trace: List[str]              = Field(..., description="Step-by-step extraction reasoning")


# ── Pathway ──────────────────────────────────────────────────────────────────

class PathwayModule(BaseModel):
    module_id: str
    title: str
    hours: int
    priority: str                           = Field(..., description="PREREQUISITE | CORE GAP | ADVANCED | PRODUCTION | CAPSTONE")
    skip_reason: Optional[str]              = Field(None, description="Why parts of this module are skipped (existing skill)")
    why_included: str                       = Field(..., description="Graph traversal reason for including this module")
    estimated_savings_pct: int              = Field(..., description="% time saved vs standard track due to existing skills")


class PathwayRequest(BaseModel):
    resume_text: str
    target_role: str


class PathwayResponse(BaseModel):
    target_role: str
    modules: List[PathwayModule]
    total_hours: int
    standard_hours: int
    time_saved_pct: int
    skill_gaps: List[str]
    existing_skills: List[str]
    partial_skills: List[str]
    reasoning_trace: List[str]


# ── Catalog ───────────────────────────────────────────────────────────────────

class CatalogModule(BaseModel):
    id: str
    title: str
    domain: str
    hours: int
    description: str
    prerequisites: List[str]
    tags: List[str]
