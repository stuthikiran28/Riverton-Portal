import { useAllPermits, useUpdatePermitStatus } from '../../hooks/usePermits'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'

export default function ManagePermits() {
  const { data: permits = [], isLoading } = useAllPermits()
  const updateStatus = useUpdatePermitStatus()
  const pending = permits.filter(p => p.status === 'Pending')

  async function approve(permit) {
    await updateStatus.mutateAsync({ id: permit.id, status: 'Approved' })
    showNotification(`Permit ${permit.permit_id} approved.`, 'success')
  }

  async function deny(permit) {
    await updateStatus.mutateAsync({ id: permit.id, status: 'Denied' })
    showNotification(`Permit ${permit.permit_id} denied.`, '')
  }

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Manage Permits</div>
          <div className="page-sub">{pending.length} pending review</div>
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Permit ID</th><th>Applicant</th><th>Type</th><th>Zone</th><th>Submitted</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : permits.map(p => (
                <tr key={p.id}>
                  <td><code>{p.permit_id}</code></td>
                  <td>{p.profiles?.full_name || '—'}</td>
                  <td>{p.permit_type}</td>
                  <td>{p.zone}</td>
                  <td>{p.submission_date ? format(new Date(p.submission_date), 'MMM d, yyyy') : '—'}</td>
                  <td>{statusBadge(p.status)}</td>
                  <td>
                    {p.status === 'Pending' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm" onClick={() => approve(p)}>Approve</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => deny(p)}>Deny</button>
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