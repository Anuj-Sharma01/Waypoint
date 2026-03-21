import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'

const QUESTIONS = [
  {
    id: 1,
    q: 'What best describes your current experience level?',
    options: [
      { label: 'Complete beginner — never worked in tech/data', value: 'beginner' },
      { label: 'Some exposure — done courses but no job experience', value: 'learner' },
      { label: 'Junior — less than 2 years professional experience', value: 'junior' },
      { label: 'Mid-level — 2–5 years experience', value: 'mid' },
      { label: 'Senior — 5+ years experience', value: 'senior' },
    ],
  },
  {
    id: 2,
    q: 'What is your target role?',
    options: [
      { label: 'ML / AI Engineer', value: 'ml' },
      { label: 'Data Scientist', value: 'ds' },
      { label: 'Data Analyst', value: 'da' },
      { label: 'DevOps / Cloud Engineer', value: 'devops' },
      { label: 'Operations / Logistics Lead', value: 'ops' },
    ],
  },
  {
    id: 3,
    q: 'How much time can you dedicate to learning per week?',
    options: [
      { label: 'Less than 2 hours', value: 'minimal' },
      { label: '2–5 hours', value: 'light' },
      { label: '5–10 hours', value: 'moderate' },
      { label: '10–20 hours', value: 'intensive' },
      { label: '20+ hours (full-time)', value: 'fulltime' },
    ],
  },
  {
    id: 4,
    q: 'Which of these do you already know? (pick the highest)',
    options: [
      { label: 'Nothing yet — starting from zero', value: 'zero' },
      { label: 'Basic Python or spreadsheets', value: 'basic' },
      { label: 'Python + SQL confidently', value: 'intermediate' },
      { label: 'Python + ML libraries (pandas, sklearn)', value: 'advanced' },
      { label: 'Full ML pipeline end-to-end', value: 'expert' },
    ],
  },
  {
    id: 5,
    q: 'What is your main goal?',
    options: [
      { label: 'Get my first job in tech', value: 'firstjob' },
      { label: 'Switch careers from another field', value: 'switch' },
      { label: 'Get promoted at my current company', value: 'promote' },
      { label: 'Upskill for a specific project', value: 'project' },
      { label: 'Just curious / exploring', value: 'explore' },
    ],
  },
]

// Map quiz answers to a beginner-friendly full pathway
function buildBeginnerPathway(answers) {
  const role = answers[1]
  const level = answers[0]
  const isFullBeginner = level === 'beginner' || answers[3] === 'zero'

  const pathways = {
    ml: [
      { id:1, title:'Python Crash Course', provider:'freeCodeCamp', duration:'10h', prereqs:[], reason:'Absolute first step — Python is the language of ML.', confidence:0.98, questions:[{q:'Can you write a Python for loop and function from memory?',weight:0.5},{q:'Have you used Python for any project before?',weight:0.5}] },
      { id:2, title:'Math for ML (Linear Algebra + Stats)', provider:'Khan Academy', duration:'12h', prereqs:['Python Crash Course'], reason:'Matrices and probability are the foundation of every ML algorithm.', confidence:0.95, questions:[{q:'Do you understand matrix multiplication?',weight:0.5},{q:'Can you explain mean, variance, and normal distribution?',weight:0.5}] },
      { id:3, title:'SQL for Data Science', provider:'Mode Analytics', duration:'6h', prereqs:['Python Crash Course'], reason:'Data lives in databases — you need SQL to access it.', confidence:0.93, questions:[{q:'Can you write a JOIN query with GROUP BY?',weight:0.6},{q:'Do you know window functions?',weight:0.4}] },
      { id:4, title:'Pandas & NumPy Fundamentals', provider:'Kaggle', duration:'8h', prereqs:['Python Crash Course'], reason:'Core data manipulation tools used in every ML project.', confidence:0.92, questions:[{q:'Can you load, clean, and reshape a DataFrame?',weight:0.6},{q:'Do you understand vectorized NumPy operations?',weight:0.4}] },
      { id:5, title:'Machine Learning Foundations', provider:'fast.ai', duration:'15h', prereqs:['Math for ML (Linear Algebra + Stats)', 'Pandas & NumPy Fundamentals'], reason:'First real ML — supervised learning, model evaluation, cross-validation.', confidence:0.90, questions:[{q:'Can you explain bias-variance tradeoff?',weight:0.5},{q:'Have you trained a model with sklearn?',weight:0.5}] },
      { id:6, title:'PyTorch Fundamentals', provider:'Fast.ai', duration:'12h', prereqs:['Machine Learning Foundations'], reason:'Deep learning framework — required for modern ML engineering.', confidence:0.88, questions:[{q:'Have you built a neural network in PyTorch?',weight:0.6},{q:'Do you understand autograd?',weight:0.4}] },
      { id:7, title:'MLOps & Deployment', provider:'DataTalks.Club', duration:'20h', prereqs:['PyTorch Fundamentals'], reason:'Final step — get models into production.', confidence:0.85, questions:[{q:'Have you deployed an ML model to an API?',weight:0.6},{q:'Do you know what MLflow does?',weight:0.4}] },
    ],
    ds: [
      { id:1, title:'Python Crash Course', provider:'freeCodeCamp', duration:'10h', prereqs:[], reason:'Python is the primary language for data science.', confidence:0.98, questions:[{q:'Can you write Python functions and loops confidently?',weight:0.6},{q:'Have you used Python in any project?',weight:0.4}] },
      { id:2, title:'SQL Fundamentals', provider:'Mode Analytics', duration:'6h', prereqs:[], reason:'Data science starts with pulling data — SQL is essential.', confidence:0.96, questions:[{q:'Can you write multi-table JOINs?',weight:0.6},{q:'Do you know GROUP BY and HAVING?',weight:0.4}] },
      { id:3, title:'Statistics for Data Science', provider:'Khan Academy', duration:'10h', prereqs:['Python Crash Course'], reason:'Hypothesis testing and distributions are core to every analysis.', confidence:0.94, questions:[{q:'Can you explain p-values and confidence intervals?',weight:0.5},{q:'Do you know when to use t-test vs chi-squared?',weight:0.5}] },
      { id:4, title:'Pandas & Visualization', provider:'Kaggle', duration:'8h', prereqs:['Python Crash Course'], reason:'Data wrangling and visual storytelling are daily data science tools.', confidence:0.92, questions:[{q:'Can you create charts with matplotlib or seaborn?',weight:0.5},{q:'Can you clean messy data with Pandas?',weight:0.5}] },
      { id:5, title:'Machine Learning with Scikit-learn', provider:'DataCamp', duration:'12h', prereqs:['Statistics for Data Science','Pandas & Visualization'], reason:'Core ML toolkit for data scientists.', confidence:0.89, questions:[{q:'Have you built a full sklearn pipeline?',weight:0.6},{q:'Do you know cross-validation and GridSearch?',weight:0.4}] },
    ],
    devops: [
      { id:1, title:'Linux Command Line Basics', provider:'The Odin Project', duration:'8h', prereqs:[], reason:'Everything in DevOps runs on Linux.', confidence:0.97, questions:[{q:'Are you comfortable with bash, file permissions, and processes?',weight:0.6},{q:'Can you write a basic shell script?',weight:0.4}] },
      { id:2, title:'Networking Fundamentals', provider:'Professor Messer', duration:'8h', prereqs:[], reason:'DNS, TCP/IP, and ports are the foundation of all infrastructure.', confidence:0.95, questions:[{q:'Can you explain how DNS resolution works?',weight:0.5},{q:'Do you understand TCP vs UDP?',weight:0.5}] },
      { id:3, title:'Docker Deep Dive', provider:'Nigel Poulton', duration:'8h', prereqs:['Linux Command Line Basics'], reason:'Containers are the atomic unit of modern infrastructure.', confidence:0.93, questions:[{q:'Have you built and pushed a multi-stage Docker image?',weight:0.6},{q:'Do you understand Docker networking?',weight:0.4}] },
      { id:4, title:'Kubernetes for Beginners', provider:'KodeKloud', duration:'14h', prereqs:['Docker Deep Dive'], reason:'Orchestration at scale — the most in-demand DevOps skill.', confidence:0.90, questions:[{q:'Can you write a Kubernetes Deployment manifest?',weight:0.5},{q:'Do you understand Pods and Services?',weight:0.5}] },
      { id:5, title:'CI/CD with GitHub Actions', provider:'GitHub', duration:'6h', prereqs:['Docker Deep Dive'], reason:'Automation is the core of DevOps philosophy.', confidence:0.88, questions:[{q:'Have you written a GitHub Actions workflow?',weight:0.6},{q:'Can you implement a deploy-on-merge strategy?',weight:0.4}] },
    ],
    ops: [
      { id:1, title:'Operations Management Basics', provider:'Coursera', duration:'6h', prereqs:[], reason:'Framework for thinking about processes, flow, and efficiency.', confidence:0.96, questions:[{q:'Can you draw a value stream map for a process?',weight:0.5},{q:'Do you know what OEE means?',weight:0.5}] },
      { id:2, title:'Excel for Operations', provider:'LinkedIn Learning', duration:'4h', prereqs:[], reason:'Spreadsheets are the universal ops tool — master them first.', confidence:0.95, questions:[{q:'Can you build pivot tables and dynamic charts?',weight:0.5},{q:'Are you comfortable with VLOOKUP and SUMIFS?',weight:0.5}] },
      { id:3, title:'Lean Six Sigma Yellow Belt', provider:'IASSC', duration:'8h', prereqs:['Operations Management Basics'], reason:'The global standard for process improvement.', confidence:0.92, questions:[{q:'Can you name the 8 wastes of lean?',weight:0.5},{q:'Have you run a kaizen event?',weight:0.5}] },
      { id:4, title:'WMS & ERP Fundamentals', provider:'SAP Learning', duration:'8h', prereqs:['Excel for Operations'], reason:'Software systems that run modern warehouses and supply chains.', confidence:0.89, questions:[{q:'Have you used a WMS like SAP or Manhattan?',weight:0.6},{q:'Can you configure put-away strategies?',weight:0.4}] },
      { id:5, title:'KPI Design & Data-Driven Ops', provider:'Coursera', duration:'6h', prereqs:['Excel for Operations','Lean Six Sigma Yellow Belt'], reason:'Combines lean principles with data to drive decisions.', confidence:0.86, questions:[{q:'Have you designed KPIs for a team?',weight:0.6},{q:'Do you know leading vs lagging indicators?',weight:0.4}] },
    ],
    da: [
      { id:1, title:'Excel Mastery', provider:'ExcelJet', duration:'6h', prereqs:[], reason:'The universal starting point for data analysts.', confidence:0.97, questions:[{q:'Are you fluent with pivot tables, VLOOKUP, and dynamic charts?',weight:0.6},{q:'Have you used Power Query?',weight:0.4}] },
      { id:2, title:'SQL Fundamentals', provider:'Mode Analytics', duration:'6h', prereqs:[], reason:'SQL is the #1 skill listed on data analyst job postings.', confidence:0.96, questions:[{q:'Can you write complex JOINs and subqueries?',weight:0.6},{q:'Do you know window functions?',weight:0.4}] },
      { id:3, title:'Python for Data Analysis', provider:'Kaggle', duration:'10h', prereqs:['SQL Fundamentals'], reason:'Automates what Excel cannot — scales to millions of rows.', confidence:0.93, questions:[{q:'Can you use Pandas to clean and reshape data?',weight:0.6},{q:'Have you built charts with matplotlib?',weight:0.4}] },
      { id:4, title:'Data Visualization with Tableau', provider:'Tableau Public', duration:'8h', prereqs:['Excel Mastery'], reason:'The most-used BI tool in business analytics roles.', confidence:0.91, questions:[{q:'Have you built an interactive Tableau dashboard?',weight:0.6},{q:'Do you know calculated fields and LOD expressions?',weight:0.4}] },
      { id:5, title:'Statistics for Analysts', provider:'Khan Academy', duration:'8h', prereqs:['Python for Data Analysis'], reason:'A/B testing and significance testing are core analyst skills.', confidence:0.88, questions:[{q:'Can you run and interpret an A/B test?',weight:0.5},{q:'Do you understand regression analysis?',weight:0.5}] },
    ],
  }

  const roleKey = role || 'ml'
  const path = pathways[roleKey] || pathways['ml']

  return {
    name: 'You',
    targetRole: { ml:'ML Engineer', ds:'Data Scientist', devops:'DevOps Engineer', ops:'Operations Lead', da:'Data Analyst' }[roleKey] || 'ML Engineer',
    isBeginnerPath: isFullBeginner,
    currentSkills: isFullBeginner ? ['Motivation', 'Growth Mindset'] : ['Some Python', 'Basic Concepts'],
    gapSkills: path.map(m => m.title),
    pathway: path,
  }
}

export default function OnboardingQuiz() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const q = QUESTIONS[current]
  const selected = answers[q.id]
  const progress = ((current) / QUESTIONS.length) * 100

  const handleSelect = (val) => setAnswers(prev => ({ ...prev, [q.id]: val }))

  const handleNext = () => {
    if (!selected) return
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    } else {
      setDone(true)
      setTimeout(() => {
        const result = buildBeginnerPathway(answers)
        navigate('/pathway', { state: { result } })
      }, 1200)
    }
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#34d399,#38bdf8,#a78bfa)' }}>
          <CheckCircle2 size={28} className="text-white" />
        </div>
        <h2 className="font-display text-2xl font-700 text-ink mb-2">Building your pathway...</h2>
        <p className="text-dim text-sm">Personalizing based on your answers</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-xl">

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-mono text-muted mb-2">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% done</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden border border-softborder">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#34d399,#38bdf8,#a78bfa)' }} />
          </div>
        </div>

        {/* Question card */}
        <div className="frosted rounded-2xl p-8 shadow-lg mb-4">
          <h2 className="font-display text-2xl font-700 text-ink mb-6">{q.q}</h2>

          <div className="space-y-3">
            {q.options.map(opt => (
              <button key={opt.value} onClick={() => handleSelect(opt.value)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all font-body text-sm ${
                  selected === opt.value
                    ? 'border-accent/60 bg-mintbg text-accentDark font-700 shadow-sm'
                    : 'border-softborder bg-white/60 text-dim hover:border-accent/30 hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected === opt.value ? 'border-accent bg-accent' : 'border-softborder'}`}>
                    {selected === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  {opt.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {current > 0 && (
            <button onClick={() => setCurrent(c => c - 1)}
              className="flex items-center gap-2 px-5 py-3 frosted rounded-xl border border-softborder text-dim hover:text-ink text-sm font-mono transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>
          )}
          <button onClick={handleNext} disabled={!selected}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-white font-display font-700 text-base rounded-xl transition-all disabled:opacity-40 shadow-lg"
            style={{ background: selected ? 'linear-gradient(135deg,#34d399,#38bdf8,#a78bfa)' : '#ccc' }}
          >
            {current === QUESTIONS.length - 1 ? 'Generate My Pathway' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
