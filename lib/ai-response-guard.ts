// Detects the rare structured-output corruption seen from gpt-5.6-terra and
// gpt-5.6-luna during model comparison testing: internal role/channel tokens
// (e.g. "assistant to=system", "to=final") or a run of zero-width-joiner
// characters leaking into an otherwise-valid JSON field, sometimes alongside
// unrelated foreign-language spam. Schema validation alone doesn't catch
// this — the field is still a syntactically valid string, just garbage.
const GARBLED_PATTERNS = [/assistant\s+to=/i, /\bto=(final|system)\b/i, /‍{5,}/, /analysis\s+to=/i]

export function isGarbledText(value: string): boolean {
  return GARBLED_PATTERNS.some((pattern) => pattern.test(value))
}

export function isGarbledStrings(values: string[]): boolean {
  return values.some(isGarbledText)
}
