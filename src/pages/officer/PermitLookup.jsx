import { useState } from 'react'
import { usePermitByPlate } from '../../hooks/usePermits'
import { useProfileById } from '../../hooks/useAdminstats'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { statusBadge } from '../../components/ui/Badge'

export default function PermitLookup() {
  const [plate, setPlate] = useState('')
  const [query, setQuery] = useState('')
  const { data: permit, isPending, isFetched } = usePermitByPlate(query)
  const navigate = useNavigate()
  const searched = isFetched && !!query && !isPending
  const { data: holder } = useProfileById(permit?.applicant_id)

  return (
    <>
      <div className="page-header">
        <div className="page-title">Permit Lookup</div>
        <div className="page-sub">Enter a license plate to check permit validity</div>
      </div>
      <div className="card">
        <div className="form-group" style={{ display: 'flex', gap: 12 }}>
          <input
            className="form-control"
            style={{ fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', flex: 1 }}
            placeholder="Enter plate (e.g. MO-4892-RV)"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setQuery(plate)}
          />
          <button className="btn btn-primary" onClick={() => setQuery(plate)}>
            Look Up
          </button>
        </div>

        {isPending &&query && <p className="text-mid">Searching…</p>}

        {/* VALID PERMIT FOUND */}
        {searched && permit && permit.status === 'Approved' && (
          <div style={{ background: 'var(--success)', border: '1.5px solid var(--green)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 10, fontSize: 15 }}>
              ✅ Valid Permit Found
            </div>
            {[
              ['Permit ID',  permit.permit_id],
              ['Holder',     holder?.full_name|| '—'],
              ['Type',       permit.permit_type],
              ['Zone',       permit.zone],
              ['Neighborhood', permit.neighborhood],
              ['Vehicle',    `${permit.vehicle_make || ''} ${permit.vehicle_model || ''} (${permit.vehicle_color || '—'})`],
              ['Expires',    permit.expiry_date ? format(new Date(permit.expiry_date), 'MMM d, yyyy') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, minWidth: 130, color: 'var(--mid)' }}>{label}:</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, minWidth: 130, fontSize: 13, color: 'var(--mid)' }}>Status:</span>
              {statusBadge(permit.status)}
            </div>
          </div>
        )}

        {/* PERMIT EXISTS BUT NOT VALID (expired, denied, pending) */}
        {searched && permit && permit.status === 'Expired'  && (
          <div style={{ background: '#FFF8EC', border: '1.5px solid var(--gold)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, color: '#C07000', marginBottom: 10, fontSize: 15 }}>
              ⚠️ Permit Found but Not Valid
            </div>
            {[
              ['Permit ID', permit.permit_id],
              ['Holder',    holder?.full_name || '—'],
              ['Type',      permit.permit_type],
              ['Zone',      permit.zone],
              ['Expires',   permit.expiry_date ? format(new Date(permit.expiry_date), 'MMM d, yyyy') : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, minWidth: 130, color: 'var(--mid)' }}>{label}:</span>
                <span>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, minWidth: 130, fontSize: 13, color: 'var(--mid)' }}>Status:</span>
              {statusBadge(permit.status)}
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => navigate('/officer/issue', { state: {permit: permit} })}
              >
                🚨 Issue Citation
              </button>
            </div>
          </div>
        )}

        {/* NO PERMIT FOUND */}
        {searched && !permit && (
          <div style={{ background: '#FEF0EE', border: '1.5px solid var(--red)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6, fontSize: 15 }}>
              ⛔ No Permit Found
            </div>
            <p style={{ fontSize: 13, marginBottom: 16 }}>
              Plate <strong>{query.toUpperCase()}</strong> has no permit registered in the system.
            </p>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => navigate('/officer/issue', { state: { plate: query } })}
            >
              🚨 Issue Citation
            </button>
          </div>
        )}
      </div>
    </>
  )
}