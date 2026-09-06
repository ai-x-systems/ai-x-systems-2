import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for your AI x Systems account.',
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader title="Set a new password" description="This link works once and expires in 1 hour." />
          <div className="mt-8">
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
