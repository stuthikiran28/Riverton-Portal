import { useAuth } from '../../contexts/AuthContext'
import { useMyPermits } from '../../hooks/usePermits'
import { statusBadge } from '../../components/ui/Badge'
import { format } from 'date-fns'

export default function MyPermits() {
  const { profile } = useAuth()
  const { data: permits = [], isLoading } = useMyPermits(profile?.id)

  return (
    <>
      <div className="page-header">
        <div className="page-title">My Permits</div>
        <div className="page-sub">{permits.length} permit{permits.length !== 1 ? 's' : ''} on file</div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Permit ID</th><th>Type</th><th>Zone</th><th>Submitted</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : permits.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24 }}>No permits found.</td></tr>
              ) : permits.map(p => (
                <tr key={p.id}>
                  <td><code>{p.permit_id}</code></td>
                  <td>{p.permit_type}</td>
                  <td>{p.zone}</td>
                  <td>{p.submission_date ? format(new Date(p.submission_date), 'MMM d, yyyy') : '—'}</td>
                  <td>{p.expiry_date ? format(new Date(p.expiry_date), 'MMM d, yyyy') : '—'}</td>
                  <td>{statusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}