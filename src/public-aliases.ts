import { hashCanonicalActorContact } from './encoding/actor-contact-hash.js'

const MULTIBASE_URN = 'urn:multibase:'
const bareMultibase = (value: string): boolean => /^z\S+$/u.test(value)

function exchangeHashEnvelope(value: string): string | undefined {
  if (value.toLowerCase().startsWith(MULTIBASE_URN)) {
    const suffix = value.slice(MULTIBASE_URN.length).trim()
    return bareMultibase(suffix) ? MULTIBASE_URN + suffix : value
  }
  return bareMultibase(value) ? MULTIBASE_URN + value : undefined
}

function ownStringArray(value: readonly unknown[]): string[] {
  const length = Object.getOwnPropertyDescriptor(value, 'length')?.value
  if (typeof length !== 'number') return []
  const keys = Object.getOwnPropertyNames(value)
    .filter(key => /^(?:0|[1-9][0-9]*)$/u.test(key) && Number(key) < length)
    .sort((left, right) => Number(left) - Number(right))
  const result: string[] = []
  for (const key of keys) {
    const entry = Object.getOwnPropertyDescriptor(value, key)
    if (!entry || !Object.hasOwn(entry, 'value') || typeof entry.value !== 'string') return []
    result.push(entry.value)
  }
  return result
}

/** Split opaque CSV aliases without hashing emails or reinterpreting CID values that start with z. */
export function normalizePublicAliasList(value: unknown): string[] {
  const entries = typeof value === 'string' ? [value] : Array.isArray(value) ? ownStringArray(value) : []
  return [...new Set(entries.flatMap(entry => entry.split(',')).map(entry => entry.trim()).filter(Boolean))]
}

/** Exchange alias compatibility, not strict contact validation, multihash verification or authority. */
export function normalizeControllerAlias(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const envelope = exchangeHashEnvelope(trimmed)
  if (envelope !== undefined) return envelope
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(trimmed)) return hashCanonicalActorContact(trimmed.toLowerCase())
  return trimmed
}

/** Formatted or already-hashed exchange telephone aliases; normalizeActorContact remains the strict E.164 API. */
export function normalizeTelephoneAlias(value: unknown): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  const envelope = exchangeHashEnvelope(trimmed)
  if (envelope !== undefined) return envelope
  const telephone = trimmed.replace(/[^\d+]/gu, '')
  return telephone ? hashCanonicalActorContact(telephone) : ''
}
