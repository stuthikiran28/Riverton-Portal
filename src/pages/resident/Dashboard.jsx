import { useAuth } from '../../contexts/AuthContext'
import { useMyPermits } from '../../hooks/usePermits'
import { useMyCitations } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'

export default function ResidentDashboard() {
  const { profile } = useAuth()
  const { data: permits = [] } = useMyPermits(profile?.id)
  const { data: citations = [] } = useMyCitations(profile?.id)

  const activePermit = permits.find(p => p.status === 'Approved' || p.status === 'Active')
  const unpaidCitations = citations.filter(c => c.payment_status === 'Unpaid').length
  const pendingRefunds = citations.filter(c => c.refund_claim && c.refund_status === 'Pending').length

  return (
    <>
      <div className="page-header">
        <div className="page-title">Welcome back, {profile?.full_name?.split(' ')[0]}</div>
        <div className="page-sub">{profile?.neighborhood || 'Riverton'} · Account ID: {profile?.account_id}</div>
      </div>

      <div className="kpi-strip kpi-3">
        <div className="kpi-card green">
          <div className="kpi-val" style={{ color: 'var(--green)' }}>{permits.filter(p => p.status === 'Approved').length}</div>
          <div className="kpi-lbl">Active Permits</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{unpaidCitations}</div>
          <div className="kpi-lbl">Unpaid Citations</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-val" style={{ color: 'var(--gold)' }}>{pendingRefunds}</div>
          <div className="kpi-lbl">Pending Refunds</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Active Permit</div>
          {activePermit ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: 'var(--ice)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🚗</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{activePermit.permit_id}</div>
                  <div style={{ fontSize: 12, color: 'var(--mid)' }}>{activePermit.permit_type} · Zone {activePermit.zone}</div>
                </div>
                {statusBadge(activePermit.status)}
              </div>
              <div className="text-mid">Expires: {activePermit.expiry_date ? format(new Date(activePermit.expiry_date), 'MMM d, yyyy') : '—'}</div>
            </>
          ) : (
            <div>
              <p className="text-mid" style={{ marginBottom: 12 }}>No active permit. Apply now.</p>
              <Link to="/resident/apply" className="btn btn-primary btn-sm">+ Apply for Permit</Link>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Recent Citations</div>
          {citations.length === 0 ? (
            <p className="text-mid">No citations on record.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Violation</th><th>Fine</th><th>Status</th></tr></thead>
                <tbody>
                  {citations.slice(0, 5).map(c => (
                    <tr key={c.id}>
                      <td>{format(new Date(c.citation_date), 'MMM d')}</td>
                      <td>{c.violation_type}</td>
                      <td>${c.fine_amount}</td>
                      <td>{statusBadge(c.payment_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}