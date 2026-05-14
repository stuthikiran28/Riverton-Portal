import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useMyCitations, useUpdateCitation } from '../../hooks/useCitations'
import { statusBadge } from '../../components/ui/Badge'
import { showNotification } from '../../components/ui/Notification'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

// ── Citation Lightbox ──────────────────────────────────────────────────────
function CitationLightbox({ citation, onClose }) {
  const [paying, setPaying] = useState(false)
  const [disputing, setDisputing] = useState(false)
  const queryClient = useQueryClient()

  if (!citation) return null

  async function markPaid(method) {
    setPaying(true)
    try {
      const { error } = await supabase
        .from('citations')
        .update({ payment_status: 'Paid' })
        .eq('id', citation.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['citations'] })
      showNotification(`${citation.citation_id} marked as paid via ${method}.`, 'success')
      onClose()
    } catch (err) {
      showNotification(`Payment failed: ${err.message}`, 'error')
    } finally {
      setPaying(false)
    }
  }

  async function handleDispute() {
    setDisputing(true)
    try {
      const { error } = await supabase
        .from('citations')
        .update({ refund_claim: true, refund_status: 'Pending' })
        .eq('id', citation.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['citations'] })
      showNotification(`Dispute filed for ${citation.citation_id}.`, 'info')
      onClose()
    } catch (err) {
      showNotification(`Dispute failed: ${err.message}`, 'error')
    } finally {
      setDisputing(false)
    }
  }

  const showPaymentOptions =
    citation.payment_status === 'Unpaid' ||
    (citation.refund_status === 'Denied' && citation.payment_status !== 'Paid')

  const showDeniedWarning =
    citation.refund_status === 'Denied' && citation.payment_status !== 'Paid'

  const paymentMethods = [
    ['💳', 'Card',   'Pay with credit or debit card'],
    ['🏦', 'Bank',   'Pay via bank transfer'],
    ['📱', 'PayPal', 'Pay with PayPal'],
  ]

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          background: 'var(--white, #fff)', borderRadius: 12,
          width: '100%', maxWidth: 560,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: '1px solid var(--border, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border, #e2e8f0)',
          background: 'var(--light, #f8fafc)',
          borderRadius: '12px 12px 0 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Citation Details</span>
            <code style={{
              background: 'var(--ice, #e6f1fb)', color: 'var(--navy, #003DA5)',
              padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
            }}>
              {citation.citation_id}
            </code>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, color: 'var(--mid, #4a5568)',
            lineHeight: 1, padding: '2px 6px', borderRadius: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>

          <SectionLabel>Citation Information</SectionLabel>
          <DetailGrid items={[
            ['Citation ID',   citation.citation_id],
            ['Officer',       citation.officer_id    || '—'],
            ['Date',          citation.citation_date ? format(new Date(citation.citation_date), 'MMM d, yyyy') : '—'],
            ['Violation',     citation.violation_type || '—'],
            ['Zone',          citation.zone           || '—'],
            ['Vehicle Plate', citation.vehicle_plate  || '—'],
            ['Sync Delay',    citation.sync_delay_hours ? `${citation.sync_delay_hours} hrs` : '—'],
            ['Wrongful',      citation.wrongful_flag ? 'Yes' : 'No'],
          ]} />

          <SectionLabel>Payment Information</SectionLabel>
          <DetailGrid items={[
            ['Payment Status', statusBadge(citation.payment_status)],
            ['Refund Claim',   citation.refund_claim ? 'Yes' : 'No'],
            ['Refund Status',  citation.refund_status ? statusBadge(citation.refund_status) : '—'],
          ]} />

          {/* Dispute option — only when unpaid and no claim yet */}
          {!citation.refund_claim && citation.payment_status === 'Unpaid' && (
            <>
              <SectionLabel>Dispute This Citation</SectionLabel>
              <div style={{
                padding: '14px 16px', borderRadius: 8, marginBottom: 12,
                background: '#FFF8EC', border: '1px solid #F5A623',
                color: '#7A4800', fontSize: 13,
              }}>
                ⚠️ If you believe this citation was issued in error, you can raise a dispute.
                A refund claim will be filed and reviewed by the admin.
              </div>
              <button
                className="btn btn-secondary"
                disabled={disputing}
                onClick={handleDispute}
                style={{ width: '100%', justifyContent: 'center', marginBottom: 16 }}
              >
                {disputing ? 'Filing dispute…' : 'Raise Dispute'}
              </button>
            </>
          )}

          {/* Payment options — unpaid or dispute denied */}
          {showPaymentOptions && (
            <>
              <SectionLabel>Payment Options</SectionLabel>
              {showDeniedWarning && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                  background: '#FCEBEB', border: '1px solid #F09595',
                  color: '#791F1F', fontSize: 12,
                }}>
                  ⚠️ Your dispute was denied. Please pay the original fine to avoid further penalties.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paymentMethods.map(([icon, method, desc]) => (
                  <div key={method} style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 8,
                    border: '1px solid var(--border, #e2e8f0)',
                    background: 'var(--light, #f8fafc)',
                  }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{method}</div>
                      <div style={{ fontSize: 11, color: 'var(--mid, #4a5568)' }}>{desc}</div>
                    </div>
                    <button
                      className="btn btn-success btn-sm"
                      disabled={paying}
                      onClick={() => markPaid(method)}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {paying ? 'Processing…' : 'Pay'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Disputed pending */}
          {citation.refund_claim && citation.refund_status === 'Pending' && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#FFF8EC', border: '1px solid #F5A623',
              color: '#7A4800', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⏳ Dispute is under review. No payment required until resolved.
            </div>
          )}

          {/* Paid */}
          {citation.payment_status === 'Paid' && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#E8F8F0', border: '1px solid #27AE60',
              color: '#1a6b3e', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✅ This citation has been paid in full.
            </div>
          )}

          {/* Waived */}
          {citation.payment_status === 'Waived' && (
            <div style={{
              padding: '12px 16px', borderRadius: 8,
              background: '#EEF2FF', border: '1px solid #7B5EA7',
              color: '#4a2d8a', fontWeight: 600, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              🟣 This citation has been waived.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          padding: '14px 20px',
          borderTop: '1px solid var(--border, #e2e8f0)',
          background: 'var(--light, #f8fafc)',
          borderRadius: '0 0 12px 12px',
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.6px', color: 'var(--mid, #4a5568)',
      marginBottom: 12, paddingBottom: 6,
      borderBottom: '1px solid var(--border, #e2e8f0)',
    }}>
      {children}
    </p>
  )
}

function DetailGrid({ items }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: '12px 24px', marginBottom: 20,
    }}>
      {items.map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: 11, color: 'var(--mid, #4a5568)', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark, #0d1b2a)' }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function MyCitations() {
  const { profile } = useAuth()
  const { data: citations = [], isLoading, isError, error } = useMyCitations(profile?.id)
  const [selected, setSelected] = useState(null)

  if (isError) return (
    <div style={{ padding: 24, color: 'red' }}>
      <strong>Error:</strong> {error?.message}
    </div>
  )

  return (
    <>
      <CitationLightbox
        citation={selected}
        onClose={() => setSelected(null)}
      />

      <div className="page-header flex-between">
        <div>
          <div className="page-title">My Citations</div>
          <div className="page-sub">
            {citations.length} citation{citations.length !== 1 ? 's' : ''} on record
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Citation ID</th><th>Vehicle</th><th>Violation</th><th>Zone</th>
                <th>Date</th><th>Amount</th><th>Payment</th><th>Dispute</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Loading…</td></tr>
              ) : citations.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>No citations on record.</td></tr>
              ) : citations.map(c => (
                <tr key={c.id}>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelected(c) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--navy)', fontFamily: 'monospace',
                        fontSize: 13, fontWeight: 600,
                        textDecoration: 'underline', padding: 0,
                      }}
                    >
                      {c.citation_id}
                    </button>
                  </td>
                  <td>{c.vehicle_plate  || '—'}</td>
                  <td>{c.violation_type || '—'}</td>
                  <td>{c.zone          || '—'}</td>
                  <td>{c.citation_date ? format(new Date(c.citation_date), 'MMM d, yyyy') : '—'}</td>
                  <td>{c.fine_amount != null ? `$${Number(c.fine_amount).toLocaleString()}` : '—'}</td>
                  <td>{statusBadge(c.payment_status)}</td>
                  <td>
                    {c.refund_claim && c.refund_status === 'Pending' &&
                      <span className="badge badge-warn">Disputed</span>}
                    {c.refund_claim && c.refund_status === 'Denied' &&
                      <span className="badge badge-danger">Dispute Denied</span>}
                    {!c.refund_claim && c.payment_status === 'Unpaid' &&
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelected(c)}>Dispute</button>}
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