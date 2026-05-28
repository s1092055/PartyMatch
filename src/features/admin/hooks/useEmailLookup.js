import { useState } from 'react'

export function useEmailLookup(lookupFn) {
  const [email, setEmail] = useState('')
  const [target, setTarget] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLookup(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    setTarget(null)
    try {
      const user = await lookupFn(email.trim())
      setTarget(user)
    } catch (err) {
      setError(err?.message ?? '查詢失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setTarget(null)
    setError('')
  }

  return { email, setEmail, target, setTarget, error, setError, loading, handleLookup, reset }
}
