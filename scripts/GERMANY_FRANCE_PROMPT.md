# Task: Add Germany and France to Shortlisted

You have access to the GitHub repo. Before writing any data, explore the codebase yourself to understand how the app already models a country end-to-end — you have everything you need in version control, this is a guideline on *what* to look at and *what bar to hit*, not a full spec.

## What to look at

- `lib/db/schema.ts` — the `universities` and `programRankings` tables. Field comments explain the semantics; `null` almost always means "not yet researched," never "zero."
- `app/actions/match.ts` and `app/actions/analyze-target-university.ts` — the AI matching/analysis logic. Find the per-country admissions-context text and the rank-threshold filtering logic (Top 50/100/200) — your data needs to work correctly with both.
- `components/profile-form.tsx` and `components/matches-view.tsx` — the country picker and the country-specific admissions blurb shown to students. Note how Australia gets special-cased in the UI (extracurriculars section hidden) because its admissions are almost purely grade-cutoff-driven — research whether Germany (Abitur/Numerus Clausus) or France (Parcoursup) deserve similar treatment, don't assume.
- `scripts/` — look at a few existing "add"/"seed" scripts for the pattern: small, idempotent, re-runnable `.mjs` files using `@neondatabase/serverless`, run via `node --env-file=.env.local scripts/x.mjs`. Match that convention rather than writing raw one-off SQL.

## Data quality bar

Same standard as the rest of the catalog: every rank, acceptance rate, and requirement must come from a real, named, citable source. No estimates passed off as real data. If you don't have a real number for something, leave it null — don't guess.

## Known gap to flag, don't try to force a fix

SAT/ACT fields in the schema don't apply to Germany/France. Don't populate them. Instead, tell us in your summary: is there a real equivalent metric (Abitur average, Baccalauréat grade, etc.) worth adding as new schema fields? That's a decision for us to make together, not something to shoehorn into the existing columns.

## What to report back when done

1. How many DE/FR universities added, and how many have real (not estimated) acceptance rate / rank / program-specific rank data.
2. Your finding on extracurriculars weighting for DE/FR (with sources).
3. Whether a SAT/ACT-equivalent field is worth adding, and what it would be.
4. Any other place the existing schema/UI assumptions don't cleanly fit Germany or France.

Don't edit the shared UI/prompt files yourself (country picker, admissions-context text) — draft what you think those entries should say in your summary, and we'll review and wire them in.
