import { Content } from './cryptography/content.js'

/** Shallow own-data projection only; nested values remain opaque and unvalidated. */
function copyPlainDataObject(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined
  try {
    if (Array.isArray(value)) return undefined
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) return undefined
    const descriptors = Object.getOwnPropertyDescriptors(value)
    const entries: Array<[string, unknown]> = []
    for (const key of Reflect.ownKeys(descriptors)) {
      if (typeof key !== 'string') return undefined
      const descriptor = descriptors[key]
      if (!Object.hasOwn(descriptor, 'value')) return undefined
      if (descriptor.enumerable) entries.push([key, descriptor.value])
    }
    // Create data properties rather than assigning an own __proto__ through a setter.
    return Object.fromEntries(entries)
  } catch {
    return undefined
  }
}

/**
 * Reads an unverified object from raw JSON, a compact payload or a plain data
 * object. This does not verify any JOSE segment, issuer, signature or claim.
 */
export function decodeUnverifiedJsonOrJwtObject(input: unknown): Record<string, unknown> | undefined {
  if (typeof input !== 'string') return copyPlainDataObject(input)
  const raw = input.trim()
  if (!raw || raw.startsWith('[') || raw.startsWith('"')) return undefined
  try {
    if (raw.startsWith('{')) return copyPlainDataObject(JSON.parse(raw))
    const parts = raw.split('.')
    if (parts.length !== 3 || !parts[1]) return undefined
    return copyPlainDataObject(Content.base64UrlSafeToJSON(parts[1]))
  } catch {
    return undefined
  }
}

/**
 * Collects own presentation credential entries as unverified data. Business
 * credential types, signatures, issuer trust and authorization are caller policy.
 */
export function extractUnverifiedPresentationCredentials(input: unknown): Record<string, unknown>[] {
  const payload = decodeUnverifiedJsonOrJwtObject(input)
  if (!payload) return []
  try {
    const vpField = Object.getOwnPropertyDescriptor(payload, 'vp')
    const vp = vpField && Object.hasOwn(vpField, 'value') ? copyPlainDataObject(vpField.value) : undefined
    if (!vp) return []
    const credentialsField = Object.getOwnPropertyDescriptor(vp, 'verifiableCredential')
    if (!credentialsField || !Object.hasOwn(credentialsField, 'value') || !Array.isArray(credentialsField.value)) return []
    const credentials: Record<string, unknown>[] = []
    // Enumerating own descriptors avoids inherited indices, custom iterators,
    // index accessors and a loop over an attacker-controlled sparse array length.
    for (const [index, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(credentialsField.value))) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(index) || Number(index) >= 0xffffffff || !Object.hasOwn(descriptor, 'value')) continue
      const credential = decodeUnverifiedJsonOrJwtObject(descriptor.value)
      if (credential) credentials.push(credential)
    }
    return credentials
  } catch {
    return []
  }
}
