import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { AdminForgotPasswordForm } from './admin-forgot-password-form'

export const metadata: Metadata = {
  title: 'Admin — Forgot password',
  description: 'Reset your AI x Systems admin password.',
}

export default function AdminForgotPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader eyebrow="Admin" title="Forgot password" description="We'll email you a link to set a new one." />
          <div className="mt-8">
            <AdminForgotPasswordForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
