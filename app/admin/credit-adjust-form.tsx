'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function CreditAdjustForm({ businessId }: { businessId: string }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!parsed) return

    setLoading(true)
    try {
      await fetch(`/api/admin/clients/${businessId}/credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: parsed > 0 ? 'manual_topup' : 'usage',
          amount: parsed,
          note: note || undefined,
        }),
      })
      setAmount('')
      setNote('')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-1.5">
      <input
        type="number"
        placeholder="±amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20 rounded-md border border-input bg-input/30 px-2 py-1 text-xs outline-none focus-visible:border-ring"
      />
      <input
        type="text"
        placeholder="Note (e.g. Payoneer PR-0142)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="w-40 rounded-md border border-input bg-input/30 px-2 py-1 text-xs outline-none focus-visible:border-ring"
      />
      <Button type="submit" size="xs" variant="outline" disabled={loading || !amount}>
        Save
      </Button>
    </form>
  )
}
