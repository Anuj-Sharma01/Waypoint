// ================================================================
// api.js — All backend API calls for Waypoint
// ================================================================

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Analyze resume + job description.
 * Calls POST /pathway/text and transforms response to frontend shape.
 */
export async function analyzeGap(resumeText, jobDescription) {
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

  // Debug: log raw module to confirm course_url is coming from backend
  if (data.modules && data.modules.length > 0) {
    console.log('[DEBUG] First module from backend:', JSON.stringify(data.modules[0]))
  }

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
    pathway: (data.modules || []).map((m, i) => {
      const courseUrl      = m.course_url      || null
      const courseProvider = m.course_provider || 'Coursera'

      return {
        id:              i + 1,
        title:           m.title,
        module_id:       m.module_id,
        provider:        courseProvider,
        duration:        `${m.hours}h`,
        prereqs:         [],
        reason:          m.why_included          || '',
        skipReason:      m.skip_reason           || null,
        confidence:      Math.max(0.75, 0.95 - i * 0.02),
        priority:        m.priority              || 'CORE GAP',
        savingsPct:      m.estimated_savings_pct || 0,
        course_url:      courseUrl,
        course_provider: courseProvider,
        questions: [
          { q: `Do you already have hands-on experience with ${m.title}?`,     weight: 0.6 },
          { q: `Can you confidently explain the core concepts of ${m.title}?`, weight: 0.4 },
        ],
      }
    }),
  }
}

function extractRoleFromJD(jdText) {
  if (!jdText || !jdText.trim()) return 'Software Engineer'
  const lines = jdText.trim().split('\n').filter(l => l.trim())
  for (const line of lines.slice(0, 5)) {
    const clean = line.trim()
    const lower = clean.toLowerCase()
    if (lower.includes('role:') || lower.includes('position:') || lower.includes('title:')) {
      const after = clean.split(':')[1]?.trim()
      if (after) return after
    }
    if (clean.length < 60 && !clean.includes('.') && !clean.includes(',')) {
      return clean
    }
  }
  return lines[0]?.trim().slice(0, 60) || 'Software Engineer'
}

export async function getCatalog(domain = null) {
  const url = domain ? `${BASE_URL}/catalog?domain=${domain}` : `${BASE_URL}/catalog`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function healthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/health`)
    return res.ok
  } catch {
    return false
  }
}

export async function scoreResume(resumeText, jobDescription = '') {
  const res = await fetch(`${BASE_URL}/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generateNextAdaptiveQuestion({ skill, difficulty, history, questionNumber }) {
  try {
    const res = await fetch(`${BASE_URL}/skill-test/adaptive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill, difficulty, history, question_number: questionNumber }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return {
      text:        data.text || data.question,
      options:     data.options,
      correct:     data.correct,
      explanation: data.explanation,
      difficulty:  data.difficulty || difficulty,
    }
  } catch {
    return generateFallbackQuestion(skill, difficulty, questionNumber)
  }
}

function generateFallbackQuestion(skill, difficulty, questionNum) {
  const pools = {
    easy: [
      {
        text: `What is ${skill} primarily used for?`,
        options: [
          `Solving domain-specific problems using ${skill}`,
          'Replacing databases entirely',
          'Only for academic research',
          'Exclusively for large enterprises',
        ],
        correct: 0,
        explanation: `${skill} is designed to solve specific, well-defined problem types efficiently.`,
      },
      {
        text: `Which of these is a key characteristic of ${skill}?`,
        options: [
          'It requires no learning curve',
          'It has a structured, principled approach to problems',
          'It is always the fastest solution',
          'It only works on Windows',
        ],
        correct: 1,
        explanation: `A structured, principled approach is the hallmark of ${skill}.`,
      },
    ],
    medium: [
      {
        text: `When working with ${skill} in production, what is the most important consideration?`,
        options: [
          'Using the latest version regardless of stability',
          'Reliability, testing, and handling edge cases properly',
          'Avoiding all external dependencies',
          'Always rewriting from scratch',
        ],
        correct: 1,
        explanation: `Production ${skill} work demands reliability and proper edge case handling.`,
      },
      {
        text: `What differentiates an intermediate ${skill} practitioner from a beginner?`,
        options: [
          'Memorising more syntax',
          'Using more libraries',
          'Understanding trade-offs and knowing when NOT to use certain approaches',
          'Writing longer code',
        ],
        correct: 2,
        explanation: `Knowing trade-offs and limitations is the mark of intermediate mastery in ${skill}.`,
      },
    ],
    hard: [
      {
        text: `In a complex ${skill} implementation, how would you approach debugging a performance bottleneck?`,
        options: [
          'Rewrite everything from scratch',
          'Profile first to identify the actual bottleneck, then optimise only that',
          'Add more hardware immediately',
          'Disable all logging',
        ],
        correct: 1,
        explanation: 'Profile first — measure, identify the real bottleneck, then optimise with evidence.',
      },
      {
        text: `What is a common architectural mistake when scaling ${skill} solutions?`,
        options: [
          'Writing too many tests',
          'Using version control',
          'Tight coupling between components, making horizontal scaling impossible',
          'Documenting the codebase',
        ],
        correct: 2,
        explanation: 'Tight coupling is the #1 enemy of scalability.',
      },
    ],
    expert: [
      {
        text: `How would you design a fault-tolerant ${skill} system that handles partial failures gracefully?`,
        options: [
          'Hope the infrastructure never fails',
          'Implement circuit breakers, retries with backoff, and idempotent operations',
          'Use a single monolith to avoid distributed system issues',
          'Disable error handling to improve performance',
        ],
        correct: 1,
        explanation: 'Circuit breakers, exponential backoff, and idempotency are the three pillars of fault tolerance.',
      },
      {
        text: `When evaluating whether to adopt a new approach in ${skill}, what is the most rigorous method?`,
        options: [
          'Follow whatever is trending on social media',
          'Use it immediately in production',
          'Benchmark against current approach, define success criteria upfront, run controlled experiments',
          'Ask for the opinion of a single expert',
        ],
        correct: 2,
        explanation: 'Expert decision-making is evidence-based: define metrics first, benchmark both approaches.',
      },
    ],
  }

  const pool = pools[difficulty] || pools.medium
  const q    = pool[questionNum % pool.length]
  return { ...q, difficulty }
}
