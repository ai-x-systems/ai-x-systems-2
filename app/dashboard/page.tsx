import { redirect } from 'next/navigation'
import { getClientSession } from '@/lib/accounts/session'
import { getBusinessById } from '@/config/businesses'
import { creditLedger } from '@/lib/billing/credits'
import { listRecentActivity } from '@/lib/activity/log'
import { PageHeader } from '@/components/page-header'
import { AppTopbar } from '@/components/app-topbar'
import { siteConfig } from '@/lib/site-config'
import { LogoutButton } from './logout-button'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await getClientSession()
  if (!session) redirect('/client/login')
  if (!session.businessId) redirect('/client/login')

  const business = getBusinessById(session.businessId)
  const balance = await creditLedger.getBalance(session.businessId)
  const activity = await listRecentActivity(session.businessId, 10)

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 md:px-6">
      <AppTopbar current="client" />
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow={business?.name}
          title="Dashboard"
          description={session.email}
        />
        <LogoutButton role="client" />
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Credit balance</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{balance.balance}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Running low?{' '}
            <a href={`mailto:${siteConfig.contact.email}?subject=Top up credits — ${business?.name ?? ''}`} className="text-primary underline underline-offset-4">Reach out</a>{' '}
            and we&apos;ll send a payment link to top up.
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
        <p className="text-sm font-medium">Recent leads &amp; bookings</p>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing yet — this fills in as calls come through.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="py-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {entry.type === 'booking' ? 'Booking' : 'Lead'}
                    {typeof entry.data.callerName === 'string' && entry.data.callerName
                      ? ` — ${entry.data.callerName}`
                      : ''}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAtISO).toLocaleString()}
                  </span>
                </div>
                <p className="mt-0.5 text-muted-foreground">
                  {entry.type === 'booking'
                    ? [entry.data.serviceName, entry.data.startTimeISO].filter(Boolean).join(' at ')
                    : (entry.data.reason as string | undefined) ?? ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-medium">Credit activity</p>
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
