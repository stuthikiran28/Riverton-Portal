import { useAuth } from '../../contexts/AuthContext'
import { useMyCitations } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'

export default function RefundClaims() {
  const { profile } = useAuth()
  const { data: citations = [], isLoading } = useMyCitations(profile?.id)
  const refunds = citations.filter(c => c.refund_claim)

  return (
    <>
      <div className="page-header">
        <div className="page-title">Refund Claims</div>
        <div className="page-sub">{refunds.length} claim{refunds.length !== 1 ? 's' : ''} submitted</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Citation ID</th><th>Date</th><th>Violation</th><th>Fine</th><th>Refund Status</th><th>Refund Amount</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No refund claims filed.</td></tr>
              ) : refunds.map(c => (
                <tr key={c.id}>
                  <td><code>{c.citation_id}</code></td>
                  <td>{format(new Date(c.citation_date), 'MMM d, yyyy')}</td>
                  <td>{c.violation_type}</td>
                  <td>${c.fine_amount}</td>
                  <td>{statusBadge(c.refund_status || 'Pending')}</td>
                  <td>${c.refund_amount || '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}