import { useAllPermits } from '../../hooks/usePermits'
import { useAllCitations } from '../../hooks/useCitations'
import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  Legend, Line, ComposedChart, Cell, LabelList
} from 'recharts'

/* ── Design tokens ─────────────────────────────────────────────────────── */
const CARD_STYLE = {
  background: '#fff',
  border: '2px solid #93C5E8',
  borderRadius: 16,
  padding: '20px 24px',
}
const KPI_LABEL_STYLE = {
  fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4,
}
const CHART_TITLE_STYLE = {
  fontSize: 15, fontWeight: 700, color: '#1A56A0', marginBottom: 0, flex: 1,
}
const TABLE_STYLE = { width: '100%', borderCollapse: 'collapse', fontSize: 13 }
const TH_STYLE = {
  background: '#1A56A0', color: '#fff', padding: '8px 12px',
  textAlign: 'left', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap',
}
const TD_STYLE = {
  padding: '7px 12px', borderBottom: '1px solid #E8EFF8',
  color: '#2D3748', whiteSpace: 'nowrap',
}
const TD_ALT = { ...TD_STYLE, background: '#F4F8FF' }

const VIOLATION_COLORS = ['#4472C4', '#ED7D31', '#9B59B6', '#9DC63B', '#2BA89A']
const SYNC_COLORS      = ['#2DC5C5', '#9B59B6', '#4472C4', '#ED7D31', '#2BA89A']

/* ── Helpers ────────────────────────────────────────────────────────────── */
const dollarFmt = v =>
  v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M`
  : v >= 1000  ? `$${(v / 1000).toFixed(0)}K`
  : `$${v}`
const pctFmt = v => `${v}%`
const numFmt = v => Number(v).toLocaleString()

/* ── ToggleGroup ─────────────────────────────────────────────────────────  */
function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, background: '#F0F4FA', borderRadius: 8, padding: 3, flexShrink: 0 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          background: value === opt.value ? '#003DA5' : 'transparent',
          color:      value === opt.value ? '#fff'    : '#6B7A99',
          transition: 'all 0.15s',
        }}>{opt.label}</button>
      ))}
    </div>
  )
}

/* ── ChartCard ───────────────────────────────────────────────────────────  */
function ChartCard({ kpiLabel, kpiColor, title, toggleOptions, toggleValue, onToggle, children }) {
  return (
    <div style={CARD_STYLE}>
      <div style={{ ...KPI_LABEL_STYLE, color: kpiColor }}>{kpiLabel}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
        <div style={CHART_TITLE_STYLE}>{title}</div>
        {toggleOptions && <ToggleGroup options={toggleOptions} value={toggleValue} onChange={onToggle} />}
      </div>
      {children}
    </div>
  )
}

/* ── SummaryCard ─────────────────────────────────────────────────────────  */
function SummaryCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${color}28`,
      borderLeft: `4px solid ${color}`, borderRadius: 14,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{icon}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#1A2A4A', letterSpacing: '-0.5px', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#8A9AB8' }}>{sub}</div>}
    </div>
  )
}

/* ── DataTable ───────────────────────────────────────────────────────────  */
function DataTable({ columns, rows }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1.5px solid #D0E4F8' }}>
      <table style={TABLE_STYLE}>
        <thead>
          <tr>{columns.map((c, i) => <th key={i} style={{ ...TH_STYLE, textAlign: c.right ? 'right' : 'left' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {columns.map((c, ci) => (
                <td key={ci} style={{ ...(ri % 2 === 0 ? TD_ALT : TD_STYLE), textAlign: c.right ? 'right' : 'left' }}>
                  {c.format ? c.format(row[c.key]) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── TopLabel — renders above bar without clipping ───────────────────────  */
function TopLabel({ x, y, width, value, formatter }) {
  if (value == null || value === 0) return null
  return (
    <text x={x + width / 2} y={y - 5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#334155">
      {formatter ? formatter(value) : value}
    </text>
  )
}

/* ── Main dashboard ─────────────────────────────────────────────────────── */
export default function KpiDashboard() {
  const { data: permits   = [] } = useAllPermits()
  const { data: citations = [] } = useAllCitations()

  const [pageView,      setPageView]      = useState('graphs')
  const [syncMode,      setSyncMode]      = useState('avg_hrs')
  const [violationMode, setViolationMode] = useState('pct')
  const [neighborMode,  setNeighborMode]  = useState('pct')
  const [claimsMode,    setClaimsMode]    = useState('pct')
  const [financeMode,   setFinanceMode]   = useState('sum')

  /* ── Summary KPIs ────────────────────────────────────────────────────── */
  const totalPermits   = permits.length
  const totalCitations = citations.length
  const wrongfulTotal  = citations.filter(c => c.is_wrongful_citation).length

  // Total Revenue = permit fees + citation fines (both sources)
  const permitFeeTotal = permits.reduce((s, p) => s + (Number(p.permit_fee) || 0), 0)
  const grossFines     = citations.reduce((s, c) => s + (Number(c.fine_amount) || 0), 0)
  const totalRefunds   = citations
    .filter(c => c.refund_status === 'Approved')
    .reduce((s, c) => s + (Number(c.refund_amount) || 0), 0)
  const totalRevenue   = permitFeeTotal + grossFines   // permit fees + fines
  const netRevenue     = totalRevenue - totalRefunds   // minus approved refunds

  const claimsFiled    = citations.filter(c => c.refund_claim).length
  const claimsApproved = citations.filter(c => c.refund_claim && c.refund_status === 'Approved').length
  const claimsDenied   = citations.filter(c => c.refund_claim && c.refund_status === 'Denied').length

  /* ── KPI 1 — device_sync_lag_hrs by submission_source ───────────────── */
  const syncBySource = permits.reduce((acc, p) => {
    const lag = p.device_sync_lag_hrs
    if (lag == null) return acc
    const src = p.submission_source || 'Unknown'
    if (!acc[src]) acc[src] = { total: 0, count: 0 }
    acc[src].total += Number(lag)
    acc[src].count += 1
    return acc
  }, {})

  const syncData = Object.entries(syncBySource).map(([source, { total, count }]) => {
    const avgHrs = total / count
    return {
      source,
      avg_hrs: parseFloat(avgHrs.toFixed(6)),
      avg_min: parseFloat((avgHrs * 60).toFixed(4)),
      avg_sec: parseFloat((avgHrs * 3600).toFixed(3)),
    }
  })

  const syncKey  = { avg_hrs: 'avg_hrs', avg_min: 'avg_min', avg_sec: 'avg_sec' }[syncMode]
  const syncUnit = { avg_hrs: 'hrs',     avg_min: 'min',     avg_sec: 'sec'     }[syncMode]

  /* ── KPI 2 ───────────────────────────────────────────────────────────── */
  const violationGroups = citations.reduce((acc, c) => {
    const vt = c.violation_type || 'Unknown'
    if (!acc[vt]) acc[vt] = { total: 0, wrongful: 0 }
    acc[vt].total += 1
    if (c.is_wrongful_citation) acc[vt].wrongful += 1
    return acc
  }, {})
  const violationData = Object.entries(violationGroups)
    .map(([violation_type, { total, wrongful }]) => ({
      violation_type,
      pct:   parseFloat(((wrongful / (totalCitations || 1)) * 100).toFixed(1)),
      count: wrongful,
    }))
    .sort((a, b) => b.pct - a.pct)

  const neighborhoodGroups = citations.reduce((acc, c) => {
    const n = c.neighborhood || 'Unknown'
    if (!acc[n]) acc[n] = { total: 0, wrongful: 0 }
    acc[n].total += 1
    if (c.is_wrongful_citation) acc[n].wrongful += 1
    return acc
  }, {})
  const neighborhoodData = Object.entries(neighborhoodGroups)
    .map(([neighborhood, { total, wrongful }]) => ({
      neighborhood,
      citSharePct:   parseFloat(((total / (totalCitations || 1)) * 100).toFixed(1)),
      citCount:      total,
      wrongfulPct:   parseFloat(((wrongful / (total || 1)) * 100).toFixed(1)),
      wrongfulCount: wrongful,
    }))
    .sort((a, b) => b.citSharePct - a.citSharePct)

  /* ── KPI 3 & 4 ───────────────────────────────────────────────────────── */
  const financeByNeighborhood = citations.reduce((acc, c) => {
    const n = c.neighborhood || 'Unknown'
    if (!acc[n]) acc[n] = { gross: 0, refund: 0 }
    acc[n].gross += Number(c.fine_amount) || 0
    if (c.refund_status === 'Approved') acc[n].refund += Number(c.refund_amount) || 0
    return acc
  }, {})
  const financeData = Object.entries(financeByNeighborhood)
    .map(([neighborhood, { gross, refund }]) => ({
      neighborhood,
      Amount:        Math.round(gross),
      refund_amount: Math.round(refund),
      net:           Math.round(gross - refund),
      Amount_pct:    parseFloat(((gross / (grossFines || 1)) * 100).toFixed(1)),
      refund_pct:    parseFloat(((refund / (totalRefunds || 1)) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.Amount - a.Amount)

  /* ── KPI 5 ───────────────────────────────────────────────────────────── */
  const claimsData = [
    { status: 'Approved', pct: claimsFiled > 0 ? parseFloat(((claimsApproved / claimsFiled) * 100).toFixed(2)) : 0, count: claimsApproved },
    { status: 'Denied',   pct: claimsFiled > 0 ? parseFloat(((claimsDenied   / claimsFiled) * 100).toFixed(2)) : 0, count: claimsDenied  },
  ]

  const showGraph = pageView === 'graphs' || pageView === 'both'
  const showTable = pageView === 'tables' || pageView === 'both'

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: 'inherit' }}>

      {/* ── Page header + view toggle ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div className="page-title">KPI Dashboard</div>
          <div className="page-sub">System performance and enforcement accuracy metrics</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7A99', whiteSpace: 'nowrap' }}>View:</span>
          <ToggleGroup
            options={[
              { label: '📊 Graphs', value: 'graphs' },
              { label: '📋 Tables', value: 'tables' },
              { label: '⊞ Both',    value: 'both'   },
            ]}
            value={pageView}
            onChange={setPageView}
          />
        </div>
      </div>

      {/* ── 6 Summary KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Total Permits"   value={numFmt(totalPermits)}          sub="All time"               color="#003DA5" icon="🪪" />
        <SummaryCard label="Permit Fee Rev." value={`$${numFmt(permitFeeTotal)}`}  sub="Sum of permit_fee"      color="#2563EB" icon="🏷️" />
        <SummaryCard label="Citations"       value={numFmt(totalCitations)}         sub={`${wrongfulTotal} wrongful`} color="#D94F3D" icon="🚨" />
        <SummaryCard label="Total Revenue"   value={`$${numFmt(totalRevenue)}`}    sub="Permit fees + fines"    color="#E07B00" icon="💰" />
        <SummaryCard label="Total Refunds"   value={`$${numFmt(totalRefunds)}`}    sub={`${claimsApproved} approved`} color="#1A7F4B" icon="↩️" />
        <SummaryCard label="Net Revenue"     value={`$${numFmt(netRevenue)}`}      sub="Revenue − refunds"      color="#6B3FA0" icon="📈" />
      </div>

      {/* ── Row 1: KPI 1 + KPI 2 Violation ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* KPI 1 */}
        <ChartCard
          kpiLabel="KPI 1 — Device Sync Lag"
          kpiColor="#003DA5"
          title="Avg device_sync_lag_hrs by Submission Source"
          toggleOptions={[
            { label: 'Hrs', value: 'avg_hrs' },
            { label: 'Min', value: 'avg_min' },
            { label: 'Sec', value: 'avg_sec' },
          ]}
          toggleValue={syncMode}
          onToggle={setSyncMode}
        >
          {showGraph && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={syncData}
                margin={{ top: 28, right: 20, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                  tickFormatter={v => `${v}`}
                  label={{
                    value: `device_sync_lag (${syncUnit})`,
                    angle: -90,
                    position: 'insideLeft',
                    offset: 12,
                    style: { fontSize: 10, fill: '#94A3B8', textAnchor: 'middle' },
                  }}
                />
                <Tooltip
                  formatter={v => [`${v} ${syncUnit}`, `Avg (${syncUnit})`]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey={syncKey} radius={[5, 5, 0, 0]} isAnimationActive={false} maxBarSize={72}>
                  <LabelList
                    dataKey={syncKey}
                    content={({ x, y, width, value }) => (
                      <TopLabel x={x} y={y} width={width} value={value}
                        formatter={v => `${v} ${syncUnit}`} />
                    )}
                  />
                  {syncData.map((_, i) => <Cell key={i} fill={SYNC_COLORS[i % SYNC_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {showTable && (
            <div style={{ marginTop: showGraph ? 14 : 0 }}>
              <DataTable
                columns={[
                  { label: 'Source',    key: 'source' },
                  { label: 'Avg (hrs)', key: 'avg_hrs', right: true, format: v => `${v} hrs` },
                  { label: 'Avg (min)', key: 'avg_min', right: true, format: v => `${v} min` },
                  { label: 'Avg (sec)', key: 'avg_sec', right: true, format: v => `${v} sec` },
                ]}
                rows={syncData}
              />
            </div>
          )}
        </ChartCard>

        {/* KPI 2 — Violation */}
        <ChartCard
          kpiLabel="KPI 2 — Wrongful Citation Rate"
          kpiColor="#D94F3D"
          title="Wrongful Citations by Violation Type"
          toggleOptions={[
            { label: '% of Total', value: 'pct'   },
            { label: 'Count',      value: 'count' },
          ]}
          toggleValue={violationMode}
          onToggle={setViolationMode}
        >
          {showGraph && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={violationData}
                layout="vertical"
                margin={{ top: 4, right: 52, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={violationMode === 'pct' ? pctFmt : undefined}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="violation_type"
                  type="category"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  width={130}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={v => [violationMode === 'pct' ? `${v}%` : v, violationMode === 'pct' ? '% of Citations' : 'Count']} />
                <Bar dataKey={violationMode} radius={[0, 4, 4, 0]} isAnimationActive={false} maxBarSize={32}>
                  <LabelList
                    dataKey={violationMode}
                    position="right"
                    formatter={v => violationMode === 'pct' ? `${v}%` : v}
                    style={{ fontSize: 11, fontWeight: 700, fill: '#1E293B' }}
                  />
                  {violationData.map((_, i) => <Cell key={i} fill={VIOLATION_COLORS[i % VIOLATION_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {showTable && (
            <div style={{ marginTop: showGraph ? 14 : 0 }}>
              <DataTable
                columns={[
                  { label: 'Violation Type',     key: 'violation_type' },
                  { label: 'Wrongful',           key: 'count', right: true },
                  { label: '% of All Citations', key: 'pct',   right: true, format: v => `${v}%` },
                ]}
                rows={violationData}
              />
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 2: KPI 2 Neighborhood ── */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard
          kpiLabel="KPI 2 — Wrongful Citation Rate"
          kpiColor="#D94F3D"
          title="Citation Share & Wrongful Rate by Neighborhood"
          toggleOptions={[
            { label: '% View', value: 'pct'   },
            { label: 'Counts', value: 'count' },
          ]}
          toggleValue={neighborMode}
          onToggle={setNeighborMode}
        >
          {showGraph && (
            <ResponsiveContainer width="100%" height={290}>
              <ComposedChart
                data={neighborhoodData}
                margin={{ top: 26, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
                <XAxis
                  dataKey="neighborhood"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={neighborMode === 'pct' ? pctFmt : undefined}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip formatter={(v, name) => [neighborMode === 'pct' ? `${v}%` : v, name]} />
                <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey={neighborMode === 'pct' ? 'citSharePct' : 'citCount'}
                  name="Citation Share"
                  fill="#4472C4"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={48}
                >
                  <LabelList
                    dataKey={neighborMode === 'pct' ? 'citSharePct' : 'citCount'}
                    content={({ x, y, width, value }) => (
                      <TopLabel x={x} y={y} width={width} value={value}
                        formatter={v => neighborMode === 'pct' ? `${v}%` : v} />
                    )}
                  />
                </Bar>
                <Line
                  dataKey={neighborMode === 'pct' ? 'wrongfulPct' : 'wrongfulCount'}
                  name="Wrongful Rate"
                  type="monotone"
                  stroke="#ED7D31"
                  strokeWidth={2.5}
                  dot={{ r: 5, fill: '#ED7D31', strokeWidth: 0 }}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={neighborMode === 'pct' ? 'wrongfulPct' : 'wrongfulCount'}
                    position="top"
                    formatter={v => neighborMode === 'pct' ? `${v}%` : v}
                    style={{ fontSize: 10, fontWeight: 700, fill: '#C05621' }}
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
          {showTable && (
            <div style={{ marginTop: showGraph ? 14 : 0 }}>
              <DataTable
                columns={[
                  { label: 'Neighborhood',  key: 'neighborhood' },
                  { label: 'Citations',     key: 'citCount',      right: true },
                  { label: '% of Total',    key: 'citSharePct',   right: true, format: v => `${v}%` },
                  { label: 'Wrongful',      key: 'wrongfulCount', right: true },
                  { label: 'Wrongful Rate', key: 'wrongfulPct',   right: true, format: v => `${v}%` },
                ]}
                rows={neighborhoodData}
              />
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Row 3: KPI 5 + KPI 3&4 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>

        {/* KPI 5 */}
        <ChartCard
          kpiLabel="KPI 5 — Refund Claim Approval Rate"
          kpiColor="#1A7F4B"
          title="Refund Claims — Approved vs. Denied"
          toggleOptions={[
            { label: '% Rate', value: 'pct'   },
            { label: 'Count',  value: 'count' },
          ]}
          toggleValue={claimsMode}
          onToggle={setClaimsMode}
        >
          {showGraph && (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={claimsData}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={claimsMode === 'pct' ? [0, 100] : undefined}
                  tickFormatter={claimsMode === 'pct' ? pctFmt : undefined}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="status"
                  type="category"
                  tick={{ fontSize: 12, fill: '#334155' }}
                  width={64}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={v => [claimsMode === 'pct' ? `${v}%` : v, 'Claims']} />
                <Bar dataKey={claimsMode} radius={[0, 4, 4, 0]} isAnimationActive={false} maxBarSize={36}>
                  <LabelList
                    dataKey={claimsMode}
                    position="right"
                    formatter={v => claimsMode === 'pct' ? `${v}%` : v}
                    style={{ fontSize: 13, fontWeight: 700, fill: '#1E293B' }}
                  />
                  <Cell fill="#4CAF50" />
                  <Cell fill="#D94F3D" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, color: '#6B7A99' }}>Filed: <strong>{claimsFiled}</strong></div>
            <div style={{ fontSize: 12, color: '#1A7F4B' }}>Approved: <strong>{claimsApproved}</strong></div>
            <div style={{ fontSize: 12, color: '#D94F3D' }}>Denied: <strong>{claimsDenied}</strong></div>
          </div>
          {showTable && (
            <div style={{ marginTop: 14 }}>
              <DataTable
                columns={[
                  { label: 'Status', key: 'status' },
                  { label: 'Count',  key: 'count', right: true },
                  { label: '% Rate', key: 'pct',   right: true, format: v => `${v}%` },
                ]}
                rows={claimsData}
              />
            </div>
          )}
        </ChartCard>

        {/* KPI 3 & 4 */}
        <ChartCard
          kpiLabel="KPI 3 & 4 — Refund Cost Rate / Net Revenue"
          kpiColor="#E07B00"
          title="Fine Revenue & Refunds by Neighborhood"
          toggleOptions={[
            { label: '$ Amount', value: 'sum' },
            { label: '% Share',  value: 'pct' },
          ]}
          toggleValue={financeMode}
          onToggle={setFinanceMode}
        >
          {showGraph && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={financeData}
                margin={{ top: 28, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" vertical={false} />
                <XAxis
                  dataKey="neighborhood"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  angle={-12}
                  textAnchor="end"
                  height={44}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={financeMode === 'pct' ? pctFmt : dollarFmt}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip formatter={(v, name) => [financeMode === 'pct' ? `${v}%` : `$${v.toLocaleString()}`, name]} />
                <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey={financeMode === 'sum' ? 'Amount' : 'Amount_pct'}
                  name="Amount Collected"
                  fill="#4472C4"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={32}
                >
                  <LabelList
                    dataKey={financeMode === 'sum' ? 'Amount' : 'Amount_pct'}
                    content={({ x, y, width, value }) => (
                      <TopLabel x={x} y={y} width={width} value={value}
                        formatter={v => financeMode === 'pct' ? `${v}%` : dollarFmt(v)} />
                    )}
                  />
                </Bar>
                <Bar
                  dataKey={financeMode === 'sum' ? 'refund_amount' : 'refund_pct'}
                  name="Refund Amount"
                  fill="#ED7D31"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  maxBarSize={32}
                >
                  <LabelList
                    dataKey={financeMode === 'sum' ? 'refund_amount' : 'refund_pct'}
                    content={({ x, y, width, value }) => (
                      <TopLabel x={x} y={y} width={width} value={value}
                        formatter={v => financeMode === 'pct' ? `${v}%` : dollarFmt(v)} />
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {showTable && (
            <div style={{ marginTop: showGraph ? 14 : 0 }}>
              <DataTable
                columns={[
                  { label: 'Neighborhood', key: 'neighborhood' },
                  { label: 'Gross Fines',  key: 'Amount',        right: true, format: v => `$${numFmt(v)}` },
                  { label: 'Refunds',      key: 'refund_amount', right: true, format: v => `$${numFmt(v)}` },
                  { label: 'Net Revenue',  key: 'net',           right: true, format: v => `$${numFmt(v)}` },
                  { label: 'Gross %',      key: 'Amount_pct',    right: true, format: v => `${v}%` },
                  { label: 'Refund %',     key: 'refund_pct',    right: true, format: v => `${v}%` },
                ]}
                rows={financeData}
              />
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}