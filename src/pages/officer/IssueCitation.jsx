import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useIssueCitation } from '../../hooks/useCitations'
import { showNotification } from '../../components/ui/Notification'
import { useFeeConfig } from '../../hooks/useFeeConfig'
import { useNavigate, useLocation } from 'react-router-dom'

export default function IssueCitation() {
  const { profile } = useAuth()
  const issue = useIssueCitation()
  const navigate = useNavigate()

  const { data: feeRows = [], isLoading: feesLoading } = useFeeConfig()
   
     const VIOLATIONS = feeRows
    .filter(r => r.type === 'citation')
    .reduce((acc, r) => ({ ...acc, [r.permit_or_violation]: r.fee_amount }), {})

  const location = useLocation()
  const plate = location.state?.plate
  const permit = location.state?.permit || {}
  const [form, setForm] = useState({ plate: permit.vehicle_plate||plate||'', neighborhood: permit.neighborhood||'Downtown', zone: permit.zone||'Z1', violation: 'Expired Permit', notes: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const fine = VIOLATIONS[form.violation]
  

  async function handleSubmit() {
    await issue.mutateAsync({
      officer_id: profile.id, neighborhood: form.neighborhood, zone: form.zone,
      resident_id: permit.applicant_id ||null,
      violation_type: form.violation, fine_amount: fine,
      citation_date: new Date().toISOString().split('T')[0],
      payment_status: 'Unpaid', vehicle_plate: form.plate.toUpperCase(),
      officer_notes: form.notes, device_sync_lag_hrs: parseFloat((Math.random() * 5 + 0.5).toFixed(1)),
    })
    showNotification('Citation issued successfully.', 'info')
    navigate('/officer/log')
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Issue Citation</div>
        <div className="page-sub">Complete all fields before issuing</div>
      </div>
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">License Plate <span className="req">*</span></label>
            <input className="form-control" style={{ fontFamily: 'DM Mono', textTransform: 'uppercase' }}
              value={form.plate} onChange={e => set('plate', e.target.value)} placeholder="MO-0000-XX" />
          </div>
          <div className="form-group">
            <label className="form-label">Neighborhood</label>
            <select className="form-control" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}>
              {['Downtown','Eastside','Westside','University District','Historic Quarter','Northgate'].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Zone</label>
            <select className="form-control" value={form.zone} onChange={e => set('zone', e.target.value)}>
              {['Z1','Z2','Z3','Z4','Z5','Z6','Z7'].map(z => <option key={z}>{z}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Violation Type <span className="req">*</span></label>
            <select className="form-control" value={form.violation} onChange={e => set('violation', e.target.value)}>
              {Object.keys(VIOLATIONS).map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Fine Amount</label>
            <input className="form-control" value={`$${fine}.00`} disabled />
          </div>
          <div className="form-group">
            <label className="form-label">Officer Notes</label>
            <input className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional details…" />
          </div>
        </div>
        <div className="flex-end">
          <button className="btn btn-danger" onClick={handleSubmit} disabled={!form.plate || issue.isPending}>
            {issue.isPending ? 'Issuing…' : 'Issue Citation'}
          </button>
        </div>
      </div>
    </>
  )
}