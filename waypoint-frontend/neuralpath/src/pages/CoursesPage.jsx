import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, Search, Star, BookOpen } from 'lucide-react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const CATEGORIES = ['All', 'Python', 'Machine Learning', 'Data Science', 'Java', 'Docker', 'React', 'SQL', 'Leadership', 'DevOps']

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={11} className="text-amber-400 fill-amber-400" />
      <span className="text-xs font-mono text-dim">{rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
    </div>
  )
}

function CourseCard({ course }) {
  return (
    <a href={course.url} target="_blank" rel="noopener noreferrer"
      className="frosted rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:border-accent/40 border border-softborder flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-700 text-sm text-ink leading-snug group-hover:text-accentDark transition-colors line-clamp-2">
          {course.title}
        </h3>
        <ExternalLink size={14} className="text-muted group-hover:text-accentDark flex-shrink-0 mt-0.5 transition-colors" />
      </div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-mono text-muted">{course.university}</span>
        <StarRating rating={course.rating} />
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
          course.difficulty === 'Beginner'     ? 'bg-mintbg border-accent/30 text-accentDark' :
          course.difficulty === 'Intermediate' ? 'bg-panel2 border-sky/30 text-skyDark' :
          course.difficulty === 'Advanced'     ? 'bg-lavbg border-lavender/30 text-lavDark' :
          'bg-soft border-softborder text-muted'
        }`}>{course.difficulty}</span>
        <span className="text-xs font-mono text-accentDark">Coursera</span>
      </div>
      {course.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {course.skills.slice(0, 4).map(s => (
            <span key={s} className="text-xs font-mono px-1.5 py-0.5 bg-soft border border-softborder text-muted rounded">
              {s}
            </span>
          ))}
        </div>
      )}
    </a>
  )
}

export default function CoursesPage() {
  const [query, setQuery]     = useState('')
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [active, setActive]   = useState('All')

  const fetchCourses = useCallback(async (q) => {
    setLoading(true)
    try {
      const url = q
        ? `${BASE_URL}/courses?q=${encodeURIComponent(q)}&limit=24`
        : `${BASE_URL}/courses?limit=24`
      const res  = await fetch(url)
      const data = await res.json()
      setCourses(data)
    } catch {
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCourses('') }, [fetchCourses])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchCourses(active !== 'All' ? active : query)
    }, 300)
    return () => clearTimeout(t)
  }, [query, active, fetchCourses])

  const handleCategory = (cat) => {
    setActive(cat)
    setQuery('')
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-mintbg border border-accent/30 rounded-full mb-4">
          <BookOpen size={12} className="text-accentDark" />
          <span className="text-accentDark text-xs font-mono tracking-widest uppercase">Curated Course Library</span>
        </div>
        <h1 className="font-display text-4xl font-700 text-ink mb-2">
          Real Courses, <span className="text-gradient">Real Websites</span>
        </h1>
        <p className="text-dim text-base">
          3,522 courses from Coursera — every link goes directly to the course page.
          <span className="text-muted font-mono text-sm ml-2">Source: Kaggle Coursera Dataset 2021</span>
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setActive('All') }}
            placeholder="Search Spring Boot, PyTorch, Leadership..."
            className="w-full frosted rounded-xl pl-9 pr-4 py-3 text-sm text-ink placeholder:text-muted font-body focus:outline-none focus:border-accent/50 border border-softborder"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => handleCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
              active === cat
                ? 'bg-accentDark text-white border-accentDark'
                : 'border-softborder text-dim bg-white hover:border-accent/50'
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs font-mono text-muted mb-4">
        {loading ? 'Searching...' : `${courses.length} courses found`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="frosted rounded-xl p-5 h-40 animate-pulse bg-soft" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-mono text-sm">No courses found for "{query || active}"</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => <CourseCard key={i} course={c} />)}
        </div>
      )}

      <p className="text-center text-xs font-mono text-muted mt-8">
        All courses link directly to Coursera. Prices and free availability may change.
      </p>
    </div>
  )
}
