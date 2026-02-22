import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EmployerSignup from './pages/EmployerSignup'
import EmployerDashboard from './pages/EmployerDashboard'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import Apply from './pages/Apply'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/employer/signup" element={<EmployerSignup />} />
        <Route path="/employer/dashboard" element={<EmployerDashboard />} />
        <Route path="/employer/post-job" element={<PostJob />} />
        <Route path="/jobs" element={<JobListings />} />
        <Route path="/jobs/:id/apply" element={<Apply />} />
      </Routes>
    </Router>
  )
}

export default App