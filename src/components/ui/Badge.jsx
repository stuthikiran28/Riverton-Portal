export default function Badge({ type = 'info', children }) {
  return <span className={`badge badge-${type}`}>{children}</span>
}

export function statusBadge(status) {
  const map = {
    Active: 'success', Approved: 'success',
    Pending: 'warn',
    Denied: 'danger', Expired: 'danger', Unpaid: 'danger', Wrongful: 'danger',
    Paid: 'info', Waived: 'info',
  }
  return <Badge type={map[status] || 'info'}>{status}</Badge>
}