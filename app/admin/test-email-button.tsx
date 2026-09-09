'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function TestEmailButton({ defaultEmail }: { defaultEmail: string }) {
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  async function handleSend() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, error: 'Request failed.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm font-medium">Test email delivery</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Sends a real test email through GMAIL_USER/GMAIL_APP_PASSWORD so you can confirm delivery is working.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64 rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
        />
        <Button type="button" size="sm" onClick={handleSend} disabled={loading}>
          {loading ? 'Sending…' : 'Send test email'}
        </Button>
      </div>
      {result ? (
        <p className={`mt-2 text-sm ${result.success ? 'text-primary' : 'text-destructive'}`}>
          {result.success ? 'Sent — check the inbox.' : `Failed: ${result.error}`}
        </p>
      ) : null}
    </div>
  )
}
