import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { user } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { UnbanButton } from '@/components/admin/unban-button'
import { ADMIN_EMAIL } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.email !== ADMIN_EMAIL) redirect('/')

  const bannedUsers = await db
    .select({ id: user.id, name: user.name, email: user.email, banReason: user.banReason })
    .from(user)
    .where(eq(user.banned, true))

  return (
    <div className="min-h-screen bg-background text-foreground px-4 sm:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Banned users</h1>
        <p className="text-sm text-muted-foreground mb-8">{bannedUsers.length} account{bannedUsers.length === 1 ? '' : 's'} currently suspended.</p>

        {bannedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No banned users.</p>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {bannedUsers.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.banReason ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <UnbanButton userId={u.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
