import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'

import ResidentLayout from './pages/resident/ResidentLayout'
import ResidentDashboard from './pages/resident/Dashboard'
import ApplyPermit from './pages/resident/ApplyPermit'
import MyPermits from './pages/resident/MyPermits'
import MyCitations from './pages/resident/MyCitations'
import RefundClaims from './pages/resident/RefundClaims'

import OfficerLayout from './pages/officer/OfficerLayout'
import PermitLookup from './pages/officer/PermitLookup'
import IssueCitation from './pages/officer/IssueCitation'
import MyLog from './pages/officer/MyLog'
import OfficerDashboard from './pages/officer/OfficerDashboard'

import AdminLayout from './pages/admin/AdminLayout'
import Overview from './pages/admin/Overview'
import ManagePermits from './pages/admin/ManagePermits'
import ManageCitations from './pages/admin/ManageCitations'
import Refunds from './pages/admin/Refunds'
import KpiDashboard from './pages/admin/KpiDashboard'
import Management from './pages/admin/Management'
import FeeConfig from './pages/admin/FeeConfig'


/*function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/login" replace />
  }
  return children
} */



function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(profile?.role)) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RoleRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (!profile) return <div className="loading-screen">Loading profile…</div>
  const routes = { resident: '/resident', officer: '/officer', admin: '/admin' }
  return <Navigate to={routes[profile.role] || '/login'} replace />
}

 

/*function RoleRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!profile) return <Navigate to="/login" replace />
  const routes = { resident: '/resident', officer: '/officer', admin: '/admin' }
  return <Navigate to={routes[profile.role] || '/login'} replace />
}*/


 /*function ProtectedRoute({ children, allowedRoles }) {
  return children
}

function RoleRedirect() {
  return <Navigate to="/resident" replace />  // change this to any page
}
*/

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RoleRedirect />} />

          <Route path="/resident" element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ResidentDashboard />} />
            <Route path="apply" element={<ApplyPermit />} />
            <Route path="permits" element={<MyPermits />} />
            <Route path="citations" element={<MyCitations />} />
            <Route path="refunds" element={<RefundClaims />} />
          </Route>

          <Route path="/officer" element={
            <ProtectedRoute allowedRoles={['officer']}>
              <OfficerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PermitLookup />} />
            <Route path="dashboard" element={<OfficerDashboard />} />
            <Route path="issue" element={<IssueCitation />} />
            <Route path="log" element={<MyLog />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Overview />} />
            <Route path="permits" element={<ManagePermits />} />
            <Route path="citations" element={<ManageCitations />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="kpi" element={<KpiDashboard />} />
            <Route path="manage" element={<Management/>} />
            <Route path="fee" element={<FeeConfig/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}