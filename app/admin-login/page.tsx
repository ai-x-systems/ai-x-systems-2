import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { AdminLoginForm } from './admin-login-form'

export const metadata: Metadata = {
  title: 'Admin Log in',
  description: 'AI x Systems admin dashboard access.',
}

export default function AdminLoginPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader eyebrow="Admin" title="Log in" description="Admin access only." />
          <div className="mt-8">
            <AdminLoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
