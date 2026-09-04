import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { PageHeader } from '@/components/page-header'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your AI x Systems client dashboard.',
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-sm px-4 md:px-6">
          <PageHeader title="Log in" description="Access your dashboard." />
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
