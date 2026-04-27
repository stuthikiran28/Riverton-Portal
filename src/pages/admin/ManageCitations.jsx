import { useAllCitations, useUpdateCitation } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'

export default function ManageCitations() {
  const { data: citations = [], isLoading } = useAllCitations()
  const update = useUpdateCitation()

  async function waive(citation) {
    await update.mutateAsync({ id: citation.id, payment_status: 'Waived' })
    showNotification(`Citation ${citation.citation_id} waived.`, 'success')
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Manage Citations</div>
        <div className="page-sub">{citations.length} total citations</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Citation ID</th><th>Date</th><th>Plate</th><th>Violation</th><th>Fine</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : citations.map(c => (
                <tr key={c.id}>
                  <td><code>{c.citation_id}</code></td>
                  <td>{format(new Date(c.citation_date), 'MMM d, yyyy')}</td>
                  <td><code>{c.vehicle_plate}</code></td>
                  <td>{c.violation_type}</td>
                  <td>${c.fine_amount}</td>
                  <td>{statusBadge(c.payment_status)}</td>
                  <td>
                    {c.payment_status === 'Unpaid' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => waive(c)}>Waive</button>
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