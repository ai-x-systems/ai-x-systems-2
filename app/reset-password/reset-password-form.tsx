'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<'admin' | 'client' | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <p className="text-sm text-destructive">
        This link is missing its reset token. Request a new one from the login page.
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Could not reset password.')
        return
      }

      setDone(data.role)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-primary">Password updated. You can log in now.</p>
        <Button
          className="w-full"
          onClick={() => router.push(done === 'admin' ? '/admin-login' : '/client/login')}
        >
          Go to log in
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="newPassword" className="text-sm font-medium">
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  )
}
