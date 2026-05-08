import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// ── Hooks ─────────────────────────────────────────────────────────────────
function useProfiles() {
  return useQuery({
    queryKey: ['profiles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function useUpdateProfileStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, active }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ active })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

function useAddProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      // ── 1. Sign up via public auth (no admin key needed) ──────────────────
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    formData.email,
        password: formData.password,
        options: {
          data: {
            full_name:    formData.full_name,
            role:         formData.role,
            neighborhood: formData.neighborhood,
          }
        }
      })
      if (authError) throw authError

      // ── 2. Insert profile row ─────────────────────────────────────────────
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id:           authData.user.id,
          email:        formData.email,
          full_name:    formData.full_name,
          mobile:       formData.mobile,
          role:         formData.role,
          neighborhood: formData.neighborhood,
          account_id:   'ACC-' + String(Math.floor(Math.random() * 99999)).padStart(5, '0'),
         
        }])
      if (profileError) throw profileError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

// ── Constants ─────────────────────────────────────────────────────────────
const NEIGHBORHOODS        = ['Downtown', 'Westside', 'Northgate', 'University District', 'Historic Quarter', 'Eastside']
const NEIGHBORHOODS_FILTER = ['All', ...NEIGHBORHOODS]

const ROLE_CONFIG = {
  resident: { color: '#1A56A0', bg: '#EBF2FF', label: 'Resident' },
  officer:  { color: '#1A7F4B', bg: '#E8F7EF', label: 'Officer'  },
  admin:    { color: '#B45309', bg: '#FEF3C7', label: 'Admin'    },
}

const TAB_CONFIG = {
  resident: { label: 'Residents', icon: '🏘️', accentColor: '#1A56A0' },
  officer:  { label: 'Officers',  icon: '👮', accentColor: '#1A7F4B' },
}

const EMPTY_FORM = {
  full_name: '', email: '', password: '', mobile: '', neighborhood: NEIGHBORHOODS[0],
}

// ── Small Components ──────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors   = ['#003DA5', '#1A7F4B', '#D94F3D', '#9B59B6', '#E07B00', '#2BA89A']
  const color    = colors[(name || '').charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, flexShrink: 0,
    }}>{initials}</div>
  )
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { color: '#6B7A99', bg: '#F0F4FA', label: role }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ active }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: active ? '#1A7F4B' : '#9B0000',
      background: active ? '#E8F7EF' : '#FEE2E2',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#1A7F4B' : '#D94F3D' }} />
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: '#fff', border: '2px solid #93C5E8', borderRadius: 14,
      padding: '14px 18px', borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6B7A99', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

// ── Confirm Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ profile, onConfirm, onCancel, loading }) {
  const isActive = profile.active !== false
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={() => !loading && onCancel()}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: '2px solid #93C5E8',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: isActive ? '#FEE2E2' : '#E8F7EF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>
            {isActive ? '🚫' : '✅'}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E' }}>
              {isActive ? 'Deactivate User' : 'Reactivate User'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7A99' }}>{profile.full_name}</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 20px' }}>
          {isActive
            ? `This will deactivate ${profile.full_name}'s account. They will lose access immediately.`
            : `This will reactivate ${profile.full_name}'s account and restore their access.`}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8, border: '1.5px solid #CBD5E1',
            background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#6B7A99',
          }}>Cancel</button>
          <button onClick={() => onConfirm(profile)} disabled={loading} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: isActive ? '#D94F3D' : '#1A7F4B', color: '#fff',
            fontSize: 13, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Saving…' : isActive ? 'Yes, Deactivate' : 'Yes, Reactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add User Modal ─────────────────────────────────────────────────────────
function AddUserModal({ role, accentColor, onClose }) {
  const { mutate: addProfile, isPending, isError, error } = useAddProfile()
  const [form, setForm]               = useState({ ...EMPTY_FORM })
  const [showPassword, setShowPassword] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const isValid = form.full_name.trim() && form.email.trim() && form.password.length >= 6 && form.neighborhood

  const handleSubmit = () => {
    if (!isValid || isPending) return
    addProfile({ ...form, role }, { onSuccess: onClose })
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none',
    boxSizing: 'border-box', background: '#fff',
  }
  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7A99',
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4,
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }} onClick={() => !isPending && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: 32, width: 500,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)', border: '2px solid #93C5E8',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            {role === 'resident' ? '🏘️' : '👮'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1A1A2E' }}>
              Add New {role === 'resident' ? 'Resident' : 'Officer'}
            </div>
            <div style={{ fontSize: 12, color: '#6B7A99' }}>
              Create a new {role} account
            </div>
          </div>
        </div>

        {/* Error */}
        {isError && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8,
            padding: '10px 14px', fontSize: 13, color: '#D94F3D', marginBottom: 16,
          }}>
            {error?.message || 'Something went wrong. Please try again.'}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Full Name *</label>
            <input
              placeholder="e.g. Jane Smith"
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              type="email"
              placeholder="e.g. jane@city.gov"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Password * (min 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Set initial password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                style={{ ...inputStyle, paddingRight: 44 }}
              />
              <button
                onClick={() => setShowPassword(s => !s)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6B7A99',
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Mobile</label>
            <input
              placeholder="e.g. 555-0101"
              value={form.mobile}
              onChange={e => set('mobile', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Neighborhood *</label>
            <select
              value={form.neighborhood}
              onChange={e => set('neighborhood', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>

        {/* Role display */}
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 8,
          background: '#F8FAFC', border: '1.5px solid #E2EAF4',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7A99', textTransform: 'uppercase' }}>Role:</span>
          <RoleBadge role={role} />
          <span style={{ fontSize: 11, color: '#6B7A99', marginLeft: 4 }}>(determined by current tab)</span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} disabled={isPending} style={{
            padding: '9px 20px', borderRadius: 8, border: '1.5px solid #CBD5E1',
            background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#6B7A99',
          }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isPending}
            style={{
              padding: '9px 24px', borderRadius: 8, border: 'none',
              background: isValid && !isPending ? accentColor : '#CBD5E1',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: isValid && !isPending ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            {isPending ? 'Creating…' : `Add ${role === 'resident' ? 'Resident' : 'Officer'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Table ─────────────────────────────────────────────────────────────
function UserTable({ role, accentColor, rawProfiles }) {
  const { mutate: updateStatus, isPending } = useUpdateProfileStatus()

  const [localProfiles, setLocalProfiles] = useState(() =>
    rawProfiles
      .filter(p => p.role === role)
      .map(p => ({ ...p, active: p.active ?? true }))
  )
  const [search, setSearch]           = useState('')
  const [neighFilter, setNeighFilter] = useState('All')
  const [sortKey, setSortKey]         = useState('full_name')
  const [sortDir, setSortDir]         = useState('asc')
  const [confirming, setConfirming]   = useState(null)
  const [showAdd, setShowAdd]         = useState(false)

  const totalActive   = localProfiles.filter(p => p.active !== false).length
  const totalInactive = localProfiles.length - totalActive

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const handleConfirm = (profile) => {
    const newActive = profile.active === false
    updateStatus(
      { id: profile.id, active: newActive },
      {
        onSuccess: () => {
          setLocalProfiles(ps => ps.map(p => p.id === profile.id ? { ...p, active: newActive } : p))
          setConfirming(null)
        },
      }
    )
  }

  const filtered = useMemo(() => {
    let rows = localProfiles.filter(p => {
      const matchSearch = !search
        || p.full_name?.toLowerCase().includes(search.toLowerCase())
        || p.email?.toLowerCase().includes(search.toLowerCase())
      const matchNeigh = neighFilter === 'All' || p.neighborhood === neighFilter
      return matchSearch && matchNeigh
    })
    return [...rows].sort((a, b) => {
      const av = (a[sortKey] ?? '').toString().toLowerCase()
      const bv = (b[sortKey] ?? '').toString().toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }, [localProfiles, search, neighFilter, sortKey, sortDir])

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <span style={{ color: '#CBD5E1', marginLeft: 3 }}>↕</span>
    return <span style={{ color: accentColor, marginLeft: 3 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const th = (label, col) => (
    <th key={label} onClick={() => col && handleSort(col)} style={{
      padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
      color: '#6B7A99', textTransform: 'uppercase', letterSpacing: '0.06em',
      background: '#F8FAFC', borderBottom: '2px solid #E2EAF4',
      cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      {label}{col && <SortIcon col={col} />}
    </th>
  )

  const td = {
    padding: '12px 14px', fontSize: 13, color: '#1A1A2E',
    borderBottom: '1px solid #F0F4FA', verticalAlign: 'middle',
  }

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Total"    value={localProfiles.length} sub="all accounts"         color={accentColor} />
        <StatCard label="Active"   value={totalActive}          sub="currently active"     color="#1A7F4B"     />
        <StatCard label="Inactive" value={totalInactive}        sub="deactivated accounts" color="#D94F3D"     />
      </div>

      {/* Table Card */}
      <div style={{ background: '#fff', border: '2px solid #93C5E8', borderRadius: 14, overflow: 'hidden' }}>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
          padding: '14px 20px', borderBottom: '1px solid #E2EAF4', background: '#FAFCFF',
        }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#93C5E8' }}>🔍</span>
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 12px 7px 30px', borderRadius: 8,
                border: '1.5px solid #CBD5E1', fontSize: 13, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select value={neighFilter} onChange={e => setNeighFilter(e.target.value)} style={{
            padding: '7px 12px', borderRadius: 8, border: '1.5px solid #CBD5E1',
            fontSize: 13, color: '#1A1A2E', background: '#fff', cursor: 'pointer',
          }}>
            {NEIGHBORHOODS_FILTER.map(n => <option key={n} value={n}>{n === 'All' ? 'All Neighborhoods' : n}</option>)}
          </select>

          <div style={{ fontSize: 12, color: '#6B7A99', fontWeight: 600 }}>
            {filtered.length} of {localProfiles.length} shown
          </div>

          <button
            onClick={() => setShowAdd(true)}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8, border: 'none',
              background: accentColor, color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            + Add {role === 'resident' ? 'Resident' : 'Officer'}
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7A99', fontSize: 14 }}>
              No users found matching your filters.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {th('User',         'full_name'   )}
                  {th('Role',         'role'        )}
                  {th('Neighborhood', 'neighborhood')}
                  {th('Mobile',       'mobile'      )}
                  {th('Account ID',   'account_id'  )}
                  {th('Joined',       'created_at'  )}
                  {th('Status',       'active'      )}
                  {th('Actions',      null          )}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const isActive = p.active !== false
                  return (
                    <tr key={p.id}
                      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      style={{ opacity: isActive ? 1 : 0.6, transition: 'background 0.1s, opacity 0.2s' }}
                    >
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={p.full_name} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                            <div style={{ fontSize: 11, color: '#6B7A99' }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={td}><RoleBadge role={p.role} /></td>
                      <td style={td}>{p.neighborhood || '—'}</td>
                      <td style={td}>{p.mobile || '—'}</td>
                      <td style={td}>
                        <code style={{ fontSize: 11, background: '#F0F4FA', padding: '2px 6px', borderRadius: 4 }}>
                          {p.account_id || '—'}
                        </code>
                      </td>
                      <td style={td}>
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td style={td}><StatusBadge active={isActive} /></td>
                      <td style={td}>
                        <button
                          onClick={() => setConfirming(p)}
                          style={{
                            padding: '6px 14px', borderRadius: 7, border: 'none',
                            background: isActive ? '#FEE2E2' : '#E8F7EF',
                            color: isActive ? '#D94F3D' : '#1A7F4B',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer',
                          }}
                        >
                          {isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirming && (
        <ConfirmModal
          profile={confirming}
          onConfirm={handleConfirm}
          onCancel={() => !isPending && setConfirming(null)}
          loading={isPending}
        />
      )}

      {showAdd && (
        <AddUserModal
          role={role}
          accentColor={accentColor}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function UserManagement() {
  const { data: rawProfiles = [], isLoading, isError } = useProfiles()
  const [tab, setTab] = useState('resident')

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#6B7A99', fontSize: 14 }}>
      Loading users…
    </div>
  )

  if (isError) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#D94F3D', fontSize: 14 }}>
      Failed to load users. Please refresh.
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div className="page-header">
        <div className="page-title">👥 Users</div>
        <div className="page-sub">Manage resident and officer accounts</div>
      </div>

      {/* Tabs — no position/zIndex so modals always sit on top */}
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
              {rawProfiles.filter(p => p.role === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content — no position/zIndex */}
      <div style={{
        border: '2px solid #93C5E8', borderRadius: '0 12px 12px 12px',
        padding: 20, background: '#F8FAFC',
      }}>
        {Object.entries(TAB_CONFIG).map(([key, { accentColor }]) =>
          tab === key ? (
            <UserTable key={key} role={key} accentColor={accentColor} rawProfiles={rawProfiles} />
          ) : null
        )}
      </div>
    </div>
  )
}