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
