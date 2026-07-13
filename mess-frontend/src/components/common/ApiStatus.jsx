import { useEffect, useState } from 'react'
import { API_BASE_URL, checkApiHealth } from '../../api/http'

export default function ApiStatus() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    let mounted = true

    checkApiHealth().then((result) => {
      if (!mounted) return
      setStatus(result.ok ? 'online' : 'mock')
    })

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className={`api-status ${status}`}>
      <span />
      {status === 'online' ? 'API connected' : status === 'checking' ? 'Checking API...' : 'Mock fallback'}
      <small>{API_BASE_URL}</small>
    </div>
  )
}
