import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import EmployerSignup from './pages/EmployerSignup'
import EmployerLogin from './pages/EmployerLogin'
import EmployerForgotPassword from './pages/EmployerForgotPassword'
import EmployerResetPassword from './pages/EmployerResetPassword'
import EmployerDashboardLayout from './layouts/EmployerDashboardLayout'
import EmployerDashboard from './pages/EmployerDashboard'
import EmployerDashboardJobs from './pages/EmployerDashboardJobs'
import EmployerDashboardSettings from './pages/EmployerDashboardSettings'
import PostJob from './pages/PostJob'
import JobListings from './pages/JobListings'
import Apply from './pages/Apply.tsx'
import JobDetail from './pages/JobDetail'
import ApplySuccess from './pages/ApplySuccess'
import SalesEnquiry from './pages/SalesEnquiry'
import EmployerSales from './pages/EmployerSales'
import DashboardLayout from './layouts/DashboardLayout'
import CandidateLayout from './layouts/CandidateLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import DashboardAnalytics from './pages/DashboardAnalytics'
import DashboardSettings from './pages/DashboardSettings'
import RecruiterDashboard from './pages/RecruiterDashboard'
import CandidateDiscovery from './pages/CandidateDiscovery'
import ConfirmInterest from './pages/ConfirmInterest'
import CandidateProfile from './pages/CandidateProfile'

function AppContent() {
  const location = useLocation()
  const fullBleed = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/employer/sales' || location.pathname === '/jobs' || location.pathname.startsWith('/jobs/') || location.pathname.startsWith('/apply/') || location.pathname.startsWith('/confirm-interest/') || location.pathname === '/apply/success' || location.pathname === '/profile'
  return (
    <Routes>
      <Route path="/dashboard" element={<AdminDashboard />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="candidates" element={<CandidateDiscovery />} />
          <Route path="recruiter" element={<RecruiterDashboard />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>
      </Route>
      <Route path="*" element={
        <div className={fullBleed ? '' : 'max-w-6xl mx-auto px-6'}>
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/employer/signup" element={<EmployerSignup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/employer/login" element={<EmployerLogin />} />
              <Route path="/employer/forgot-password" element={<EmployerForgotPassword />} />
              <Route path="/employer/reset-password" element={<EmployerResetPassword />} />
              <Route path="/employer/dashboard" element={<EmployerDashboardLayout />}>
                <Route index element={<EmployerDashboard />} />
                <Route path="jobs" element={<EmployerDashboardJobs />} />
                <Route path="settings" element={<EmployerDashboardSettings />} />
              </Route>
              <Route path="/employer/post-job" element={<PostJob />} />
              <Route path="/jobs" element={<CandidateLayout />}>
                <Route index element={<JobListings />} />
                <Route path=":id" element={<JobDetail />} />
              </Route>
              <Route path="/jobs/:id/apply" element={<Apply />} />
              <Route path="/apply/:jobId" element={<Apply />} />
              <Route path="/apply/success" element={<ApplySuccess />} />
              <Route path="/confirm-interest/:id" element={<ConfirmInterest />} />
              <Route path="/profile" element={<CandidateProfile />} />
              <Route path="/sales-enquiry" element={<SalesEnquiry />} />
              <Route path="/employer/sales" element={<EmployerSales />} />
          </Routes>
        </div>
      } />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App