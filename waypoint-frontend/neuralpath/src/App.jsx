import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import PathwayPage from './pages/PathwayPage'
import OnboardingQuiz from './pages/OnboardingQuiz'
import ResumeScorePage from './pages/ResumeScorePage'
import DemoPage from './pages/DemoPage'
import SkillGraphPage from './pages/SkillGraphPage'
import CertificatePage from './pages/CertificatePage'
import SkillsTestPage from './pages/SkillsTestPage'
import CoursesPage from './pages/CoursesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="pathway" element={<PathwayPage />} />
        <Route path="quiz" element={<OnboardingQuiz />} />
        <Route path="score" element={<ResumeScorePage />} />
        <Route path="demo" element={<DemoPage />} />
        <Route path="skill-graph" element={<SkillGraphPage />} />
        <Route path="certificate" element={<CertificatePage />} />
        <Route path="test" element={<SkillsTestPage />} />
        <Route path="courses" element={<CoursesPage />} />
      </Route>
    </Routes>
  )
}
