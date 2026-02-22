import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import EmployerSignup from './pages/EmployerSignup'
import EmployerDashboardLayout from './layouts/EmployerDashboardLayout'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerDashboardJobs from './pages/EmployerDashboardJobs'
import EmployerDashboardSettings from './pages/EmployerDashboardSettings'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import Apply from './pages/Apply'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import DashboardAnalytics from './pages/DashboardAnalytics'
import DashboardSettings from './pages/DashboardSettings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>
        <Route path="*" element={
          <div className="max-w-6xl mx-auto px-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employer/signup" element={<EmployerSignup />} />
              <Route path="/employer/dashboard" element={<EmployerDashboardLayout />}>
                <Route index element={<EmployerDashboard />} />
                <Route path="jobs" element={<EmployerDashboardJobs />} />
                <Route path="settings" element={<EmployerDashboardSettings />} />
              </Route>
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/jobs" element={<JobListings />} />
              <Route path="/jobs/:id/apply" element={<Apply />} />
            </Routes>
          </div>
        } />
      </Routes>
    </Router>
  )
}

export default App