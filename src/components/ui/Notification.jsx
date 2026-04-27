import { useState, useEffect } from 'react'

let showFn = null
export function showNotification(msg, type = '') { if (showFn) showFn(msg, type) }

export default function Notification() {
  const [state, setState] = useState({ msg: '', type: '', visible: false })

  useEffect(() => {
    showFn = (msg, type) => {
      setState({ msg, type, visible: true })
      setTimeout(() => setState(s => ({ ...s, visible: false })), 3000)
    }
  }, [])

  return (
    <div className={`notif ${state.type} ${state.visible ? 'show' : ''}`}>
      {state.msg}
    </div>
  )
}