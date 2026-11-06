export const PostQuantumDetachedProofPrefix = 'pqc:/' as const
export const PostQuantumDetachedProofDefaultQrCount = 2

const ML_DSA_ALGORITHMS = new Set(['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'])

/** Wraps a validated RFC 7797 detached ML-DSA JWS without interpreting its external payload. */
export function encodePostQuantumDetachedProofUri(detachedJws: string): string {
  return `${PostQuantumDetachedProofPrefix}${validateDetachedJws(detachedJws)}`
}

export function decodePostQuantumDetachedProofUri(uri: string): string {
  if (typeof uri !== 'string' || !uri.startsWith(PostQuantumDetachedProofPrefix)) {
    throw new TypeError('pqc_detached_proof_uri_invalid')
  }
  return validateDetachedJws(uri.slice(PostQuantumDetachedProofPrefix.length))
}

/**
 * Encodes only the detached proof as decimal QR chunks. The signed JSON:API,
 * VC, SHC or other external payload is deliberately not duplicated.
 */
export function encodePostQuantumDetachedProofQr(
  detachedJws: string,
  options: Readonly<{ qrCount?: number }> = {},
): readonly string[] {
  const validated = validateDetachedJws(detachedJws)
  const count = options.qrCount ?? PostQuantumDetachedProofDefaultQrCount
  if (!Number.isInteger(count) || count < 1 || count > 99 || count > validated.length) {
    throw new TypeError('pqc_detached_proof_qr_count_invalid')
  }
  const chunkLength = Math.ceil(validated.length / count)
  if (count === 1) return Object.freeze([`${PostQuantumDetachedProofPrefix}${encodeNumericQrValue(validated, 'pqc_detached_proof_character_invalid')}`])
  return Object.freeze(Array.from({ length: count }, (_, index) => {
    const chunk = validated.slice(index * chunkLength, (index + 1) * chunkLength)
    return `${PostQuantumDetachedProofPrefix}${index + 1}/${count}/${encodeNumericQrValue(chunk, 'pqc_detached_proof_character_invalid')}`
  }))
}

export function decodePostQuantumDetachedProofQr(values: readonly string[]): string {
  if (!Array.isArray(values) || values.length === 0) throw new TypeError('pqc_detached_proof_qr_required')
  if (values.length === 1 && /^pqc:\/\d+$/u.test(values[0] ?? '')) {
    return validateDetachedJws(decodeNumericQrValue(values[0]!.slice(PostQuantumDetachedProofPrefix.length), 'pqc_detached_proof_numeric_body_invalid'))
  }
  const chunks = values.map(value => {
    const match = /^pqc:\/(\d+)\/(\d+)\/(\d+)$/u.exec(value)
    if (!match) throw new TypeError('pqc_detached_proof_qr_chunk_invalid')
    return { index: Number(match[1]), count: Number(match[2]), value: decodeNumericQrValue(match[3]!, 'pqc_detached_proof_numeric_body_invalid') }
  })
  const expected = chunks[0]!.count
  if (expected !== chunks.length
    || chunks.some(chunk => chunk.count !== expected || chunk.index < 1 || chunk.index > expected)
    || new Set(chunks.map(chunk => chunk.index)).size !== expected) {
    throw new TypeError('pqc_detached_proof_qr_chunk_set_invalid')
  }
  return validateDetachedJws([...chunks].sort((left, right) => left.index - right.index).map(chunk => chunk.value).join(''))
}

function validateDetachedJws(value: string): string {
  const match = /^([A-Za-z0-9_-]+)\.\.([A-Za-z0-9_-]+)$/u.exec(String(value || ''))
  if (!match) throw new TypeError('pqc_detached_jws_invalid')
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(match[1]!))) as Record<string, unknown>
    if (!ML_DSA_ALGORITHMS.has(String(header.alg))
      || typeof header.kid !== 'string' || !header.kid
      || header.b64 !== false
      || !Array.isArray(header.crit) || !header.crit.includes('b64')) {
      throw new TypeError('pqc_detached_jws_invalid')
    }
  } catch {
    throw new TypeError('pqc_detached_jws_invalid')
  }
  return value
}

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(normalized)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

import { decodeNumericQrValue, encodeNumericQrValue } from './numeric-qr.js'

