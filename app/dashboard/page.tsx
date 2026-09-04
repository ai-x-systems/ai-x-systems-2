import { redirect } from 'next/navigation'
import { getSession } from '@/lib/accounts/session'
import { getBusinessById } from '@/config/businesses'
import { creditLedger } from '@/lib/billing/credits'
import { PageHeader } from '@/components/page-header'
import { LogoutButton } from './logout-button'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'admin') redirect('/admin')
  if (!session.businessId) redirect('/login')

  const business = getBusinessById(session.businessId)
  const balance = await creditLedger.getBalance(session.businessId)

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={business?.name}
          title="Dashboard"
          description={session.email}
        />
        <LogoutButton />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Credit balance</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{balance.balance}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Running low? Reach out and we&apos;ll send a payment link to top up.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Receptionist status</p>
          <p className="mt-2 text-lg font-medium">
            {business?.demo ? 'Demo mode' : 'Live'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {business?.industry ?? '—'}
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Recent activity</p>
        {balance.transactions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {balance.transactions
              .slice(-10)
              .reverse()
              .map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {t.note ?? t.type} — {new Date(t.createdAtISO).toLocaleDateString()}
                  </span>
                  <span className={t.amount >= 0 ? 'text-primary' : 'text-foreground'}>
                    {t.amount >= 0 ? '+' : ''}
                    {t.amount}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </main>
  )
}
