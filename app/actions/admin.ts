'use server'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/auth-schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { ADMIN_EMAIL } from '@/lib/admin'

// Returns a boolean rather than throwing — a thrown Error from a Server
// Action reaches the client as an opaque "Minified React error #441"
// (see app/actions/analyze-target-university.ts). Both actions below are
// also gated by the admin page itself; this is defence in depth.
async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    return !!session?.user && session.user.email === ADMIN_EMAIL
  } catch {
    return false
  }
}

export async function unbanUser(userId: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false }
  await db.update(user).set({ banned: false, banReason: null }).where(eq(user.id, userId))
  revalidatePath('/admin')
  return { ok: true }
}

export type BanResult = { ok: true } | { ok: false; error: string }

export async function banUserByEmail(email: string, reason: string): Promise<BanResult> {
  if (!(await isAdmin())) return { ok: false, error: 'Not authorized.' }
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
