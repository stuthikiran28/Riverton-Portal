import { useAllPermits } from '../../hooks/usePermits'
import { useAllCitations } from '../../hooks/useCitations'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, Line, ComposedChart, Cell, LabelList
} from 'recharts'

const CARD_STYLE = {
  background: '#fff',
  border: '2px solid #93C5E8',
  borderRadius: 16,
  padding: '20px 24px',
}

const KPI_LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 4,
}

const CHART_TITLE_STYLE = {
  fontSize: 15,
  fontWeight: 700,
  color: '#1A56A0',
  marginBottom: 8,
}

const VIOLATION_COLORS = ['#4472C4', '#ED7D31', '#9B59B6', '#9DC63B', '#2BA89A']
const LATENCY_COLORS  = ['#2DC5C5', '#9B59B6', '#4472C4', '#ED7D31', '#2BA89A']

/* ── Toggle Button ──────────────────────────────────────────────────────── */
function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#F0F4FA', borderRadius: 8, padding: 3 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '4px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            background: value === opt.value ? '#003DA5' : 'transparent',
            color: value === opt.value ? '#fff' : '#6B7A99',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Card wrapper with header row ───────────────────────────────────────── */
function ChartCard({ kpiLabel, kpiColor, title, toggleOptions, toggleValue, onToggle, children }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ ...KPI_LABEL_STYLE, color: kpiColor }}>{kpiLabel}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={CHART_TITLE_STYLE}>{title}</div>
        {toggleOptions && (
          <ToggleGroup options={toggleOptions} value={toggleValue} onChange={onToggle} />
        )}
      </div>
      {children}
    </div>
  )
}

export default function KpiDashboard() {
  const { data: permits = [] } = useAllPermits()
  const { data: citations = [] } = useAllCitations()

  // view-mode state per chart
  const [latencyMode,     setLatencyMode]     = useState('avg')      // avg | sum
  const [violationMode,   setViolationMode]   = useState('pct')      // pct | count
  const [neighborMode,    setNeighborMode]    = useState('pct')      // pct | count
  const [claimsMode,      setClaimsMode]      = useState('pct')      // pct | count
  const [financeMode,     setFinanceMode]     = useState('sum')      // sum | pct

  // ── KPI 1 ────────────────────────────────────────────────────────────────
  const latencyBySource = permits.reduce((acc, p) => {
    if (p.latency_hrs == null) return acc
    const src = p.submission_source || 'Unknown'
    if (!acc[src]) acc[src] = { total: 0, count: 0 }
    acc[src].total += Number(p.latency_hrs)
    acc[src].count += 1
    return acc
  }, {})
  const totalLatency = Object.values(latencyBySource).reduce((s, v) => s + v.total, 0)
  const latencyData = Object.entries(latencyBySource).map(([source, { total, count }]) => ({
    source,
    avg:  parseFloat((total / count).toFixed(2)),
    sum:  parseFloat(total.toFixed(2)),
    pct:  parseFloat(((total / totalLatency) * 100).toFixed(1)),
  }))

  // ── KPI 2 ─────────────────────────────────────────────────────────────────
  const totalCitations   = citations.length
  const wrongfulTotal    = citations.filter(c => c.is_wrongful_citation).length

  const violationGroups  = citations.reduce((acc, c) => {
    const vt = c.violation_type || 'Unknown'
    if (!acc[vt]) acc[vt] = { total: 0, wrongful: 0 }
    acc[vt].total += 1
    if (c.is_wrongful_citation) acc[vt].wrongful += 1
    return acc
  }, {})
  const violationData = Object.entries(violationGroups)
    .map(([violation_type, { total, wrongful }]) => ({
      violation_type,
      pct:   parseFloat(((wrongful / totalCitations) * 100).toFixed(1)),
      count: wrongful,
    }))
    .sort((a, b) => b.pct - a.pct)

  // KPI 2 — neighborhood combo
  const neighborhoodGroups = citations.reduce((acc, c) => {
    const n = c.neighborhood || 'Unknown'
    if (!acc[n]) acc[n] = { total: 0, wrongful: 0 }
    acc[n].total += 1
    if (c.is_wrongful_citation) acc[n].wrongful += 1
    return acc
  }, {})
  const neighborhoodData = Object.entries(neighborhoodGroups).map(([neighborhood, { total, wrongful }]) => ({
    neighborhood,
    citSharePct:   parseFloat(((total / totalCitations) * 100).toFixed(1)),
    citCount:      total,
    wrongfulPct:   parseFloat(((wrongful / total) * 100).toFixed(1)),
    wrongfulCount: wrongful,
  })).sort((a, b) => b.citSharePct - a.citSharePct)

  // ── KPI 3 & 4 ─────────────────────────────────────────────────────────────
  const grossFines     = citations.reduce((s, c) => s + (Number(c.fine_amount) || 0), 0)
  const totalRefunds   = citations.filter(c => c.refund_status === 'Approved').reduce((s, c) => s + (Number(c.refund_amount) || 0), 0)

  const financeByNeighborhood = citations.reduce((acc, c) => {
    const n = c.neighborhood || 'Unknown'
    if (!acc[n]) acc[n] = { gross: 0, refund: 0 }
    acc[n].gross += Number(c.fine_amount) || 0
    if (c.refund_status === 'Approved') acc[n].refund += Number(c.refund_amount) || 0
    return acc
  }, {})
  const financeData = Object.entries(financeByNeighborhood).map(([neighborhood, { gross, refund }]) => ({
    neighborhood,
    Amount:        Math.round(gross),
    refund_amount: Math.round(refund),
    Amount_pct:    parseFloat(((gross / grossFines) * 100).toFixed(1)),
    refund_pct:    parseFloat(((refund / (totalRefunds || 1)) * 100).toFixed(1))
  })).sort((a, b) => b.Amount - a.Amount)

  // ── KPI 5 ─────────────────────────────────────────────────────────────────
  const claimsFiled    = citations.filter(c => c.refund_claim).length
  const claimsApproved = citations.filter(c => c.refund_claim && c.refund_status === 'Approved').length
  const claimsDenied   = citations.filter(c => c.refund_claim && c.refund_status === 'Denied').length
  const claimsData     = [
    { status: 'Approved', pct: claimsFiled > 0 ? parseFloat(((claimsApproved / claimsFiled) * 100).toFixed(2)) : 0, count: claimsApproved },
    { status: 'Denied',   pct: claimsFiled > 0 ? parseFloat(((claimsDenied   / claimsFiled) * 100).toFixed(2)) : 0, count: claimsDenied },
  ]

  // ── helpers ───────────────────────────────────────────────────────────────
  const dollarFmt = (v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}K` : `$${v}`
  const pctFmt    = (v) => `${v}%`

  return (
    <div style={{ fontFamily: 'inherit' }}>
      <div className="page-header">
        <div className="page-title">KPI Dashboard</div>
        <div className="page-sub">System performance and enforcement accuracy metrics</div>
      </div>

      {/* ── Row 1: KPI 1 + KPI 2 Violation ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* KPI 1 */}
        <ChartCard
          kpiLabel="KPI 1 — Permit Processing Latency"
          kpiColor="#003DA5"
          title="Latency by Submission Source"
          toggleOptions={[
            { label: 'Avg hrs', value: 'avg' }
          ]}
          toggleValue={latencyMode}
          onToggle={setLatencyMode}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={latencyData} margin={{ top: 20, right: 16, left: 0, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
              <XAxis dataKey="source" tick={{ fontSize: 12 }}
                label={{ value: 'submission_source', position: 'insideBottom', offset: -6, fontSize: 11, fill: '#999' }} height={44} />
              <YAxis tick={{ fontSize: 11 }}
                tickFormatter={latencyMode === 'pct' ? pctFmt : (v) => `${v}h`}
                label={{ value: latencyMode === 'pct' ? '% share' : 'latency_hrs', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#999' }} />
              <Tooltip formatter={(v) => [latencyMode === 'pct' ? `${v}%` : `${v}h`, latencyMode === 'avg' ? 'Avg Latency' : latencyMode === 'sum' ? 'Total Hours' : '% Share']} />
              <Bar dataKey={latencyMode} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={latencyMode} position="top" formatter={(v) => latencyMode === 'pct' ? `${v}%` : `${v}h`} style={{ fontSize: 11, fontWeight: 700 }} />
                {latencyData.map((_, i) => <Cell key={i} fill={LATENCY_COLORS[i % LATENCY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* KPI 2 — Violation Type */}
        <ChartCard
          kpiLabel="KPI 2 — Wrongful Citation Rate"
          kpiColor="#D94F3D"
          title="% Wrongful Citations by Violation Type"
          toggleOptions={[
            { label: '% of Total', value: 'pct' },
            { label: 'Count',      value: 'count' },
          ]}
          toggleValue={violationMode}
          onToggle={setViolationMode}
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={violationData} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }}
                tickFormatter={violationMode === 'pct' ? pctFmt : undefined}
                label={{ value: violationMode === 'pct' ? '% of Citations in Category' : 'Wrongful Citation Count', position: 'insideBottom', offset: -8, fontSize: 11, fill: '#666' }} height={44} />
              <YAxis dataKey="violation_type" type="category" tick={{ fontSize: 11 }} width={112} />
              <Tooltip formatter={(v) => [violationMode === 'pct' ? `${v}%` : v, violationMode === 'pct' ? '% of Citations' : 'Count']} />
              <Bar dataKey={violationMode} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey={violationMode} position="right" formatter={(v) => violationMode === 'pct' ? `${v}%` : v} style={{ fontSize: 11, fontWeight: 700 }} />
                {violationData.map((_, i) => <Cell key={i} fill={VIOLATION_COLORS[i % VIOLATION_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 2: KPI 2 Neighborhood Combo ── */}
      <ChartCard
        kpiLabel="KPI 2 — Wrongful Citation Rate"
        kpiColor="#D94F3D"
        title="Citation Share & Wrongful Citation Rate by Neighborhood"
        toggleOptions={[
          { label: '% View',  value: 'pct' },
          { label: 'Counts',  value: 'count' },
        ]}
        toggleValue={neighborMode}
        onToggle={setNeighborMode}
      >
        <div style={{ marginBottom: 20 }}>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={neighborhoodData}
              margin={{ top: 8, right: 24, left: 8, bottom: 32 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
              <XAxis dataKey="neighborhood" tick={{ fontSize: 12 }}
                label={{ value: 'neighborhood', position: 'insideBottom', offset: -8, fontSize: 11, fill: '#999' }} height={44} />
              <YAxis
                tickFormatter={neighborMode === 'pct' ? pctFmt : undefined}
                tick={{ fontSize: 11 }}
                label={{ value: neighborMode === 'pct' ? '% of Total Citations | % wrongful' : 'Citation Count | Wrongful Count', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: '#999' }} />
              <Tooltip formatter={(v, name) => [neighborMode === 'pct' ? `${v}%` : v, name]} />
              <Legend verticalAlign="top" height={28} />
              <Bar dataKey={neighborMode === 'pct' ? 'citSharePct' : 'citCount'} name="% of Total Citations" fill="#4472C4" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={neighborMode === 'pct' ? 'citSharePct' : 'citCount'} position="top" formatter={(v) => neighborMode === 'pct' ? `${v}%` : v} style={{ fontSize: 10, fontWeight: 600 }} />
              </Bar>
              <Line dataKey={neighborMode === 'pct' ? 'wrongfulPct' : 'wrongfulCount'} name="% of wrong citations" type="monotone" stroke="#ED7D31" strokeWidth={2.5} dot={{ r: 5, fill: '#ED7D31' }} isAnimationActive={false}>
                <LabelList dataKey={neighborMode === 'pct' ? 'wrongfulPct' : 'wrongfulCount'} position="top" formatter={(v) => neighborMode === 'pct' ? `${v}%` : v} style={{ fontSize: 10, fontWeight: 600, fill: '#ED7D31' }} />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div style={{ marginBottom: 20 }} />

      {/* ── Row 3: KPI 5 + KPI 3&4 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>

        {/* KPI 5 */}
        <ChartCard
          kpiLabel="KPI 5 — Refund Claim Approval Rate"
          kpiColor="#1A7F4B"
          title="Refund Claims — Approved vs. Denied"
          toggleOptions={[
            { label: '% Rate', value: 'pct' },
            { label: 'Count',  value: 'count' },
          ]}
          toggleValue={claimsMode}
          onToggle={setClaimsMode}
        >
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={claimsData} layout="vertical" margin={{ top: 4, right: 72, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" horizontal={false} />
              <XAxis type="number"
                domain={claimsMode === 'pct' ? [0, 100] : undefined}
                tickFormatter={claimsMode === 'pct' ? pctFmt : undefined}
                tick={{ fontSize: 11 }} />
              <YAxis dataKey="status" type="category" tick={{ fontSize: 12 }} width={64} />
              <Tooltip formatter={(v) => [claimsMode === 'pct' ? `${v}%` : v]} />
              <Bar dataKey={claimsMode} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey={claimsMode} position="right" formatter={(v) => claimsMode === 'pct' ? `${v}%` : v} style={{ fontSize: 12, fontWeight: 700 }} />
                <Cell fill="#4CAF50" />
                <Cell fill="#D94F3D" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#6B7A99' }}>Filed: <strong>{claimsFiled}</strong></div>
            <div style={{ fontSize: 12, color: '#1A7F4B' }}>Approved: <strong>{claimsApproved}</strong></div>
            <div style={{ fontSize: 12, color: '#D94F3D' }}>Denied: <strong>{claimsDenied}</strong></div>
          </div>
        </ChartCard>

        {/* KPI 3 & 4 */}
        <ChartCard
          kpiLabel="KPI 3 & 4 — Refund Cost Rate / Net Revenue"
          kpiColor="#E07B00"
          title="Amount Collected & Refunded by Neighborhood"
          toggleOptions={[
            { label: '$ Amount', value: 'sum' },
          ]}
          toggleValue={financeMode}
          onToggle={setFinanceMode}
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financeData} margin={{ top: 4, right: 16, left: 8, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
              <XAxis dataKey="neighborhood" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={52}
                label={{ value: 'neighborhood', position: 'insideBottom', offset: -32, fontSize: 11, fill: '#999' }} />
              <YAxis tick={{ fontSize: 11 }}
                tickFormatter={financeMode === 'pct' ? pctFmt : dollarFmt}
                label={{ value: financeMode === 'pct' ? '% Share' : 'Amount ($)', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#999' }} />
              <Tooltip formatter={(v, name) => [financeMode === 'pct' ? `${v}%` : `$${v.toLocaleString()}`, name]} />
              <Legend verticalAlign="top" height={28} />
              <Bar dataKey={financeMode === 'sum' ? 'Amount' : 'Amount_pct'} name="Amount Collected" fill="#4472C4" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={financeMode === 'sum' ? 'Amount' : 'Amount_pct'} position="top" formatter={(v) => financeMode === 'pct' ? `${v}%` : dollarFmt(v)} style={{ fontSize: 10, fontWeight: 600 }} />
              </Bar>
              <Bar dataKey={financeMode === 'sum' ? 'refund_amount' : 'refund_pct'} name="Refund Amount" fill="#ED7D31" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                <LabelList dataKey={financeMode === 'sum' ? 'refund_amount' : 'refund_pct'} position="top" formatter={(v) => financeMode === 'pct' ? `${v}%` : dollarFmt(v)} style={{ fontSize: 10, fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}