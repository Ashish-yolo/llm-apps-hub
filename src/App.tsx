import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import AppsPage from './pages/AppsPage'
import AppDetail from './pages/AppDetail'
import TutorialsPage from './pages/TutorialsPage'
import AboutPage from './pages/AboutPage'

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apps" element={<AppsPage />} />
          <Route path="/app/:id" element={<AppDetail />} />
          <Route path="/tutorials" element={<TutorialsPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
