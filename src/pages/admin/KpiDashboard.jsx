import { useAllPermits } from '../../hooks/usePermits'
import { useAllCitations } from '../../hooks/useCitations'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function KpiDashboard() {
  const { data: permits = [] } = useAllPermits()
  const { data: citations = [] } = useAllCitations()

  const violationCounts = citations.reduce((acc, c) => {
    acc[c.violation_type] = (acc[c.violation_type] || 0) + 1
    return acc
  }, {})

  const violationData = Object.entries(violationCounts).map(([name, count]) => ({ name, count }))

  const permitTypeCounts = permits.reduce((acc, p) => {
    acc[p.permit_type] = (acc[p.permit_type] || 0) + 1
    return acc
  }, {})

  const permitData = Object.entries(permitTypeCounts).map(([name, count]) => ({ name, count }))

  return (
    <>
      <div className="page-header">
        <div className="page-title">KPI Dashboard</div>
        <div className="page-sub">System analytics and performance metrics</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Citations by Violation Type</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={violationData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#D94F3D" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">Permits by Type</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={permitData} margin={{ top: 4, right: 8, left: -16, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DDE5F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#003DA5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}