import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [role, setRole] = useState('Resident')
  const [email, setEmail] = useState('')
  const [officerId, setOfficerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (role === 'Resident') {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/reset-password` },
        )
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('request_officer_password_reset', {
          p_officer_id: officerId.trim().toUpperCase(),
          p_email: email.trim(),
        })
        if (error) throw error
      }
      setSent(true)
    } catch (err) {
      setError('Unable to process your request. Please check your details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const roleStyles = {
    Resident: { color: '#534AB7', bg: '#EEEDFE', border: '#CECBF6', activeBorder: '#534AB7' },
    Officer:  { color: '#3B6D11', bg: '#EAF3DE', border: '#C0DD97', activeBorder: '#3B6D11' },
  }

  return (
    <div
      className="login-page"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
    >
      <div className="login-card" style={{ maxWidth: '420px', width: '100%' }}>

        <div className="login-logo-row">
          <div className="login-logo">R</div>
          <div className="login-title">Reset Password</div>
          <div className="login-sub">Riverton Parking Portal</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: '#EAF3DE', color: '#3B6D11',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', margin: '0 auto 16px',
            }}>
              ✉
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
              Check your inbox
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px', lineHeight: 1.6 }}>
              If an account matching your details exists, a reset link has been sent to{' '}
              <strong>{email}</strong>.
            </p>
            <Link
              to="/login"
              style={{ fontSize: '13px', color: '#185FA5', textDecoration: 'none', fontWeight: 600 }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">I am a</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['Resident', 'Officer'].map(r => {
                    const s = roleStyles[r]
                    const isActive = role === r
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setRole(r); setError('') }}
                        style={{
                          flex: 1, padding: '10px', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                          border: `2px solid ${isActive ? s.activeBorder : s.border}`,
                          background: isActive ? s.bg : '#fff',
                          color: isActive ? s.color : '#6b7280',
                          transition: 'all 0.15s',
                        }}
                      >
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>

              {role === 'Officer' && (
                <div className="form-group">
                  <label className="form-label">
                    Officer ID <span className="req">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    value={officerId}
                    onChange={e => setOfficerId(e.target.value)}
                    placeholder="e.g. OFF-2024-0042"
                    style={{ fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                    Found on your department credential card
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Email Address <span className="req">*</span>
                </label>
                <input
                  className="form-control"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'Officer' ? 'officer@riverton.gov' : 'you@example.com'}
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                type="submit"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link to="/login" style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'none' }}>
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}