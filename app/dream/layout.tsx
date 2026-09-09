import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/ui/footer-section'
import { ADMIN_EMAIL } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// "Build Your Dream" is still being tested — admin-only for now (same
// pattern as app/admin/page.tsx) until it's ready for every user. Remove
// this gate when the feature ships generally.
export default async function DreamLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')
  if (session.user.email !== ADMIN_EMAIL) redirect('/dashboard')

  return (
    <>
      <Navbar userName={session.user.name} userEmail={session.user.email} />
      <main className="app-shell-background min-h-screen text-foreground pt-16">
        {children}
      </main>
      <Footer />
    </>
  )
}
