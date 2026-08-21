import { neon, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Resilient fetch wrapper for Neon serverless HTTP queries.
// Prevents transient 'fetch failed' errors during cold starts or high concurrent requests.
const resilientFetch = async (url: string | URL | Request, init?: RequestInit) => {
  const maxRetries = 3
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, init)
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 200))
      }
    }
  }
  throw lastError
}

neonConfig.fetchFunction = resilientFetch

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

