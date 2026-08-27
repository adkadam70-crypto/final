import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // Both the app schema AND the Better Auth schema — omitting auth-schema.ts
  // here once caused drizzle-kit to treat user/session/account/verification
  // as "not part of the desired state" and drop them on a --force push.
  // A broader glob over lib/ was tried before and also matched
  // lib/fonts.ts (a next/font/local loader), which throws when evaluated
  // outside Next's own build pipeline — hence two explicit paths, not a glob.
  schema: ["./lib/db/schema.ts", "./lib/db/auth-schema.ts"],
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
