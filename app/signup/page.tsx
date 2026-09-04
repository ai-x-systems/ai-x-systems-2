import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { SignupForm } from './signup-form'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your AI x Systems client dashboard login.',
}

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader
            title="Create your login"
            description="Use the business ID we gave you when we set up your AI Receptionist."
          />
          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
