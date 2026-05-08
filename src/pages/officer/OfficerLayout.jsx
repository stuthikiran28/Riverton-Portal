import { NavLink, Outlet } from 'react-router-dom'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../contexts/AuthContext'
import Notification from '../../components/ui/Notification'

export default function OfficerLayout() {
  const { signOut } = useAuth()
  const navClass = ({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`

  return (
    <>
      <Topbar />
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-section">Officer Menu</div>
          <NavLink to="/officer/dashboard" className={navClass}><span className="sidebar-icon">📋</span> Officer Dashboard </NavLink>
          <NavLink to="/officer"       end className={navClass}><span className="sidebar-icon">🔍</span> Permit Lookup</NavLink>
          <NavLink to="/officer/issue"     className={navClass}><span className="sidebar-icon">🚨</span> Issue Citation</NavLink>
          <NavLink to="/officer/log"       className={navClass}><span className="sidebar-icon">📋</span> My Log</NavLink>
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