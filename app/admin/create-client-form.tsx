'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CreateClientForm() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      const res = await fetch('/api/admin/clients/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, email, password }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Could not create client account.')
        return
      }

      setNotice(`Created login for ${email}. Share these credentials with the client directly.`)
      setBusinessId('')
      setEmail('')
      setPassword('')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm font-medium">Create a client login</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Creates the account directly — you stay logged in as admin, the client does not need to sign up
        themselves.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Business ID</label>
          <input
            required
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="e.g. ai-x-systems"
            className="w-40 rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-56 rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Temporary password</label>
          <input
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-44 rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Creating…' : 'Create login'}
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {notice ? <p className="mt-2 text-sm text-primary">{notice}</p> : null}
    </div>
  )
}
