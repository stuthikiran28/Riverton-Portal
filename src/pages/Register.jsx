import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const STEPS = ['Personal Info', 'Vehicle Details', 'Done']

const NEIGHBORHOODS = [
  'Downtown', 'Eastside', 'Westside',
  'University District', 'Historic Quarter', 'Northgate',
]

export default function Register() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '',
    email: '', phone: '',
    password: '', confirmPassword: '',
    neighborhood: 'Downtown',
  })

  const [vehicle, setVehicle] = useState({
    plate: '', make: '', model: '', color: '', year: '',
  })

  const setP = (k, v) => setPersonal(f => ({ ...f, [k]: v }))
  const setV = (k, v) => setVehicle(f => ({ ...f, [k]: v }))

  function validatePersonal() {
    if (!personal.firstName.trim() || !personal.lastName.trim()) return 'First and last name are required.'
    if (!personal.email.trim()) return 'Email is required.'
    if (personal.password.length < 8) return 'Password must be at least 8 characters.'
    if (personal.password !== personal.confirmPassword) return 'Passwords do not match.'
    return null
  }

  function handleNextFromPersonal() {
    const err = validatePersonal()
    if (err) { setError(err); return }
    setError('')
    setStep(1)
  }

  function handleNextFromVehicle() {
    setError('')
    setStep(2)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personal.email.trim(),
        password: personal.password,
      })
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) throw new Error('Failed to create user account.')

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        role: 'resident',
        full_name: `${personal.firstName.trim()} ${personal.lastName.trim()}`,
        email: personal.email.trim(),
        mobile: personal.phone.trim(),
        neighborhood: personal.neighborhood,
      })
      if (profileError) throw profileError

      if (vehicle.plate.trim()) {
        const { error: vehicleError } = await supabase.from('resident_vehicles').insert({
          resident_id: userId,
          plate: vehicle.plate.toUpperCase().trim(),
          make: vehicle.make.trim(),
          model: vehicle.model.trim(),
          color: vehicle.color.trim(),
          year: vehicle.year ? parseInt(vehicle.year, 10) : null,
        })
        if (vehicleError) console.warn('Vehicle insert skipped:', vehicleError.message)
      }

      qc.invalidateQueries({ queryKey: ['profile', userId] })
      setStep(2)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="login-page"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
    >
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <div className="page-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', marginBottom: '6px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#534AB7', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800,
            }}>R</div>
            <div className="page-title" style={{ margin: 0 }}>Create Resident Account</div>
          </div>
          <div className="page-sub">Join Riverton's digital parking portal</div>
        </div>

        {/* Step bar */}
        <div className="step-bar" style={{ marginBottom: '24px' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className={`step${step === i ? ' active' : ''}${step > i ? ' done' : ''}`}>
                <div className="step-num">{step > i ? '✓' : i + 1}</div>
                <div className="step-label">{label}</div>
              </div>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Personal Info ── */}
        {step === 0 && (
          <div className="card">
            <div className="section-divider">Personal Information</div>
            {error && <div className="login-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span className="req">*</span></label>
                <input className="form-control" value={personal.firstName}
                  onChange={e => setP('firstName', e.target.value)} placeholder="Jane" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="req">*</span></label>
                <input className="form-control" value={personal.lastName}
                  onChange={e => setP('lastName', e.target.value)} placeholder="Smith" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address <span className="req">*</span></label>
                <input className="form-control" type="email" value={personal.email}
                  onChange={e => setP('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={personal.phone}
                  onChange={e => setP('phone', e.target.value)} placeholder="(314) 555-0000" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Neighborhood <span className="req">*</span></label>
                <select className="form-control" value={personal.neighborhood}
                  onChange={e => setP('neighborhood', e.target.value)}>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group" />
            </div>

            <div className="section-divider" style={{ marginTop: '8px' }}>Account Security</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span className="req">*</span></label>
                <input className="form-control" type="password" value={personal.password}
                  onChange={e => setP('password', e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="req">*</span></label>
                <input className="form-control" type="password" value={personal.confirmPassword}
                  onChange={e => setP('confirmPassword', e.target.value)} placeholder="Repeat password" />
              </div>
            </div>

            <div className="flex-end" style={{ marginTop: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Back to Login
              </Link>
              <button className="btn btn-primary" onClick={handleNextFromPersonal}>
                Continue → Vehicle Details
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Vehicle Details ── */}
        {step === 1 && (
          <div className="card">
            {error && <div className="login-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="section-divider">Vehicle Information</div>
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              All fields are optional — you can add or update vehicle details after signing in.
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Plate</label>
                <input className="form-control" value={vehicle.plate}
                  onChange={e => setV('plate', e.target.value)} placeholder="MO-4892-RV"
                  style={{ fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-control" type="number" value={vehicle.year}
                  onChange={e => setV('year', e.target.value)} placeholder="2019"
                  min="1990" max={new Date().getFullYear() + 1} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-control" value={vehicle.make}
                  onChange={e => setV('make', e.target.value)} placeholder="Toyota" />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-control" value={vehicle.model}
                  onChange={e => setV('model', e.target.value)} placeholder="Camry" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" value={vehicle.color}
                  onChange={e => setV('color', e.target.value)} placeholder="Silver" />
              </div>
              <div className="form-group" />
            </div>

            <div className="flex-end" style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => { setStep(0); setError('') }}>
                Back
              </button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating account…' : 'Create My Account ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Done ── */}
        {step === 2 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#EAF3DE', color: '#3B6D11',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 20px',
            }}>✓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
              Welcome to Riverton!
            </div>
            <p className="text-mid" style={{ marginBottom: '8px' }}>
              Your resident account has been created successfully.
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>
              Check your email to verify your account, then sign in to apply for permits.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        )}

        {step < 2 && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#185FA5', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const STEPS = ['Personal Info', 'Vehicle Details', 'Done']

const NEIGHBORHOODS = [
  'Downtown', 'Eastside', 'Westside',
  'University District', 'Historic Quarter', 'Northgate',
]

export default function Register() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '',
    email: '', phone: '',
    password: '', confirmPassword: '',
    neighborhood: 'Downtown',
  })

  const [vehicle, setVehicle] = useState({
    plate: '', make: '', model: '', color: '', year: '',
  })

  const setP = (k, v) => setPersonal(f => ({ ...f, [k]: v }))
  const setV = (k, v) => setVehicle(f => ({ ...f, [k]: v }))

  function validatePersonal() {
    if (!personal.firstName.trim() || !personal.lastName.trim()) return 'First and last name are required.'
    if (!personal.email.trim()) return 'Email is required.'
    if (personal.password.length < 8) return 'Password must be at least 8 characters.'
    if (personal.password !== personal.confirmPassword) return 'Passwords do not match.'
    return null
  }

  function handleNextFromPersonal() {
    const err = validatePersonal()
    if (err) { setError(err); return }
    setError('')
    setStep(1)
  }

  function handleNextFromVehicle() {
    setError('')
    setStep(2)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: personal.email.trim(),
        password: personal.password,
      })
      if (authError) throw authError
      const userId = authData.user?.id
      if (!userId) throw new Error('Failed to create user account.')

      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        role: 'resident',
        full_name: `${personal.firstName.trim()} ${personal.lastName.trim()}`,
        email: personal.email.trim(),
        mobile: personal.phone.trim(),
        neighborhood: personal.neighborhood,
      })
      if (profileError) throw profileError

      if (vehicle.plate.trim()) {
        const { error: vehicleError } = await supabase.from('resident_vehicles').insert({
          resident_id: userId,
          plate: vehicle.plate.toUpperCase().trim(),
          make: vehicle.make.trim(),
          model: vehicle.model.trim(),
          color: vehicle.color.trim(),
          year: vehicle.year ? parseInt(vehicle.year, 10) : null,
        })
        if (vehicleError) console.warn('Vehicle insert skipped:', vehicleError.message)
      }

      qc.invalidateQueries({ queryKey: ['profile', userId] })
      setStep(2)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="login-page"
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}
    >
      <div style={{ width: '100%', maxWidth: '580px' }}>

        <div className="page-header" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '10px', marginBottom: '6px',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: '#534AB7', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 800,
            }}>R</div>
            <div className="page-title" style={{ margin: 0 }}>Create Resident Account</div>
          </div>
          <div className="page-sub">Join Riverton's digital parking portal</div>
        </div>

        {/* Step bar */}
        <div className="step-bar" style={{ marginBottom: '24px' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className={`step${step === i ? ' active' : ''}${step > i ? ' done' : ''}`}>
                <div className="step-num">{step > i ? '✓' : i + 1}</div>
                <div className="step-label">{label}</div>
              </div>
              {i < STEPS.length - 1 && <div className="step-line" />}
            </div>
          ))}
        </div>

        {/* ── Step 0: Personal Info ── */}
        {step === 0 && (
          <div className="card">
            <div className="section-divider">Personal Information</div>
            {error && <div className="login-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span className="req">*</span></label>
                <input className="form-control" value={personal.firstName}
                  onChange={e => setP('firstName', e.target.value)} placeholder="Jane" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="req">*</span></label>
                <input className="form-control" value={personal.lastName}
                  onChange={e => setP('lastName', e.target.value)} placeholder="Smith" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address <span className="req">*</span></label>
                <input className="form-control" type="email" value={personal.email}
                  onChange={e => setP('email', e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={personal.phone}
                  onChange={e => setP('phone', e.target.value)} placeholder="(314) 555-0000" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Neighborhood <span className="req">*</span></label>
                <select className="form-control" value={personal.neighborhood}
                  onChange={e => setP('neighborhood', e.target.value)}>
                  {NEIGHBORHOODS.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group" />
            </div>

            <div className="section-divider" style={{ marginTop: '8px' }}>Account Security</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Password <span className="req">*</span></label>
                <input className="form-control" type="password" value={personal.password}
                  onChange={e => setP('password', e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password <span className="req">*</span></label>
                <input className="form-control" type="password" value={personal.confirmPassword}
                  onChange={e => setP('confirmPassword', e.target.value)} placeholder="Repeat password" />
              </div>
            </div>

            <div className="flex-end" style={{ marginTop: '8px' }}>
              <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                Back to Login
              </Link>
              <button className="btn btn-primary" onClick={handleNextFromPersonal}>
                Continue → Vehicle Details
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Vehicle Details ── */}
        {step === 1 && (
          <div className="card">
            {error && <div className="login-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="section-divider">Vehicle Information</div>
            <div className="alert alert-info" style={{ marginBottom: '16px' }}>
              All fields are optional — you can add or update vehicle details after signing in.
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">License Plate</label>
                <input className="form-control" value={vehicle.plate}
                  onChange={e => setV('plate', e.target.value)} placeholder="MO-4892-RV"
                  style={{ fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-control" type="number" value={vehicle.year}
                  onChange={e => setV('year', e.target.value)} placeholder="2019"
                  min="1990" max={new Date().getFullYear() + 1} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make</label>
                <input className="form-control" value={vehicle.make}
                  onChange={e => setV('make', e.target.value)} placeholder="Toyota" />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input className="form-control" value={vehicle.model}
                  onChange={e => setV('model', e.target.value)} placeholder="Camry" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" value={vehicle.color}
                  onChange={e => setV('color', e.target.value)} placeholder="Silver" />
              </div>
              <div className="form-group" />
            </div>

            <div className="flex-end" style={{ marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={() => { setStep(0); setError('') }}>
                Back
              </button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating account…' : 'Create My Account ✓'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Done ── */}
        {step === 2 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#EAF3DE', color: '#3B6D11',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', margin: '0 auto 20px',
            }}>✓</div>
            <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px' }}>
              Welcome to Riverton!
            </div>
            <p className="text-mid" style={{ marginBottom: '8px' }}>
              Your resident account has been created successfully.
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '28px' }}>
              Check your email to verify your account, then sign in to apply for permits.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Go to Sign In
            </button>
          </div>
        )}

        {step < 2 && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '16px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#185FA5', textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}