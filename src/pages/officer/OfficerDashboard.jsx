import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useOfficerCitations, useIssueCitation } from '../../hooks/useCitations'
import { usePermitByPlate } from '../../hooks/usePermits'
import { useCitationFees } from '../../hooks/useFeeConfig'
import { showNotification } from '../../components/ui/Notification'

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ borderTop: `4px solid ${accent}`, textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: accent, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ── Action Button ─────────────────────────────────────────────────────────
function ActionBtn({ icon, label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      background: color, border: 'none', borderRadius: 16,
      padding: '18px 24px', cursor: 'pointer', flex: 1,
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)' }}
    >
      <span style={{ fontSize: 28 }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#fff', fontWeight: 700 }}>{label}</span>
    </button>
  )
}

// ── Disputed Citations Modal ───────────────────────────────────────────────
function DisputedModal({ citations, onClose }) {
  const disputed = citations.filter(c => c.payment_status === 'Disputed')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '2px solid #93C5E8',
        maxHeight: '80vh', overflowY: 'auto', margin: '0 16px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>⚠️ Disputed Citations</div>
            <div style={{ fontSize: 12, color: '#6B7A99', marginTop: 2 }}>{disputed.length} citation{disputed.length !== 1 ? 's' : ''} under dispute</div>
          </div>
          <button onClick={onClose} style={{ background: '#F0F4FA', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#6B7A99' }}>✕</button>
        </div>

        {disputed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A7F4B' }}>No disputed citations</div>
            <div style={{ fontSize: 13, color: '#6B7A99', marginTop: 4 }}>All your citations are clear</div>
          </div>
        ) : disputed.map(c => (
          <div key={c.id} style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 10,
            background: '#FEF3C7', border: '1.5px solid #F59E0B',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{c.violation_type}</div>
                <div style={{ fontSize: 11, color: '#6B7A99', marginTop: 3 }}>
                  {c.citation_id} · {c.vehicle_plate || '—'} · {c.neighborhood} · {c.zone}
                </div>
                <div style={{ fontSize: 11, color: '#6B7A99', marginTop: 2 }}>{c.citation_date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#B45309' }}>${c.fine_amount}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: '#FDE68A', color: '#92400E' }}>Disputed</span>
              </div>
            </div>
            {c.officer_notes && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#92400E', background: '#FDE68A', padding: '6px 10px', borderRadius: 8 }}>
                📝 {c.officer_notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Refund Claims Modal ────────────────────────────────────────────────────
function RefundClaimsModal({ citations, onClose }) {
  const claims   = citations.filter(c => c.refund_claim === true)
  const approved = claims.filter(c => c.refund_status === 'Approved').length
  const denied   = claims.filter(c => c.refund_status === 'Denied').length
  const pending  = claims.filter(c => !c.refund_status || c.refund_status === 'Pending').length

  const statusStyle = {
    Approved: { bg: '#E8F7EF', color: '#1A7F4B' },
    Denied:   { bg: '#FEE2E2', color: '#D94F3D' },
    Pending:  { bg: '#FEF3C7', color: '#B45309' },
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 640,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '2px solid #93C5E8',
        maxHeight: '80vh', overflowY: 'auto', margin: '0 16px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>💰 Refund Claims</div>
            <div style={{ fontSize: 12, color: '#6B7A99', marginTop: 2 }}>{claims.length} claim{claims.length !== 1 ? 's' : ''} filed against your citations</div>
          </div>
          <button onClick={onClose} style={{ background: '#F0F4FA', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#6B7A99' }}>✕</button>
        </div>

        {/* Summary pills */}
        {claims.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total',    value: claims.length, bg: '#F0F4FA', color: '#003DA5' },
              { label: 'Approved', value: approved,      bg: '#E8F7EF', color: '#1A7F4B' },
              { label: 'Denied',   value: denied,        bg: '#FEE2E2', color: '#D94F3D' },
              { label: 'Pending',  value: pending,       bg: '#FEF3C7', color: '#B45309' },
            ].map(({ label, value, bg, color }) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: bg }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {claims.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A7F4B' }}>No refund claims</div>
            <div style={{ fontSize: 13, color: '#6B7A99', marginTop: 4 }}>No residents have claimed refunds on your citations</div>
          </div>
        ) : claims.map(c => {
          const s = statusStyle[c.refund_status] || statusStyle.Pending
          return (
            <div key={c.id} style={{
              padding: '14px 16px', borderRadius: 12, marginBottom: 10,
              background: '#F8FAFC', border: '1.5px solid #E2EAF4',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>{c.violation_type}</div>
                  <div style={{ fontSize: 11, color: '#6B7A99', marginTop: 3 }}>
                    {c.citation_id} · {c.vehicle_plate || '—'} · {c.neighborhood} · {c.zone}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7A99', marginTop: 2 }}>{c.citation_date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#D94F3D', marginBottom: 4 }}>${c.fine_amount}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: s.bg, color: s.color }}>
                    {c.refund_status || 'Pending'}
                  </span>
                </div>
              </div>
              {c.refund_amount > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#1A7F4B', fontWeight: 600 }}>
                  Refund amount: ${c.refund_amount}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Recent Citations Modal ─────────────────────────────────────────────────
function RecentCitationsModal({ citations, onClose }) {
  const STATUS_COLOR = {
    Paid:     { bg: '#E8F7EF', color: '#1A7F4B' },
    Unpaid:   { bg: '#FEE2E2', color: '#D94F3D' },
    Disputed: { bg: '#FEF3C7', color: '#B45309' },
    Waived:   { bg: '#F0F4FA', color: '#6B7A99' },
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 700,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '2px solid #93C5E8',
        maxHeight: '80vh', overflowY: 'auto', margin: '0 16px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>📋 My Citations</div>
          <button onClick={onClose} style={{ background: '#F0F4FA', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#6B7A99' }}>✕</button>
        </div>

        {citations.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6B7A99', padding: 40 }}>No citations yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2EAF4' }}>
                {['Citation ID','Violation','Plate','Neighborhood','Zone','Amount','Status','Date'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citations.slice(0, 30).map(c => {
                const s = STATUS_COLOR[c.payment_status] || STATUS_COLOR.Waived
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F0F4FA' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>{c.citation_id}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{c.violation_type}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, fontFamily: 'monospace', color: '#6B7A99' }}>{c.vehicle_plate || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{c.neighborhood}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151' }}>{c.zone}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#D94F3D' }}>${c.fine_amount}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{c.payment_status}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6B7A99', whiteSpace: 'nowrap' }}>{c.citation_date}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Zone Activity Modal ────────────────────────────────────────────────────
function ZoneStatusModal({ citations, onClose }) {
  const zoneCounts = citations.reduce((acc, c) => {
    acc[c.zone] = (acc[c.zone] || 0) + 1
    return acc
  }, {})
  const maxCount = Math.max(...Object.values(zoneCounts), 1)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)', border: '2px solid #93C5E8',
        maxHeight: '80vh', overflowY: 'auto', margin: '0 16px',
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A2E' }}>📍 Zone Activity</div>
          <button onClick={onClose} style={{ background: '#F0F4FA', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontSize: 16, color: '#6B7A99' }}>✕</button>
        </div>

        {['Z1','Z2','Z3','Z4','Z5','Z6','Z7','Z8'].map(zone => {
          const count = zoneCounts[zone] || 0
          const pct   = (count / maxCount) * 100
          return (
            <div key={zone} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E' }}>{zone}</span>
                <span style={{ fontSize: 13, color: '#6B7A99' }}>{count} citation{count !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ height: 10, background: '#F0F4FA', borderRadius: 6 }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  background: count > 0 ? '#003DA5' : 'transparent',
                  width: `${pct}%`, transition: 'width 0.4s',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function OfficerDashboard() {
  const { profile }              = useAuth()
  const { data: citations = [] } = useOfficerCitations(profile?.id)
  const [modal, setModal]        = useState(null)
  const [time, setTime]          = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const today          = new Date().toISOString().split('T')[0]
  const todayCitations = citations.filter(c => c.citation_date === today)
  const totalVerified  = citations.filter(c => c.linked_permit_id).length
  const totalFines     = todayCitations.reduce((s, c) => s + Number(c.fine_amount || 0), 0)
  const unpaidCount    = todayCitations.filter(c => c.payment_status === 'Unpaid').length
  const disputedCount  = citations.filter(c => c.payment_status === 'Disputed').length
  const refundCount    = citations.filter(c => c.refund_claim === true).length

  const topViolation = (() => {
    const counts = todayCitations.reduce((a, c) => {
      a[c.violation_type] = (a[c.violation_type] || 0) + 1
      return a
    }, {})
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : '—'
  })()

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="page-title">Officer Dashboard</div>
        <div className="page-sub">
          {profile?.full_name || 'Officer'} · {profile?.neighborhood || 'Unassigned'} ·{' '}
          <span style={{ color: '#1A7F4B', fontWeight: 600 }}>🟢 System Online</span>
        </div>
      </div>

      {/* ── Top stat cards — 4 side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Citations Today"    value={todayCitations.length}             accent="#D94F3D" />
        <StatCard label="Verified Permits"   value={totalVerified}                     accent="#1A7F4B" />
        <StatCard label="Fines Issued Today" value={`$${totalFines.toLocaleString()}`} accent="#003DA5" />
        <StatCard label="Unpaid Citations"   value={unpaidCount}                       accent="#E07B00" />
      </div>

      {/* ── Bottom row: actions + summary side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <ActionBtn icon="⚠️" label="Disputed"      color="#B45309" onClick={() => setModal('disputed')} />
            <ActionBtn icon="💰" label="Refund Claims"  color="#6B7A99" onClick={() => setModal('refunds')}  />
            <ActionBtn icon="📍" label="Zone Activity"  color="#1A7F4B" onClick={() => setModal('zone')}     />
            <ActionBtn icon="📋" label="My Citations"   color="#003DA5" onClick={() => setModal('recent')}   />
          </div>
        </div>

        {/* Today's Summary */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Today's Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Total Fines Issued',   value: `$${totalFines.toLocaleString()}`, color: '#003DA5' },
              { label: 'Unpaid Citations',      value: unpaidCount,                       color: '#D94F3D' },
              { label: 'Most Common Violation', value: topViolation,                      color: '#E07B00' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10,
                background: '#F8FAFC', border: '1.5px solid #E2EAF4',
              }}>
                <span style={{ fontSize: 13, color: '#6B7A99', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      {modal === 'disputed' && <DisputedModal       onClose={() => setModal(null)} citations={citations} />}
      {modal === 'refunds'  && <RefundClaimsModal   onClose={() => setModal(null)} citations={citations} />}
      {modal === 'recent'   && <RecentCitationsModal onClose={() => setModal(null)} citations={citations} />}
      {modal === 'zone'     && <ZoneStatusModal      onClose={() => setModal(null)} citations={citations} />}
    </>
  )
}