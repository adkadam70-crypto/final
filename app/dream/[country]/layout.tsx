import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'
import { ADMIN_EMAIL } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Same admin-only gate as /dream itself — see the comment there. Deliberately
// does NOT render its own Navbar/main/Footer shell: this layout nests INSIDE
// app/dream/layout.tsx (which already provides that shell for the whole
// /dream segment, /dream/[country] included), so rendering them again here
// duplicated both on every /dream/[country] page — this layout only needs to
// repeat the auth check, not the visual shell.
export default async function DreamCountryLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')
  if (session.user.email !== ADMIN_EMAIL) redirect('/dashboard')

  return <>{children}</>
}
