import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { ClientSignupForm } from './client-signup-form'

export const metadata: Metadata = {
  title: 'Client Sign up',
  description: 'Create your AI x Systems client dashboard login.',
}

export default function ClientSignupPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader
            eyebrow="Client Portal"
            title="Create your login"
            description="Use the business ID we gave you when we set up your AI Receptionist."
          />
          <div className="mt-8">
            <ClientSignupForm />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have a login?{' '}
            <a href="/client/login" className="text-primary underline underline-offset-4">
              Log in
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
