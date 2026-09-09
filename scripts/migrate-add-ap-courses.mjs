// Adds the apCourses column to profiles — real AP (Advanced Placement)
// courses a student has taken, independent of their primary curriculum. See
// lib/ap-courses.ts for the real College Board catalog this is picked from.
// Same raw-SQL approach as every other migrate-*.mjs — drizzle-kit push
// hangs on introspection in this environment.
//
// Usage: node --env-file=.env.local scripts/migrate-add-ap-courses.mjs

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "apCourses" jsonb NOT NULL DEFAULT '[]'::jsonb`

console.log('Added apCourses column to profiles.')
