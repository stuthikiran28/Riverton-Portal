import { useAllPermits } from '../../hooks/usePermits'
import { useAllCitations } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'

export default function Overview() {
  const { data: permits = [] } = useAllPermits()
  const { data: citations = [] } = useAllCitations()

  const pending  = permits.filter(p => p.status === 'Pending').length
  const approved = permits.filter(p => p.status === 'Approved').length
  const unpaid   = citations.filter(c => c.payment_status === 'Unpaid').length
  const disputes = citations.filter(c => c.refund_claim && c.refund_status === 'Pending').length

  return (
    <>
      <div className="page-header">
        <div className="page-title">Admin Overview</div>
        <div className="page-sub">System-wide summary</div>
      </div>

      <div className="kpi-strip kpi-4">
        <div className="kpi-card">
          <div className="kpi-val">{permits.length}</div>
          <div className="kpi-lbl">Total Permits</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-val" style={{ color: 'var(--gold)' }}>{pending}</div>
          <div className="kpi-lbl">Pending Review</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-val" style={{ color: 'var(--green)' }}>{approved}</div>
          <div className="kpi-lbl">Approved Permits</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{unpaid}</div>
          <div className="kpi-lbl">Unpaid Citations</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Recent Permits</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Type</th><th>Status</th></tr></thead>
              <tbody>
                {permits.slice(0, 6).map(p => (
                  <tr key={p.id}>
                    <td><code>{p.permit_id}</code></td>
                    <td>{p.permit_type}</td>
                    <td>{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Recent Citations</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Violation</th><th>Status</th></tr></thead>
              <tbody>
                {citations.slice(0, 6).map(c => (
                  <tr key={c.id}>
                    <td><code>{c.citation_id}</code></td>
                    <td>{c.violation_type}</td>
                    <td>{statusBadge(c.payment_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}