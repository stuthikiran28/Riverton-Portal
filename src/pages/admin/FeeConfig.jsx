// src/pages/admin/FeeConfig.jsx
import { useState } from 'react'
import {
  useFeeConfig,
  useUpdateFee,
  useAddFee,
  useDeleteFee,
} from '../../hooks/useFeeConfig'

// ── Constants ─────────────────────────────────────────────────────────────
const TAB_CONFIG = {
  permit:   { label: 'Permit Fees',    icon: '🗂️', accentColor: '#003DA5', prefix: '$' },
  citation: { label: 'Citation Fines', icon: '🚨', accentColor: '#D94F3D', prefix: '$' },
}

// ── Small components ──────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '2px solid #93C5E8',
      borderTop: `4px solid ${color}`, borderRadius: 14, padding: '14px 18px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ── Add Row Modal ─────────────────────────────────────────────────────────
function AddModal({ type, accentColor, onClose }) {
  const { mutate: addFee, isPending, isError, error } = useAddFee()
  const [permit_or_violation, setViolationType] = useState('')
  const [fee_amount, setFeeAmount]         = useState('')

  const isValid = permit_or_violation.trim() && fee_amount !== '' && Number(fee_amount) >= 0

  const handleSubmit = () => {
    if (!isValid || isPending) return
    addFee({ type, permit_or_violation: permit_or_violation.trim(), fee_amount }, { onSuccess: onClose })
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7A99',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={() => !isPending && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)', border: '2px solid #93C5E8',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {TAB_CONFIG[type].icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E' }}>
              Add New {type === 'permit' ? 'Permit Fee' : 'Citation Fine'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7A99' }}>New row in {TAB_CONFIG[type].label}</div>
          </div>
        </div>

        {isError && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '9px 13px', fontSize: 13, color: '#D94F3D', marginBottom: 14 }}>
            {error?.message || 'Something went wrong.'}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>{type === 'permit' ? 'Permit Type' : 'Violation Type'} *</label>
          <input
            placeholder={type === 'permit' ? 'e.g. Commercial' : 'e.g. Blocked Driveway'}
            value={permit_or_violation}
            onChange={e => setViolationType(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Fee Amount ($) *</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 45"
            value={fee_amount}
            onChange={e => setFeeAmount(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} disabled={isPending} style={{
            padding: '8px 18px', borderRadius: 8, border: '1.5px solid #CBD5E1',
            background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#6B7A99',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!isValid || isPending} style={{
            padding: '8px 20px', borderRadius: 8, border: 'none',
            background: isValid && !isPending ? accentColor : '#CBD5E1',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: isValid && !isPending ? 'pointer' : 'not-allowed',
          }}>
            {isPending ? 'Adding…' : 'Add Row'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────
function DeleteModal({ row, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={() => !loading && onCancel()}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: 26, width: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '2px solid #93C5E8',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 10 }}>🗑️ Delete Row</div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
          Are you sure you want to delete <strong>{row.permit_or_violation}</strong> (${row.fee_amount})?
          This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={{
            padding: '7px 16px', borderRadius: 8, border: '1.5px solid #CBD5E1',
            background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#6B7A99',
          }}>Cancel</button>
          <button onClick={() => onConfirm(row.id)} disabled={loading} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none',
            background: '#D94F3D', color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Fee Table ─────────────────────────────────────────────────────────────
function FeeTable({ type, rows, accentColor }) {
  const { mutate: updateFee, isPending: updating } = useUpdateFee()
  const { mutate: deleteFee, isPending: deleting }  = useDeleteFee()

  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState({})
  const [showAdd, setShowAdd]       = useState(false)
  const [deletingRow, setDeletingRow] = useState(null)

  const startEdit = (row) => {
    setEditingId(row.id)
    setEditForm({ permit_or_violation: row.permit_or_violation, fee_amount: row.fee_amount })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm({}) }

  const saveEdit = (id) => {
    if (!editForm.permit_or_violation.trim() || editForm.fee_amount === '') return
    updateFee(
      { id, permit_or_violation: editForm.permit_or_violation.trim(), fee_amount: editForm.fee_amount },
      { onSuccess: cancelEdit }
    )
  }

  const handleDelete = (id) => {
    deleteFee(id, { onSuccess: () => setDeletingRow(null) })
  }

  const total    = rows.length
  const avgFee   = rows.length ? (rows.reduce((s, r) => s + Number(r.fee_amount), 0) / rows.length).toFixed(0) : 0
  const maxFee   = rows.length ? Math.max(...rows.map(r => Number(r.fee_amount))) : 0

  const tdStyle  = { padding: '11px 14px', fontSize: 13, color: '#1A1A2E', borderBottom: '1px solid #F0F4FA', verticalAlign: 'middle' }
  const thStyle  = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F8FAFC', borderBottom: '2px solid #E2EAF4' }
  const editInput = { padding: '6px 10px', borderRadius: 7, border: `1.5px solid ${accentColor}`, fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        <StatCard label="Total Types" value={total}      color={accentColor} />
        <StatCard label="Average Fee" value={`$${avgFee}`} color="#1A7F4B"  />
        <StatCard label="Highest Fee" value={`$${maxFee}`} color="#E07B00"  />
      </div>

      {/* Table card */}
      <div style={{ background: '#fff', border: '2px solid #93C5E8', borderRadius: 14, overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 18px', borderBottom: '1px solid #E2EAF4', background: '#FAFCFF',
        }}>
          <div style={{ fontSize: 13, color: '#6B7A99', fontWeight: 600 }}>
            {total} {type === 'permit' ? 'permit types' : 'violation types'}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: accentColor, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Add New Row
          </button>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              <th style={thStyle}>{type === 'permit' ? 'Permit Type' : 'Violation Type'}</th>
              <th style={thStyle}>Fee Amount</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isEditing = editingId === row.id
              return (
                <tr key={row.id}
                  onMouseEnter={e => { if (!isEditing) e.currentTarget.style.background = '#F8FAFC' }}
                  onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                  style={{ background: isEditing ? '#F0F7FF' : 'transparent', transition: 'background 0.1s' }}
                >
                  {/* Index */}
                  <td style={{ ...tdStyle, width: 40, color: '#6B7A99', fontWeight: 600 }}>{i + 1}</td>

                  {/* Violation type */}
                  <td style={tdStyle}>
                    {isEditing ? (
                      <input
                        value={editForm.permit_or_violation}
                        onChange={e => setEditForm(f => ({ ...f, permit_or_violation: e.target.value }))}
                        style={editInput}
                        autoFocus
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{row.permit_or_violation}</span>
                    )}
                  </td>

                  {/* Fee amount */}
                  <td style={tdStyle}>
                    {isEditing ? (
                      <div style={{ position: 'relative', maxWidth: 120 }}>
                        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7A99', fontWeight: 700 }}>$</span>
                        <input
                          type="number"
                          min="0"
                          value={editForm.fee_amount}
                          onChange={e => setEditForm(f => ({ ...f, fee_amount: e.target.value }))}
                          style={{ ...editInput, paddingLeft: 22 }}
                        />
                      </div>
                    ) : (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontWeight: 700, fontSize: 14, color: accentColor,
                      }}>
                        ${Number(row.fee_amount).toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ ...tdStyle, textAlign: 'right' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={cancelEdit} style={{
                          padding: '5px 12px', borderRadius: 6, border: '1.5px solid #CBD5E1',
                          background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600, color: '#6B7A99',
                        }}>Cancel</button>
                        <button onClick={() => saveEdit(row.id)} disabled={updating} style={{
                          padding: '5px 14px', borderRadius: 6, border: 'none',
                          background: accentColor, color: '#fff',
                          fontSize: 12, fontWeight: 700,
                          cursor: updating ? 'not-allowed' : 'pointer',
                          opacity: updating ? 0.7 : 1,
                        }}>
                          {updating ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => startEdit(row)} style={{
                          padding: '5px 14px', borderRadius: 6,
                          border: `1.5px solid ${accentColor}`,
                          background: '#fff', color: accentColor,
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>✏️ Edit</button>
                        <button onClick={() => setDeletingRow(row)} style={{
                          padding: '5px 12px', borderRadius: 6, border: 'none',
                          background: '#FEE2E2', color: '#D94F3D',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        }}>🗑️</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#6B7A99', padding: 40 }}>
                  No rows yet. Click "+ Add New Row" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddModal
          type={type}
          accentColor={accentColor}
          onClose={() => setShowAdd(false)}
        />
      )}

      {deletingRow && (
        <DeleteModal
          row={deletingRow}
          onConfirm={handleDelete}
          onCancel={() => setDeletingRow(null)}
          loading={deleting}
        />
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function FeeConfig() {
  const { data: allRows = [], isLoading, isError } = useFeeConfig()
  const [tab, setTab] = useState('permit')

  const permitRows   = allRows.filter(r => r.type === 'permit')
  const citationRows = allRows.filter(r => r.type === 'citation')

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#6B7A99', fontSize: 14 }}>
      Loading fee configuration…
    </div>
  )

  if (isError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#D94F3D', fontSize: 14 }}>
      Failed to load fee config. Please refresh.
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit' }}>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">⚙️ Fee Configuration</div>
        <div className="page-sub">Manage permit fees and citation fine amounts</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Object.entries(TAB_CONFIG).map(([key, { label, icon, accentColor }]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 24px', borderRadius: '10px 10px 0 0',
            border: '2px solid #93C5E8',
            borderBottom: tab === key ? '2px solid #fff' : '2px solid #93C5E8',
            background: tab === key ? '#fff' : '#F0F4FA',
            color: tab === key ? accentColor : '#6B7A99',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>
            {icon} {label}
            <span style={{
              padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              background: tab === key ? accentColor : '#CBD5E1', color: '#fff',
            }}>
              {key === 'permit' ? permitRows.length : citationRows.length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        border: '2px solid #93C5E8', borderRadius: '0 12px 12px 12px',
        padding: 20, background: '#F8FAFC',
      }}>
        {tab === 'permit' ? (
          <FeeTable key="permit"   type="permit"   rows={permitRows}   accentColor="#003DA5" />
        ) : (
          <FeeTable key="citation" type="citation" rows={citationRows} accentColor="#D94F3D" />
        )}
      </div>
    </div>
  )
}