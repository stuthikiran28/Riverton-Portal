import { useState } from 'react'
import { useAllPermits, useUpdatePermitStatus, PERMITS_PAGE_SIZE } from '../../hooks/usePermits'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'

/* ── Pagination bar ───────────────────────────────────────────── */
function Pagination({ page, totalPages, total, onPage }) {
  const start = page * PERMITS_PAGE_SIZE + 1
  const end   = Math.min((page + 1) * PERMITS_PAGE_SIZE, total)

  const pages = []
  for (let i = 0; i < totalPages; i++) {
    if (i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 2) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderTop: '1px solid #E8EFF8',
      flexWrap: 'wrap', gap: 8,
    }}>
      <span style={{ fontSize: 13, color: '#6B7A99' }}>
        Showing <strong>{start}–{end}</strong> of <strong>{total.toLocaleString()}</strong> permits
      </span>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={() => onPage(page - 1)} disabled={page === 0} style={btnStyle(false, page === 0)}>‹</button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} style={{ padding: '0 4px', color: '#94A3B8', fontSize: 13 }}>…</span>
            : <button key={p} onClick={() => onPage(p)} style={btnStyle(p === page, false)}>{p + 1}</button>
        )}
        <button onClick={() => onPage(page + 1)} disabled={page >= totalPages - 1} style={btnStyle(false, page >= totalPages - 1)}>›</button>
      </div>
    </div>
  )
}

function btnStyle(active, disabled) {
  return {
    minWidth: 32, height: 32, borderRadius: 6, border: '1px solid',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 13, fontWeight: active ? 700 : 400,
    background:  active ? '#1A56A0' : '#fff',
    color:       active ? '#fff'    : disabled ? '#CBD5E1' : '#334155',
    borderColor: active ? '#1A56A0' : '#D0E4F8',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s',
  }
}

/* ── Main component ───────────────────────────────────────────── */
export default function ManagePermits() {
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching } = useAllPermits(page)
  const permits    = data?.rows  ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / PERMITS_PAGE_SIZE)
  const pending    = permits.filter(p => p.status === 'Pending').length

  const updateStatus = useUpdatePermitStatus()

  async function approve(permit) {
    await updateStatus.mutateAsync({ id: permit.id, status: 'Approved' })
    showNotification(`Permit ${permit.permit_id} approved.`, 'success')
  }

  async function deny(permit) {
    await updateStatus.mutateAsync({ id: permit.id, status: 'Denied' })
    showNotification(`Permit ${permit.permit_id} denied.`, '')
  }

  function handlePage(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Manage Permits</div>
          <div className="page-sub">
            {isLoading
              ? 'Loading…'
              : `${total.toLocaleString()} total · ${pending} pending on this page`}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isFetching && !isLoading && (
          <div style={{
            padding: '6px 16px', background: '#EBF4FF', fontSize: 12,
            color: '#1A56A0', fontWeight: 600, borderBottom: '1px solid #BDD9F5',
          }}>
            Loading page {page + 1}…
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Permit ID</th><th>Applicant</th><th>Type</th>
                <th>Zone</th><th>Submitted</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : permits.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No permits found.</td></tr>
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
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => approve(p)}
                          disabled={updateStatus.isPending}
                        >Approve</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deny(p)}
                          disabled={updateStatus.isPending}
                        >Deny</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} total={total} onPage={handlePage} />
        )}
      </div>
    </>
  )
}