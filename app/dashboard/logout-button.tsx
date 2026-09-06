'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function LogoutButton({ role }: { role: 'admin' | 'client' }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    router.push(role === 'admin' ? '/admin-login' : '/client/login')
    router.refresh()
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout}>
      Log out
    </Button>
  )
}
