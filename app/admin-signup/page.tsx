import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { AdminSignupForm } from './admin-signup-form'

export const metadata: Metadata = {
  title: 'Admin Sign up',
  description: 'One-time admin account creation for AI x Systems.',
}

export default function AdminSignupPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader
            eyebrow="Admin"
            title="Create the admin account"
            description="Works once. After the first admin account exists, this is permanently disabled."
          />
          <div className="mt-8">
            <AdminSignupForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
