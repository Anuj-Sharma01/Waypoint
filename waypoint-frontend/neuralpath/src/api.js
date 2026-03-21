// ================================================================
// api.js — All backend API calls for Waypoint
// ================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Analyze resume + job description.
 * Calls POST /pathway/text and transforms response to frontend shape.
 */
export async function analyzeGap(resumeText, jobDescription) {
  // Extract target role from first line of job description
  const targetRole = extractRoleFromJD(jobDescription)

  const res = await fetch(`${BASE_URL}/pathway/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resume_text:     resumeText,
      target_role:     targetRole,
      job_description: jobDescription,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }

  const data = await res.json()

  // Transform backend response shape → frontend shape
  return {
    name:           'Candidate',
    targetRole:     data.target_role,
    currentSkills:  data.existing_skills || [],
    partialSkills:  data.partial_skills  || [],
    gapSkills:      data.skill_gaps      || [],
    totalHours:     data.total_hours,
    standardHours:  data.standard_hours,
    timeSavedPct:   data.time_saved_pct,
    reasoningTrace: data.reasoning_trace || [],
    pathway: (data.modules || []).map((m, i) => ({
      id:         i + 1,
      title:      m.title,
      module_id:  m.module_id,
      provider:   'Waypoint',
      duration:   `${m.hours}h`,
      prereqs:    [],
      reason:     m.why_included     || '',
      skipReason: m.skip_reason      || null,
      confidence: Math.max(0.75, 0.95 - i * 0.02),
      priority:   m.priority         || 'CORE GAP',
      savingsPct: m.estimated_savings_pct || 0,
      questions: [
        { q: `Do you already have hands-on experience with ${m.title}?`,      weight: 0.6 },
        { q: `Can you confidently explain the core concepts of ${m.title}?`,  weight: 0.4 },
      ],
    })),
  }
}

/**
 * Extract a role title from the job description text.
 * Uses the first short line that looks like a job title.
 */
function extractRoleFromJD(jdText) {
  if (!jdText || !jdText.trim()) return 'Software Engineer'

  const lines = jdText.trim().split('\n').filter(l => l.trim())

  for (const line of lines.slice(0, 5)) {
    const clean = line.trim()
    const lower = clean.toLowerCase()

    // Explicit label patterns
    if (lower.includes('role:') || lower.includes('position:') || lower.includes('title:')) {
      const after = clean.split(':')[1]?.trim()
      if (after) return after
    }

    // Short line with no punctuation = likely a job title
    if (clean.length < 60 && !clean.includes('.') && !clean.includes(',')) {
      return clean
    }
  }

  // Fallback: first line truncated
  return lines[0]?.trim().slice(0, 60) || 'Software Engineer'
}

/**
 * Get the full course catalog.
 */
export async function getCatalog(domain = null) {
  const url = domain
    ? `${BASE_URL}/catalog?domain=${domain}`
    : `${BASE_URL}/catalog`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/**
 * Health check — verify backend is reachable.
 */
export async function healthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}
