from fastapi import APIRouter, Query
from typing import List, Optional
from app.models import CatalogModule
from app.services.graph_service import CATALOG

router = APIRouter()


@router.get("", response_model=List[CatalogModule], summary="Get full course catalog")
def get_catalog(
    domain: Optional[str] = Query(None, description="Filter by domain: tech | operational | business"),
    tag: Optional[str]    = Query(None, description="Filter by tag e.g. 'python', 'docker'"),
):
    """
    Returns the full course catalog. Used by the frontend to validate
    that all recommended modules are grounded to real content.

    Optional filters:
    - domain: 'tech', 'operational', or 'business'
    - tag: any tag string (case-insensitive partial match)
    """
    results = CATALOG

    if domain:
        results = [m for m in results if m["domain"].lower() == domain.lower()]

    if tag:
        tag_lower = tag.lower()
        results   = [m for m in results if any(tag_lower in t.lower() for t in m["tags"])]

    return results


@router.get("/{module_id}", response_model=CatalogModule, summary="Get a single module by ID")
def get_module(module_id: str):
    from fastapi import HTTPException
    from app.services.graph_service import CATALOG_BY_ID
    module = CATALOG_BY_ID.get(module_id)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found in catalog.")
    return module
