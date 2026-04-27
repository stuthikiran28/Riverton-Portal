import { useAllCitations, useUpdateCitation } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'

export default function Refunds() {
  const { data: citations = [], isLoading } = useAllCitations()
  const update = useUpdateCitation()
  const refunds = citations.filter(c => c.refund_claim)

  async function approveRefund(c) {
    await update.mutateAsync({ id: c.id, refund_status: 'Approved', refund_amount: c.fine_amount, payment_status: 'Waived' })
    showNotification(`Refund approved for ${c.citation_id}.`, 'success')
  }

  async function denyRefund(c) {
    await update.mutateAsync({ id: c.id, refund_status: 'Denied' })
    showNotification(`Refund denied for ${c.citation_id}.`, '')
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Refund Claims</div>
        <div className="page-sub">{refunds.filter(r => r.refund_status === 'Pending').length} pending review</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Citation ID</th><th>Date</th><th>Violation</th><th>Fine</th><th>Refund Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No refund claims.</td></tr>
              ) : refunds.map(c => (
                <tr key={c.id}>
                  <td><code>{c.citation_id}</code></td>
                  <td>{format(new Date(c.citation_date), 'MMM d, yyyy')}</td>
                  <td>{c.violation_type}</td>
                  <td>${c.fine_amount}</td>
                  <td>{statusBadge(c.refund_status || 'Pending')}</td>
                  <td>
                    {c.refund_status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => approveRefund(c)}>Approve</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => denyRefund(c)}>Deny</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}