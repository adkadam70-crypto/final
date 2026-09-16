// Split out of app/actions/profile-level.ts — a 'use server' file can only
// export async functions (Next.js rejects any other export, including a
// plain const object), so the level-name lookup and the EmeraldLevel type
// live here instead and get imported into that action file for internal
// use.
export type EmeraldLevel = 1 | 2 | 3 | 4 | 5

export const LEVEL_NAMES: Record<EmeraldLevel, string> = {
  1: 'Uncut',
  2: 'Rough-Cut',
  3: 'Polished',
  4: 'Faceted',
  5: 'Brilliant',
}
