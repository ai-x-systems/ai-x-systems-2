'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Faq {
  question: string
  answer: string
}

export function EditBusinessConfigForm({
  businessId,
  initialFaqs,
  initialNotifyEmail,
}: {
  businessId: string
  initialFaqs: Faq[]
  initialNotifyEmail: string
}) {
  const router = useRouter()
  const [faqs, setFaqs] = useState<Faq[]>(initialFaqs.length ? initialFaqs : [{ question: '', answer: '' }])
  const [notifyEmail, setNotifyEmail] = useState(initialNotifyEmail)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  function updateFaq(index: number, field: keyof Faq, value: string) {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)))
  }

  function addFaq() {
    setFaqs((prev) => [...prev, { question: '', answer: '' }])
  }

  function removeFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/clients/${businessId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faqs, notifyEmail }),
      })
      const data = await res.json()
      if (!data.success) {
        setNotice(data.error ?? 'Could not save.')
        return
      }
      setNotice('Saved. The AI will use this on its next reply.')
      router.refresh()
    } catch {
      setNotice('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Notification email</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Where new lead/booking alerts are sent for this business.
        </p>
        <input
          type="email"
          value={notifyEmail}
          onChange={(e) => setNotifyEmail(e.target.value)}
          className="mt-3 w-full max-w-sm rounded-lg border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium">FAQs</p>
        <p className="mt-1 text-xs text-muted-foreground">
          What the AI answers with, word for word — keep answers accurate and short.
        </p>

        <div className="mt-4 space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Question</label>
                <button
                  type="button"
                  onClick={() => removeFaq(i)}
                  className="text-xs text-destructive hover:underline"
                >
                  Remove
                </button>
              </div>
              <input
                value={faq.question}
                onChange={(e) => updateFaq(i, 'question', e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
              />
              <label className="mt-3 block text-xs text-muted-foreground">Answer</label>
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-input bg-input/30 px-2 py-1.5 text-sm outline-none focus-visible:border-ring"
              />
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={addFaq}>
          Add FAQ
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
      </div>
    </div>
  )
}
