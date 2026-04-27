import { useAuth } from '../../contexts/AuthContext'

export default function Topbar() {
  const { profile, signOut } = useAuth()
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'
  const avatarColors = { resident: 'var(--green)', officer: '#E65100', admin: 'var(--purple)' }

  return (
    <div className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo">R</div>
        <div className="topbar-title">Riverton Parking Portal</div>
      </div>
      <div className="topbar-right">
        <span className={`role-badge role-${profile?.role}`}>{profile?.role}</span>
        <div className="topbar-user">
          <div className="topbar-avatar" style={{ background: avatarColors[profile?.role] }}>
            {initials}
          </div>
          <span>{profile?.full_name}</span>
        </div>
        <button className="btn btn-sm btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,.3)' }} onClick={signOut}>
          Sign Out
        </button>
      </div>
    </div>
  )
}