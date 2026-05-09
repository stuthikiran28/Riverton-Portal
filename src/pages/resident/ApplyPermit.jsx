import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSubmitPermit } from '../../hooks/usePermits'
import { showNotification } from '../../components/ui/Notification'
import { useFeeConfig } from '../../hooks/useFeeConfig'
import { useNavigate } from 'react-router-dom'

//const PERMIT_FEES = { 'Residential': 25, 'Visitor': 15, 'Contractor': 50, 'Temporary': 20, 'University Affiliate': 30 }
const STEPS = ['Applicant Info', 'Permit Details', 'Payment', 'Confirmation']

export default function ApplyPermit() {
  const { profile } = useAuth()
  const submit = useSubmitPermit()
  const navigate = useNavigate()

 const { data: feeRows = [], isLoading: feesLoading } = useFeeConfig()
 
   const PERMIT_FEES = feeRows
  .filter(r => r.type === 'permit')
  .reduce((acc, r) => ({ ...acc, [r.permit_or_violation]: r.fee_amount }), {})

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: profile?.full_name?.split(' ')[0] || '',
    lastName:  profile?.full_name?.split(' ')[1] || '',
    email: profile?.email || '', phone: profile.mobile || '',
    neighborhood: profile?.neighborhood || 'Downtown', streetAddress: '',
    permitType: 'Residential', zone: 'Z3',
    vehiclePlate: '', vehicleMake: '', vehicleModel: '', vehicleColor: '',
  })

  const fee = PERMIT_FEES[form.permitType]
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    await submit.mutateAsync({
      applicant_id: profile.id,
      permit_type: form.permitType, neighborhood: form.neighborhood, zone: form.zone,
      submission_source: 'Online', submission_date: new Date().toISOString().split('T')[0],
      status: 'Pending', expiry_date: expiryDate.toISOString().split('T')[0],
      permit_fee: fee, vehicle_plate: form.vehiclePlate.toUpperCase(),
      vehicle_make: form.vehicleMake, vehicle_model: form.vehicleModel,
      vehicle_color: form.vehicleColor, street_address: form.streetAddress,
    })
    showNotification('Application submitted successfully!', 'success')
    setStep(3)
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Apply for Parking Permit</div>
        <div className="page-sub">Processing target: under 4 hours</div>
      </div>

      <div className="step-bar">
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

      {step === 0 && (
        <div className="card">
          <div className="section-divider">Applicant Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name <span className="req">*</span></label>
              <input className="form-control" value={form.firstName} onChange={e => set('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name <span className="req">*</span></label>
              <input className="form-control" value={form.lastName} onChange={e => set('lastName', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email <span className="req">*</span></label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone <span className="req">*</span></label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(314) 555-0000" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Neighborhood <span className="req">*</span></label>
              <select className="form-control" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}>
                {['Downtown','Eastside','Westside','University District','Historic Quarter','Northgate'].map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Street Address <span className="req">*</span></label>
              <input className="form-control" value={form.streetAddress} onChange={e => set('streetAddress', e.target.value)} placeholder="412 Maple Ave" />
            </div>
          </div>
          <div className="flex-end">
            <button className="btn btn-primary" onClick={() => setStep(1)}>Continue → Permit Details</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card">
          <div className="section-divider">Permit Details</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Permit Type <span className="req">*</span></label>
              <select className="form-control" value={form.permitType} onChange={e => set('permitType', e.target.value)}>
                {Object.keys(PERMIT_FEES).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Parking Zone <span className="req">*</span></label>
              <select className="form-control" value={form.zone} onChange={e => set('zone', e.target.value)}>
                {['Z1','Z2','Z3','Z4','Z5','Z6','Z7'].map(z => <option key={z}>{z}</option>)}
              </select>
            </div>
          </div>
          <div className="section-divider">Vehicle Information</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">License Plate <span className="req">*</span></label>
              <input className="form-control" value={form.vehiclePlate} onChange={e => set('vehiclePlate', e.target.value)} placeholder="MO-4892-RV" style={{ fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Make</label>
              <input className="form-control" value={form.vehicleMake} onChange={e => set('vehicleMake', e.target.value)} placeholder="Toyota" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Model</label>
              <input className="form-control" value={form.vehicleModel} onChange={e => set('vehicleModel', e.target.value)} placeholder="Camry" />
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-control" value={form.vehicleColor} onChange={e => set('vehicleColor', e.target.value)} placeholder="Silver" />
            </div>
          </div>
          <div className="alert alert-info">Permit fee: ${fee}.00</div>
          <div className="flex-end">
            <button className="btn btn-secondary" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continue → Payment</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="section-divider">Payment — ${fee}.00 Due</div>
          <div className="alert alert-warn">Demo only — integrate Stripe in production.</div>
          <div className="form-group">
            <label className="form-label">Card Number</label>
            <input className="form-control" placeholder="•••• •••• •••• ••••" style={{ fontFamily: 'DM Mono, monospace' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expiry</label>
              <input className="form-control" placeholder="MM/YY" />
            </div>
            <div className="form-group">
              <label className="form-label">CVV</label>
              <input className="form-control" placeholder="•••" />
            </div>
          </div>
          <div className="flex-end">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-success" onClick={handleSubmit} disabled={submit.isPending}>
              {submit.isPending ? 'Submitting…' : `Confirm & Pay $${fee}`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Application Submitted!</div>
          <p className="text-mid" style={{ marginBottom: 24 }}>Your application is under review. Decision within 4 hours.</p>
          <button className="btn btn-primary" onClick={() => navigate('/resident/permits')}>View My Permits</button>
        </div>
      )}
    </>
  )
}