import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/accounts/session'
import { accountStore } from '@/lib/accounts/store'
import { getBusinessById } from '@/config/businesses'
import { creditLedger } from '@/lib/billing/credits'
import { PageHeader } from '@/components/page-header'
import { LogoutButton } from '@/app/dashboard/logout-button'
import { CreditAdjustForm } from './credit-adjust-form'

export const metadata = { title: 'Admin' }

export default async function AdminPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin-login')

  const accounts = await accountStore.list()
  const clients = await Promise.all(
    accounts
      .filter((a) => a.role === 'client' && a.businessId)
      .map(async (a) => {
        const business = getBusinessById(a.businessId!)
        const balance = await creditLedger.getBalance(a.businessId!)
        return {
          accountId: a.id,
          email: a.email,
          businessId: a.businessId!,
          businessName: business?.name ?? '(unknown business)',
          industry: business?.industry,
          demo: business?.demo ?? false,
          creditBalance: balance.balance,
        }
      })
  )

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-16 md:px-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader eyebrow="Admin" title="Clients" description={`${clients.length} client account(s)`} />
        <LogoutButton role="admin" />
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Credits</th>
              <th className="px-4 py-3 font-medium">Record payment / usage</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No client accounts yet.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr key={c.accountId} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.businessName}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.businessId} · {c.industry}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        c.demo
                          ? 'rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground'
                          : 'rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary'
                      }
                    >
                      {c.demo ? 'Demo' : 'Live'}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{c.creditBalance}</td>
                  <td className="px-4 py-3">
                    <CreditAdjustForm businessId={c.businessId} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Credits are recorded manually here after you confirm a Payment Request Link
        (Elevate Pay / PingPong / Payoneer) was paid — nothing here charges a card automatically.
      </p>
    </main>
  )
}
