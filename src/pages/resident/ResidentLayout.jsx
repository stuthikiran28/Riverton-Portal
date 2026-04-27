import { NavLink, Outlet } from 'react-router-dom'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../contexts/AuthContext'
import Notification from '../../components/ui/Notification'

export default function ResidentLayout() {
  const { signOut } = useAuth()
  const navClass = ({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`

  return (
    <>
      <Topbar />
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-section">Resident Menu</div>
          <NavLink to="/resident"           end className={navClass}><span className="sidebar-icon">🏠</span> Dashboard</NavLink>
          <NavLink to="/resident/apply"         className={navClass}><span className="sidebar-icon">📝</span> Apply for Permit</NavLink>
          <NavLink to="/resident/permits"       className={navClass}><span className="sidebar-icon">🗂️</span> My Permits</NavLink>
          <NavLink to="/resident/citations"     className={navClass}><span className="sidebar-icon">🚨</span> My Citations</NavLink>
          <NavLink to="/resident/refunds"       className={navClass}><span className="sidebar-icon">💰</span> Refund Claims</NavLink>
          <div className="sidebar-footer">
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={signOut}>
              Sign Out
            </button>
          </div>
        </nav>
        <main className="main"><Outlet /></main>
      </div>
      <Notification />
    </>
  )
}