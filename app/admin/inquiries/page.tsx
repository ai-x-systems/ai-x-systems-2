import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminSession } from '@/lib/accounts/session'
import { listProspects } from '@/lib/leads/prospects'
import { AppTopbar } from '@/components/app-topbar'
import { PageHeader } from '@/components/page-header'
import { ProspectStatusSelect } from './prospect-status-select'

export const metadata = { title: 'Inquiries' }

export default async function InquiriesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin-login')

  const prospects = await listProspects()

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-16 md:px-6">
      <AppTopbar current="admin" />
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="Admin"
          title="Inquiries"
          description={`${prospects.length} submission(s) from the demo request form`}
        />
        <Link href="/admin" className="text-sm text-primary underline underline-offset-4">
          Back to Clients
        </Link>
      </div>

      <div className="mt-10 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Details</th>
              <th className="px-4 py-3 font-medium">Received</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {prospects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No inquiries yet.
                </td>
              </tr>
            ) : (
              prospects.map((p) => (
                <tr key={p.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.businessName}</div>
                    <div className="text-xs text-muted-foreground">{p.industry ?? '—'}</div>
                    {p.website ? (
                      <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline underline-offset-4">{p.website}</a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div>{p.contactName}</div>
                    <a href={`mailto:${p.email}`} className="text-xs text-primary underline underline-offset-4">
                      {p.email}
                    </a>
                    {p.phone ? <div className="text-xs text-muted-foreground">{p.phone}</div> : null}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted-foreground">{p.details ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.createdAtISO).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <ProspectStatusSelect prospectId={p.id} currentStatus={p.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
