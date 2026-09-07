// Shared guidance injected into both the match prompt (app/actions/match.ts)
// and the target-analysis prompt (app/actions/analyze-target-university.ts),
// right after the acceptance-rate grounding.
//
// Why this exists: the acceptance/offer rate the prompts anchor on is
// already measured over a real applicant pool. Without this block the model
// reads "student has strong grades" + "this country weighs academics ~85%"
// and adjusts the probability well ABOVE the anchor — which is wrong for a
// selective school, where nearly everyone applying already has strong
// grades, so meeting the bar is the price of entry, not an edge. Reported
// symptom: a student with AAA at A-Level shown a ~50% chance at LSE (21%
// offer rate). This block pins "merely qualified" applicants near the anchor
// at selective schools and reserves upward movement for genuine standouts.

export const SELECTIVITY_CALIBRATION = `SELECTIVITY CALIBRATION — how far this student's profile may move acceptanceProbability away from the grounding rate:

The grounding acceptance/offer rate already reflects a real applicant pool. At a SELECTIVE school (grounding rate at or below ~35%, or a Reach / Ultra Reach tier) that pool is heavily self-selected — almost everyone applying already meets, or is predicted to meet, the stated grade requirements. So at these schools:

- Merely MEETING the school's stated grade bar is the baseline expectation of the pool, not evidence of being above it. A student who just meets the requirements should land AT or only slightly above the grounding rate — not well above it. What actually decides these admissions (subject-specific depth, any required admissions test, essays / personal statement, the reference, olympiad or research results, demonstrated context) is mostly not visible to this tool, so absent clear evidence of a standout signal, treat the student as a typical member of the pool and stay near the anchor.
- Being BELOW the school's standard offer (e.g. AAA where the course's standard offer is A*AA, or a GPA/test score under the published bar) is a real negative at a selective school even when the grades are high in isolation — say so plainly in the rationale/weaknesses.
- Move acceptanceProbability meaningfully ABOVE the grounding rate only for a student who is clearly differentiated: grades comfortably above the standard offer AND at least one strong, specific non-academic signal (national olympiad, published research, a genuinely selective program or achievement). Strong grades alone do not clear a selective school — when the whole pool has them, they are the entry ticket, not an advantage.
- The per-country academic weighting above (e.g. "UK ~85% academic") describes what admissions officers weigh. It does NOT mean a strong-academics applicant is likely to be admitted to a selective school — it means that in a pool where nearly everyone has strong academics, the decision turns on fine academic and non-academic margins this profile usually can't capture.

At a genuinely NON-selective school (grounding rate ~75%+, or a Safety tier) the reverse holds: a student who clearly clears the bar should sit near the top of the probability range.`
