import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";

// No response-store cache adapter for now — that's a CDN-caching
// optimization requiring a second always-running Worker + R2 bucket, and
// added real complexity to the first working deployment. Cloudflare's
// default (no cache: false-equivalent) is functionally correct, just
// without the extra caching layer; can be reintroduced later once the
// core app is confirmed working end to end.
export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
