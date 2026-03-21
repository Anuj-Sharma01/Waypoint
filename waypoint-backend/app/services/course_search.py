"""
course_search.py — Dataset-driven course finder using Coursera Courses Dataset 2021
Source: https://www.kaggle.com/datasets/khusheekapoor/coursera-courses-dataset-2021
3,522 real courses — zero hallucination possible, every URL is a real Coursera link.
"""

import csv
import os
import re
import json
from typing import Optional, Dict, List
from functools import lru_cache

_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "Coursera.csv")

# ── Load and index at import time ─────────────────────────────────────────────
_COURSES: List[Dict] = []
_LOADED = False

def _load():
    global _COURSES, _LOADED
    if _LOADED:
        return
    try:
        with open(_CSV_PATH, encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row in reader:
                skills_raw = row.get('Skills', '')
                skill_tokens = [
                    s.strip().lower()
                    for s in re.split(r'\s{2,}', skills_raw)
                    if s.strip() and len(s.strip()) > 2
                ]
                try:
                    rating = float(row['Course Rating'])
                except Exception:
                    rating = 3.0

                _COURSES.append({
                    'title':       row['Course Name'].strip(),
                    'university':  row['University'].strip(),
                    'difficulty':  row['Difficulty Level'].strip(),
                    'rating':      rating,
                    'url':         row['Course URL'].strip(),
                    'skills':      skill_tokens[:20],
                    'title_lower': row['Course Name'].lower(),
                    'desc_lower':  row.get('Course Description', '').lower()[:500],
                })
        _LOADED = True
        print(f"[COURSERA] Loaded {len(_COURSES)} courses from dataset")
    except FileNotFoundError:
        print(f"[COURSERA] WARNING: Coursera.csv not found at {_CSV_PATH}. Course links will use fallback.")
        _LOADED = True


def find_course(skill: str) -> Dict:
    """
    Find the best matching Coursera course for a given skill.
    Returns { title, university, difficulty, rating, url, provider }
    Every result is a real Coursera URL — zero hallucination.
    """
    _load()

    if not _COURSES:
        return _fallback(skill)

    q       = skill.lower().strip()
    q_words = set(q.split())

    best_score = 0.0
    best_idx   = -1

    for i, c in enumerate(_COURSES):
        score = 0.0

        # Exact skill list match (highest weight)
        for s in c['skills']:
            if q == s:
                score += 10.0
            elif q in s or s in q:
                score += 5.0
            else:
                overlap = len(q_words & set(s.split()))
                score  += overlap * 2.0

        # Title match
        if q in c['title_lower']:
            score += 4.0
        else:
            score += len(q_words & set(c['title_lower'].split())) * 1.5

        # Description match
        if q in c['desc_lower']:
            score += 1.0

        # Boost by rating
        score *= (c['rating'] / 5.0) if c['rating'] > 0 else 0.5

        if score > best_score:
            best_score = score
            best_idx   = i

    if best_idx == -1 or best_score < 1.0:
        return _fallback(skill)

    c = _COURSES[best_idx]
    return {
        'title':      c['title'],
        'university': c['university'],
        'difficulty': c['difficulty'],
        'rating':     c['rating'],
        'url':        c['url'],
        'provider':   'Coursera',
    }


def find_courses_for_module(module_id: str, module_title: str, tags: List[str] = None) -> Dict:
    """
    Find best course for a pathway module.
    Tries module_id first, then title, then each tag.
    """
    _load()

    # Try module title first (most specific)
    result = find_course(module_title)
    if result.get('url', '').startswith('https://www.coursera.org/learn/'):
        return result

    # Try each tag
    for tag in (tags or []):
        result = find_course(tag)
        if result.get('url', '').startswith('https://www.coursera.org/learn/'):
            return result

    return _fallback(module_title)


def _fallback(skill: str) -> Dict:
    """Fallback: Coursera search URL — still a real, working URL."""
    query = skill.replace(' ', '+')
    return {
        'title':      f'{skill.title()} courses on Coursera',
        'university': 'Various',
        'difficulty': 'Mixed',
        'rating':     0.0,
        'url':        f'https://www.coursera.org/search?query={query}',
        'provider':   'Coursera',
    }


def get_catalog_stats() -> Dict:
    """Return stats about the loaded catalog."""
    _load()
    return {
        'total_courses': len(_COURSES),
        'source':        'Coursera Courses Dataset 2021 (Kaggle)',
        'loaded':        _LOADED,
    }
