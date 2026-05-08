import { NavLink, Outlet } from 'react-router-dom'
import Topbar from '../../components/layout/Topbar'
import { useAuth } from '../../contexts/AuthContext'
import Notification from '../../components/ui/Notification'

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navClass = ({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`

  return (
    <>
      <Topbar />
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-section">Admin Menu</div>
          <NavLink to="/admin"            end className={navClass}><span className="sidebar-icon">📊</span> Overview</NavLink>
          <NavLink to="/admin/permits"        className={navClass}><span className="sidebar-icon">🗂️</span> Manage Permits</NavLink>
          <NavLink to="/admin/citations"      className={navClass}><span className="sidebar-icon">🚨</span> Manage Citations</NavLink>
          <NavLink to="/admin/refunds"        className={navClass}><span className="sidebar-icon">💰</span> Refunds</NavLink>
          <NavLink to="/admin/kpi"            className={navClass}><span className="sidebar-icon">📈</span> KPI Dashboard</NavLink>
          <NavLink to="/admin/manage"         className={navClass}><span className="sidebar-icon">👥</span> Management</NavLink>
          <NavLink to="/admin/fee"            className={navClass}><span className="sidebar-icon">⚙️</span> FeeConfig</NavLink>
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