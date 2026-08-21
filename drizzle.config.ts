import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // This tells Drizzle to scan your lib folder for your database tables
  schema: "./lib/**/*.ts", 
  dbCredentials: {
    url: process.env.DATABASE_URL as string,
  },
});
