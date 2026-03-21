import { useNavigate } from 'react-router-dom'
import { ArrowRight, Code2, BarChart3, Server, Warehouse } from 'lucide-react'

const DEMO_PROFILES = [
  {
    icon: Code2,
    label: 'ML Engineer',
    color: 'accent',
    colorClass: 'text-accent',
    borderClass: 'border-accent/20',
    bgClass: 'bg-accent/10',
    from: 'Data Analyst with Python + SQL',
    gap: ['PyTorch', 'MLOps', 'Docker', 'LLM Fine-tuning'],
    modules: 4,
    hours: '46h',
    result: {
      name: 'Demo User',
      targetRole: 'ML Engineer',
      currentSkills: ['Python', 'SQL', 'Data Analysis', 'Statistics'],
      gapSkills: ['PyTorch', 'MLOps', 'Docker', 'LLM Fine-tuning'],
      pathway: [
        {
          id: 1, title: 'PyTorch Fundamentals', provider: 'Fast.ai', duration: '12h', prereqs: [],
          reason: 'Foundational tensor ops unlock all downstream MLOps tooling.', confidence: 0.94,
          questions: [
            { q: 'Have you built a neural network from scratch in PyTorch?', weight: 0.6 },
            { q: 'Do you understand autograd and backpropagation in code?', weight: 0.4 },
          ],
        },
        {
          id: 2, title: 'Feature Engineering Masterclass', provider: 'Kaggle', duration: '6h', prereqs: ['PyTorch Fundamentals'],
          reason: 'Bridges existing Statistics skill to model-ready inputs.', confidence: 0.91,
          questions: [
            { q: 'Can you explain target encoding and when to use it?', weight: 0.5 },
            { q: 'Have you handled missing data strategies in a real project?', weight: 0.5 },
          ],
        },
        {
          id: 3, title: 'Docker for Data Scientists', provider: 'DataCamp', duration: '8h', prereqs: ['PyTorch Fundamentals'],
          reason: 'Prerequisite for all MLOps pipeline construction.', confidence: 0.89,
          questions: [
            { q: 'Have you written a Dockerfile for a Python ML project?', weight: 0.6 },
            { q: 'Do you know how volumes and networks work in Docker Compose?', weight: 0.4 },
          ],
        },
        {
          id: 4, title: 'MLOps Zoomcamp', provider: 'DataTalks.Club', duration: '20h', prereqs: ['Docker for Data Scientists', 'Feature Engineering Masterclass'],
          reason: 'Combines all prior skills into a production deployment workflow.', confidence: 0.87,
          questions: [
            { q: 'Have you set up an experiment tracking system like MLflow?', weight: 0.5 },
            { q: 'Can you explain model versioning and deployment pipelines?', weight: 0.5 },
          ],
        },
      ],
    },
  },
  {
    icon: BarChart3,
    label: 'Data Scientist',
    color: 'gold',
    colorClass: 'text-yellow-400',
    borderClass: 'border-yellow-400/20',
    bgClass: 'bg-yellow-400/10',
    from: 'Business Analyst with Excel + BI tools',
    gap: ['Python', 'Machine Learning', 'SQL', 'Pandas'],
    modules: 5,
    hours: '38h',
    result: {
      name: 'Demo User',
      targetRole: 'Data Scientist',
      currentSkills: ['Excel', 'Power BI', 'Business Analysis', 'Statistics'],
      gapSkills: ['Python', 'SQL', 'Pandas', 'Machine Learning', 'Scikit-learn'],
      pathway: [
        {
          id: 1, title: 'Python for Everybody', provider: 'Coursera', duration: '10h', prereqs: [],
          reason: 'Zero-prerequisite entry point; unlocks all data tooling.', confidence: 0.97,
          questions: [
            { q: 'Can you write a Python function with error handling from memory?', weight: 0.6 },
            { q: 'Are you comfortable with list comprehensions and dictionaries?', weight: 0.4 },
          ],
        },
        {
          id: 2, title: 'SQL Fundamentals', provider: 'Mode Analytics', duration: '6h', prereqs: [],
          reason: 'Parallel to Python — no dependency, start concurrently.', confidence: 0.95,
          questions: [
            { q: 'Can you write a multi-table JOIN with GROUP BY and HAVING?', weight: 0.6 },
            { q: 'Do you know how window functions like ROW_NUMBER work?', weight: 0.4 },
          ],
        },
        {
          id: 3, title: 'Pandas & NumPy Crash Course', provider: 'Kaggle', duration: '4h', prereqs: ['Python for Everybody'],
          reason: 'Direct bridge from Python to data manipulation.', confidence: 0.92,
          questions: [
            { q: 'Can you reshape a DataFrame and handle missing values in Pandas?', weight: 0.5 },
            { q: 'Do you understand vectorized operations in NumPy?', weight: 0.5 },
          ],
        },
        {
          id: 4, title: 'ML Foundations', provider: 'fast.ai', duration: '10h', prereqs: ['Pandas & NumPy Crash Course'],
          reason: 'Existing statistics knowledge compresses this module by ~40%.', confidence: 0.90,
          questions: [
            { q: 'Can you explain bias-variance tradeoff with an example?', weight: 0.5 },
            { q: 'Do you know when to use regression vs classification models?', weight: 0.5 },
          ],
        },
        {
          id: 5, title: 'Applied Scikit-learn', provider: 'DataCamp', duration: '8h', prereqs: ['ML Foundations'],
          reason: 'Final bridge from theory to production-ready models.', confidence: 0.88,
          questions: [
            { q: 'Have you built a full sklearn pipeline with cross-validation?', weight: 0.6 },
            { q: 'Do you know how to tune hyperparameters with GridSearchCV?', weight: 0.4 },
          ],
        },
      ],
    },
  },
  {
    icon: Server,
    label: 'DevOps Engineer',
    color: 'purple-400',
    colorClass: 'text-purple-400',
    borderClass: 'border-purple-400/20',
    bgClass: 'bg-purple-400/10',
    from: 'Linux SysAdmin',
    gap: ['Kubernetes', 'Terraform', 'CI/CD', 'Monitoring'],
    modules: 4,
    hours: '32h',
    result: {
      name: 'Demo User',
      targetRole: 'DevOps Engineer',
      currentSkills: ['Linux', 'Bash', 'Networking', 'On-prem Infrastructure'],
      gapSkills: ['Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines'],
      pathway: [
        {
          id: 1, title: 'Docker Deep Dive', provider: 'Nigel Poulton', duration: '8h', prereqs: [],
          reason: 'Existing Linux knowledge skips shell basics — jump to containers.', confidence: 0.96,
          questions: [
            { q: 'Have you built and pushed a multi-stage Docker image?', weight: 0.6 },
            { q: 'Can you explain how Docker networking and bridge networks work?', weight: 0.4 },
          ],
        },
        {
          id: 2, title: 'Kubernetes for Admins', provider: 'KodeKloud', duration: '12h', prereqs: ['Docker Deep Dive'],
          reason: 'SysAdmin background unlocks advanced networking modules immediately.', confidence: 0.93,
          questions: [
            { q: 'Can you write a Kubernetes Deployment and Service manifest?', weight: 0.5 },
            { q: 'Do you understand Pods, ReplicaSets, and Deployments?', weight: 0.5 },
          ],
        },
        {
          id: 3, title: 'Terraform: Zero to Hero', provider: 'Udemy', duration: '6h', prereqs: [],
          reason: 'Infrastructure mindset from SysAdmin role accelerates IaC comprehension.', confidence: 0.91,
          questions: [
            { q: 'Have you written Terraform modules with variables and outputs?', weight: 0.6 },
            { q: 'Do you understand Terraform state and remote backends?', weight: 0.4 },
          ],
        },
        {
          id: 4, title: 'CI/CD with GitHub Actions', provider: 'GitHub', duration: '6h', prereqs: ['Docker Deep Dive'],
          reason: 'Final missing link to complete DevOps pipeline ownership.', confidence: 0.89,
          questions: [
            { q: 'Have you written a GitHub Actions workflow with matrix builds?', weight: 0.5 },
            { q: 'Can you implement a deploy-on-merge strategy with environment gates?', weight: 0.5 },
          ],
        },
      ],
    },
  },
  {
    icon: Warehouse,
    label: 'Operations Lead',
    color: 'orange-400',
    colorClass: 'text-orange-400',
    borderClass: 'border-orange-400/20',
    bgClass: 'bg-orange-400/10',
    from: 'Warehouse Supervisor',
    gap: ['WMS Software', 'Data Reporting', 'Safety Compliance', 'Lean Six Sigma'],
    modules: 4,
    hours: '24h',
    result: {
      name: 'Demo User',
      targetRole: 'Operations Lead',
      currentSkills: ['Team Leadership', 'Inventory Management', 'Forklift Certification', 'OSHA Basics'],
      gapSkills: ['WMS Software', 'Advanced Reporting', 'Lean Six Sigma', 'KPI Management'],
      pathway: [
        {
          id: 1, title: 'WMS Fundamentals (SAP EWM)', provider: 'SAP Learning', duration: '8h', prereqs: [],
          reason: 'Existing inventory management maps directly to WMS concepts — fast track.', confidence: 0.93,
          questions: [
            { q: 'Have you used a Warehouse Management System like SAP or Manhattan?', weight: 0.6 },
            { q: 'Can you configure put-away and pick strategies in a WMS?', weight: 0.4 },
          ],
        },
        {
          id: 2, title: 'Operations Reporting with Excel', provider: 'LinkedIn Learning', duration: '4h', prereqs: [],
          reason: 'Parallel entry point — no dependency on WMS module.', confidence: 0.90,
          questions: [
            { q: 'Can you build a pivot table dashboard with dynamic charts in Excel?', weight: 0.5 },
            { q: 'Have you used VLOOKUP, INDEX/MATCH, and SUMIFS in operations reporting?', weight: 0.5 },
          ],
        },
        {
          id: 3, title: 'Lean Six Sigma Yellow Belt', provider: 'IASSC', duration: '8h', prereqs: [],
          reason: 'Leadership experience satisfies the team coordination prerequisite.', confidence: 0.88,
          questions: [
            { q: 'Can you identify the 8 wastes of lean and give a real example of each?', weight: 0.5 },
            { q: 'Have you run a DMAIC project or kaizen event in a real workplace?', weight: 0.5 },
          ],
        },
        {
          id: 4, title: 'KPI Design for Operations', provider: 'Coursera', duration: '4h', prereqs: ['Operations Reporting with Excel'],
          reason: 'Combines reporting skills with Lean principles for full ops ownership.', confidence: 0.85,
          questions: [
            { q: 'Have you designed and tracked KPIs for a team of 5+ people?', weight: 0.6 },
            { q: 'Do you know the difference between leading and lagging indicators?', weight: 0.4 },
          ],
        },
      ],
    },
  },
]

export default function DemoPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-400 text-xs font-mono tracking-widest uppercase">Live Demo</span>
        </div>
        <h1 className="font-display text-5xl font-800 mb-3">Cross-domain proof</h1>
        <p className="text-dim text-base max-w-xl mx-auto">
          Click any profile — answer the knowledge checks to auto-skip what you already know. Same engine for tech and operational roles.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {DEMO_PROFILES.map((profile) => {
          const Icon = profile.icon
          return (
            <button
              key={profile.label}
              onClick={() => navigate('/pathway', { state: { result: profile.result } })}
              className="group text-left bg-white border border-border rounded-2xl p-6 hover:border-accent/30 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${profile.bgClass} border ${profile.borderClass} flex items-center justify-center`}>
                  <Icon size={18} className={profile.colorClass} />
                </div>
                <ArrowRight size={16} className="text-muted group-hover:text-accent transition-all group-hover:translate-x-1" />
              </div>

              <h3 className="font-display font-700 text-lg mb-0.5">{profile.label}</h3>
              <p className="text-dim text-xs font-mono mb-4">from: {profile.from}</p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.gap.map(s => (
                  <span key={s} className="text-xs font-mono px-2 py-0.5 bg-red-400/10 text-red-400 border border-red-400/20 rounded">
                    {s}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 text-xs font-mono text-muted border-t border-border pt-3">
                <span>{profile.modules} modules</span>
                <span>·</span>
                <span>{profile.hours} total</span>
                <span>·</span>
                <span className="text-accent">0% hallucination</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
