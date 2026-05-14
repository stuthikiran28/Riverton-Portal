import { useAllPermitsFull }   from '../../hooks/usePermits'
import { useAllCitationsFull } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'

export default function Overview() {
  // Full-fetch hooks — loop through all pages, return plain arrays
  // Accurate counts across all 1800+ records, not just first 50
  const { data: permits   = [] } = useAllPermitsFull()
  const { data: citations = [] } = useAllCitationsFull()

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
          <div className="kpi-val">{permits.length.toLocaleString()}</div>
          <div className="kpi-lbl">Total Permits</div>
        </div>
        <div className="kpi-card gold">
          <div className="kpi-val" style={{ color: 'var(--gold)' }}>{pending.toLocaleString()}</div>
          <div className="kpi-lbl">Pending Review</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-val" style={{ color: 'var(--green)' }}>{approved.toLocaleString()}</div>
          <div className="kpi-lbl">Approved Permits</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-val" style={{ color: 'var(--red)' }}>{unpaid.toLocaleString()}</div>
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