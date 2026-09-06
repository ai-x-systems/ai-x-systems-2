import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'

/**
 * components/app-topbar.tsx
 * ---------------------------------------------------------------------
 * Used only inside /dashboard and /admin — not the public marketing
 * navbar (components/navbar.tsx). Keeps those two pages from being dead
 * ends: always a way back to the main site, and a cross-link between
 * the two consoles for whoever is wearing both hats (you, testing as
 * admin and client in separate browser sessions).
 * ---------------------------------------------------------------------
 */
export function AppTopbar({ current }: { current: 'admin' | 'client' }) {
  return (
    <div className="mb-8 flex items-center justify-between border-b border-border pb-4 text-sm">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/icon-mark.svg" alt="" width={20} height={20} className="rounded-md" />
        {siteConfig.brand.name}
      </Link>
      <div className="flex items-center gap-4 text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          Main site
        </Link>
        {current === 'admin' ? (
          <Link href="/client/login" className="transition-colors hover:text-foreground">
            Client login
          </Link>
        ) : (
          <Link href="/admin-login" className="transition-colors hover:text-foreground">
            Admin login
          </Link>
        )}
      </div>
    </div>
  )
}
