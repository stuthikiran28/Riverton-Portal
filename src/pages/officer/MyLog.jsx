import { useAuth } from '../../contexts/AuthContext'
import { useOfficerCitations } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'

export default function MyLog() {
  const { profile } = useAuth()
  const { data: citations = [], isLoading } = useOfficerCitations(profile?.id)

  return (
    <>
      <div className="page-header">
        <div className="page-title">My Citation Log</div>
        <div className="page-sub">{citations.length} citation{citations.length !== 1 ? 's' : ''} issued</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Citation ID</th><th>Date</th><th>Plate</th><th>Violation</th><th>Fine</th><th>Status</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : citations.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No citations issued yet.</td></tr>
              ) : citations.map(c => (
                <tr key={c.id}>
                  <td><code>{c.citation_id}</code></td>
                  <td>{format(new Date(c.citation_date), 'MMM d, yyyy')}</td>
                  <td><code>{c.vehicle_plate}</code></td>
                  <td>{c.violation_type}</td>
                  <td>${c.fine_amount}</td>
                  <td>{statusBadge(c.payment_status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}