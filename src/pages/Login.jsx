import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TEST_ACCOUNTS = [
  {
    role: 'Admin',
    email: 'admin@riverton.gov',
    password: 'admin123',
    color: '#185FA5',
    bg: '#E6F1FB',
    border: '#B5D4F4',
    initial: 'A',
  },
  {
    role: 'Officer',
    email: 'officer1@riverton.gov',
    password: 'officer123',
    color: '#3B6D11',
    bg: '#EAF3DE',
    border: '#C0DD97',
    initial: 'O',
  },
  {
    role: 'Resident',
    email: 'resident1@riverton.gov',
    password: 'resident123',
    color: '#534AB7',
    bg: '#EEEDFE',
    border: '#CECBF6',
    initial: 'R',
  },
]

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [quickLoading, setQuickLoading] = useState(null)
  const [quickError, setQuickError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Invalid email or password.')
      return
    }
    navigate('/')
  }

  async function handleQuickLogin(acc) {
    setQuickLoading(acc.role)
    setQuickError('')
    const { error } = await signIn(acc.email, acc.password)
    setQuickLoading(null)
    if (error) {
      setQuickError(`Could not log in as ${acc.role}.`)
      return
    }
    navigate('/')
  }

  return (
    <div
      className="login-page"
      style={{
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {/* Quick Access Card */}
      <div className="login-card" style={{ width: '260px', padding: '1.5rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
          Quick Access
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '1.25rem' }}>
          One click to log in instantly
        </div>

        {TEST_ACCOUNTS.map((acc) => (
          <div
            key={acc.role}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: acc.bg, color: acc.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, flexShrink: 0,
                }}
              >
                {acc.initial}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>
                {acc.role}
              </span>
            </div>
            <div
              style={{
                fontSize: '11px', color: '#888',
                fontFamily: 'monospace', marginBottom: '8px', paddingLeft: '36px',
              }}
            >
              {acc.email}
            </div>
            <button
              onClick={() => handleQuickLogin(acc)}
              disabled={quickLoading === acc.role}
              style={{
                width: '100%', padding: '8px', borderRadius: '6px',
                fontSize: '12px', fontWeight: 600,
                cursor: quickLoading === acc.role ? 'not-allowed' : 'pointer',
                border: `1px solid ${acc.border}`,
                background: acc.bg, color: acc.color,
                opacity: quickLoading === acc.role ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {quickLoading === acc.role ? 'Signing in...' : `Login as ${acc.role}`}
            </button>
          </div>
        ))}

        {quickError && (
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '8px' }}>
            {quickError}
          </div>
        )}
      </div>

      {/* Main Login Card */}
      <div className="login-card">
        <div className="login-logo-row">
          <div className="login-logo">R</div>
          <div className="login-title">Riverton Parking Portal</div>
          <div className="login-sub">Centralized Permit &amp; Enforcement System</div>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Password</span>
              <Link
                to="/forgot-password"
                style={{ fontSize: '11px', color: '#185FA5', textDecoration: 'none', fontWeight: 500 }}
              >
                Forgot password?
              </Link>
            </label>
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>New to Riverton?</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        {/* Register CTA */}
        <div style={{
          border: '1px solid #CECBF6',
          borderRadius: '8px',
          padding: '14px 16px',
          background: '#EEEDFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#3C3489' }}>
              Create a resident account
            </div>
            <div style={{ fontSize: '11px', color: '#534AB7', marginTop: '2px' }}>
              Apply for permits and manage your vehicles online
            </div>
          </div>
          <Link
            to="/register"
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#534AB7',
              color: '#fff',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Be a Member →
          </Link>
        </div>
      </div>
    </div>
  )
}