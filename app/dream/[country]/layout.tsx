import { getSession } from '@/lib/get-session'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Deliberately does NOT render its own Navbar/main/Footer shell: this layout
// nests INSIDE app/dream/layout.tsx (which already provides that shell for
// the whole /dream segment, /dream/[country] included), so rendering them
// again here duplicated both on every /dream/[country] page — this layout
// only needs to repeat the auth check, not the visual shell.
export default async function DreamCountryLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session?.user) redirect('/sign-in')

  return <>{children}</>
}
