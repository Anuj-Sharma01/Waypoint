import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import PathwayPage from './pages/PathwayPage'
import DemoPage from './pages/DemoPage'
import OnboardingQuiz from './pages/OnboardingQuiz'
import SkillGraphPage from './pages/SkillGraphPage'
import ResumeScorePage from './pages/ResumeScorePage'
import LeaderboardPage from './pages/LeaderboardPage'
import CertificatePage from './pages/CertificatePage'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('splashSeen')) setShowSplash(false)
  }, [])

  const handleSplashDone = () => {
    sessionStorage.setItem('splashSeen', '1')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="pathway" element={<PathwayPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="quiz" element={<OnboardingQuiz />} />
          <Route path="graph" element={<SkillGraphPage />} />
          <Route path="score" element={<ResumeScorePage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="certificate" element={<CertificatePage />} />
        </Route>
      </Routes>
    </>
  )
}
