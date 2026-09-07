'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['new', 'contacted', 'converted', 'closed'] as const

export function ProspectStatusSelect({
  prospectId,
  currentStatus,
}: {
  prospectId: string
  currentStatus: (typeof STATUSES)[number]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: (typeof STATUSES)[number]) {
    setStatus(next)
    setSaving(true)
    try {
      await fetch(`/api/admin/prospects/${prospectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      value={status}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value as (typeof STATUSES)[number])}
      className="rounded-md border border-input bg-input/30 px-2 py-1 text-xs outline-none focus-visible:border-ring"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  )
}
