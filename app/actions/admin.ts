'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { ADMIN_EMAIL } from '@/lib/admin'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.email !== ADMIN_EMAIL) throw new Error('Unauthorized')
}

export async function unbanUser(userId: string) {
  await requireAdmin()
  await db.update(user).set({ banned: false, banReason: null }).where(eq(user.id, userId))
  revalidatePath('/admin')
}

export type BanResult = { ok: true } | { ok: false; error: string }

export async function banUserByEmail(email: string, reason: string): Promise<BanResult> {
  await requireAdmin()
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedReason = reason.trim()
  if (!trimmedEmail) return { ok: false, error: 'Enter an email address.' }
  if (!trimmedReason) return { ok: false, error: 'Enter a ban reason.' }

  const [target] = await db.select({ id: user.id, email: user.email }).from(user).where(eq(user.email, trimmedEmail))
  if (!target) return { ok: false, error: `No account found with email "${trimmedEmail}".` }
  if (target.email === ADMIN_EMAIL) return { ok: false, error: "You can't ban the admin account." }

  await db.update(user).set({ banned: true, banReason: trimmedReason }).where(eq(user.id, target.id))
  revalidatePath('/admin')
  return { ok: true }
}
