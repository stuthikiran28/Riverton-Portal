import { useState } from 'react'
import { useAllCitations, useUpdateCitation, CITATIONS_PAGE_SIZE } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'

/* ── Pagination bar ───────────────────────────────────────────── */
function Pagination({ page, totalPages, total, onPage }) {
  const start = page * CITATIONS_PAGE_SIZE + 1
  const end   = Math.min((page + 1) * CITATIONS_PAGE_SIZE, total)

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
        Showing <strong>{start}–{end}</strong> of <strong>{total.toLocaleString()}</strong> citations
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
export default function ManageCitations() {
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching } = useAllCitations(page)
  const citations  = data?.rows  ?? []
  const total      = data?.total ?? 0
  const totalPages = Math.ceil(total / CITATIONS_PAGE_SIZE)

  const update = useUpdateCitation()

  async function waive(citation) {
    await update.mutateAsync({ id: citation.id, payment_status: 'Waived' })
    showNotification(`Citation ${citation.citation_id} waived.`, 'success')
  }

  function handlePage(p) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Manage Citations</div>
        <div className="page-sub">
          {isLoading ? 'Loading…' : `${total.toLocaleString()} total citations`}
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
                <th>Citation ID</th><th>Date</th><th>Plate</th>
                <th>Violation</th><th>Fine</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : citations.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No citations found.</td></tr>
              ) : citations.map(c => (
                <tr key={c.id}>
                  <td><code>{c.citation_id}</code></td>
                  <td>{format(new Date(c.citation_date), 'MMM d, yyyy')}</td>
                  <td><code>{c.vehicle_plate}</code></td>
                  <td>{c.violation_type}</td>
                  <td>${Number(c.fine_amount).toLocaleString()}</td>
                  <td>{statusBadge(c.payment_status)}</td>
                  <td>
                    {c.payment_status === 'Unpaid' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => waive(c)}
                        disabled={update.isPending}
                      >Waive</button>
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