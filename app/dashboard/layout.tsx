import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/ui/footer-section'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

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
