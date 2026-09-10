import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`ALTER TABLE "dreamCountryProfiles" ADD COLUMN IF NOT EXISTS "activitiesPlan" jsonb`
await sql`ALTER TABLE "dreamUniversityTracks" ADD COLUMN IF NOT EXISTS "acceptanceProbability" integer`
await sql`ALTER TABLE "dreamUniversityTracks" ADD COLUMN IF NOT EXISTS "matchTier" text`
await sql`ALTER TABLE "dreamUniversityTracks" ADD COLUMN IF NOT EXISTS "universityImageUrl" text`
await sql`ALTER TABLE "dreamUniversityTracks" ADD COLUMN IF NOT EXISTS "universityLink" text`

console.log('Added dreamCountryProfiles.activitiesPlan and dreamUniversityTracks.acceptanceProbability/matchTier/universityImageUrl/universityLink.')
