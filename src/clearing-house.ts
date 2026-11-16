import canonicalizeModule from 'canonicalize'
import { sha256 } from '@noble/hashes/sha2.js'
import {
  createLocalJWKSet, decodeJwt, decodeProtectedHeader, flattenedVerify,
  importJWK, jwtVerify,
  type JWK, type JWTPayload,
} from 'jose'
import type { ICryptography } from './cryptography/cryptography-contract.js'
import type { PublicJwk } from './cryptography/types.js'
import { Content } from './cryptography/content.js'

// The package exposes a CommonJS function; its bundled declaration models an ESM default.
const canonicalize = canonicalizeModule as unknown as (input: unknown) => string | undefined

const signatureAlgorithms = new Set([
  'ES256', 'ES384', 'ES512', 'RS256', 'PS256', 'EdDSA',
  'ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87',
])

/** Public key input accepts both JOSE data and keys returned by the owned engine. */
export type PinnedVerificationKey = JWK | PublicJwk
export type PinnedVerificationKeySet = Readonly<{ keys: readonly PinnedVerificationKey[] }>

export type PinnedJwtOptions = Readonly<{
  audience?: string
  cryptography?: ICryptography
  /** Disable only for signed credential profiles that do not carry JWT bearer times. */
  requireJwtTimes?: boolean
  /** Legacy credentials only: the caller-pinned key must still be unique. */
  allowMissingKid?: boolean
}>

function usableSigningKey(key: JWK, algorithm: string): boolean {
  const privateMembers = ['d', 'k', 'priv', 'dBytes', 'p', 'q', 'dp', 'dq', 'qi', 'oth']
  return !!key && typeof key === 'object'
    && !privateMembers.some(member => Object.prototype.hasOwnProperty.call(key, member))
    && (!key.use || key.use === 'sig') && (!key.alg || key.alg === algorithm)
    && (key.key_ops === undefined || (Array.isArray(key.key_ops) && key.key_ops.includes('verify')))
}

function assertClock(now: number): void {
  if (!Number.isFinite(now) || now < 0 || !Number.isFinite(new Date(now * 1000).getTime())) throw new Error('Verification requires a finite current time in seconds.')
}

/** Verify only with caller-pinned keys; embedded keys and key URLs never establish trust. */
export async function verifyPinnedJwt(
  compact: string, jwks: PinnedVerificationKeySet, issuer: string, now: number,
  options: PinnedJwtOptions = {},
): Promise<JWTPayload> {
  assertClock(now)
  if (!issuer || typeof compact !== 'string' || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(compact)) {
    throw new Error('A signed compact JWT and expected issuer are required.')
  }
  const header = decodeProtectedHeader(compact)
  if (header.crit !== undefined || (header.b64 !== undefined && header.b64 !== true)) {
    throw new Error('Unsupported critical JWT extension or payload encoding.')
  }
  const algorithm = String(header.alg || '')
  if (!signatureAlgorithms.has(algorithm)) throw new Error('Unsupported signed JWT algorithm.')
  if (header.kid !== undefined && (typeof header.kid !== 'string' || !header.kid.trim())) {
    throw new Error('JWT signing key identifier is invalid.')
  }
  const keys = Array.isArray(jwks?.keys) ? jwks.keys.map(key => key as JWK).filter(key =>
    (header.kid ? key.kid === header.kid : options.allowMissingKid === true)
    && usableSigningKey(key, algorithm)) : []
  if ((!header.kid && !options.allowMissingKid) || keys.length !== 1) {
    throw new Error('JWT signing key is not uniquely trusted.')
  }
  let payload: JWTPayload
  if (algorithm.startsWith('ML-DSA-')) {
    if (keys[0].kty !== 'AKP' || keys[0].alg !== algorithm || !options.cryptography) {
      throw new Error('A pinned AKP key and post-quantum verifier are required.')
    }
    if (!await options.cryptography.verifyJws(compact, keys[0] as PublicJwk)) throw new Error('Invalid JWT signature.')
    payload = decodeJwt(compact)
  } else {
    ;({ payload } = await jwtVerify(compact, createLocalJWKSet({ keys }), {
      algorithms: [algorithm], currentDate: new Date(now * 1000),
    }))
  }
  const credentialIssuer = options.requireJwtTimes === false
    ? typeof payload.issuer === 'string' ? payload.issuer
      : payload.issuer && typeof payload.issuer === 'object' ? (payload.issuer as { id?: unknown }).id : undefined
    : undefined
  if ((payload.iss ?? credentialIssuer) !== issuer) throw new Error('JWT issuer mismatch.')
  if (options.audience !== undefined) {
    const valid = typeof payload.aud === 'string' ? payload.aud === options.audience
      : Array.isArray(payload.aud) && payload.aud.every(value => typeof value === 'string') && payload.aud.includes(options.audience)
    if (!options.audience || !valid) throw new Error('JWT audience mismatch.')
  }
  if (options.requireJwtTimes !== false && (typeof payload.iat !== 'number' || typeof payload.exp !== 'number'
    || typeof payload.jti !== 'string' || !payload.jti.trim())) {
    throw new Error('JWT requires issued-at, expiry and a unique string identifier.')
  }
  if ((payload.exp !== undefined && (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= now))
    || (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > now))
    || (payload.iat !== undefined && (typeof payload.iat !== 'number' || !Number.isFinite(payload.iat) || payload.iat > now + 30))) {
    throw new Error('JWT is outside its validity period.')
  }
  return payload
}

/** Verify the exact caller-supplied payload bytes with one explicitly pinned public key. */
export async function verifyPinnedDetachedJws(
  payloadBytes: Uint8Array, compact: string, pinnedKey: PinnedVerificationKey, cryptography?: ICryptography,
): Promise<void> {
  if (!(payloadBytes instanceof Uint8Array) || typeof compact !== 'string'
    || !/^[A-Za-z0-9_-]+\.\.[A-Za-z0-9_-]+$/u.test(compact)) {
    throw new Error('Invalid detached signature.')
  }
  const key = pinnedKey as JWK
  const parts = compact.split('.')
  const header = decodeProtectedHeader(compact)
  const algorithm = String(header.alg || '')
  if (!signatureAlgorithms.has(algorithm) || !usableSigningKey(key, algorithm)) {
    throw new Error('Unsupported detached signature algorithm or key.')
  }
  if (header.kid !== undefined && (typeof header.kid !== 'string' || !header.kid.trim() || (key.kid !== undefined && header.kid !== key.kid))) {
    throw new Error('Detached signature key identifier mismatch.')
  }
  if ((header.b64 !== undefined && typeof header.b64 !== 'boolean')
    || (header.crit !== undefined && (!Array.isArray(header.crit) || header.crit.length !== 1 || header.crit[0] !== 'b64'))
    || (header.crit !== undefined && header.b64 === undefined)
    || (header.b64 === false && header.crit?.[0] !== 'b64')) {
    throw new Error('Unsupported critical detached signature extension or encoding.')
  }
  if (algorithm.startsWith('ML-DSA-')) {
    if (key.kty !== 'AKP' || key.alg !== algorithm || !cryptography
      || !await cryptography.verifyDetachedJws(payloadBytes, compact, key as PublicJwk)) {
      throw new Error('Invalid detached post-quantum signature.')
    }
    return
  }
  await flattenedVerify({
    protected: parts[0],
    payload: header.b64 === false ? payloadBytes : Content.bytesToRawBase64UrlSafe(payloadBytes),
    signature: parts[2],
  }, await importJWK(key, algorithm), { algorithms: [algorithm] })
}

/** SHA-256 hexadecimal digest of canonical JSON; no Node-only platform API is used. */
export function canonicalRequestDigest(value: unknown): string {
  const canonical = canonicalize(value)
  if (canonical === undefined) throw new Error('Request digest requires JSON data.')
  return Array.from(sha256(new TextEncoder().encode(canonical)), byte => byte.toString(16).padStart(2, '0')).join('')
}

export type SignedReceiptExpectation = Readonly<{
  /** Fresh nonce retained by the caller for this exact outstanding request. */
  nonce: string
  /** When the receipt protocol includes request_hash, bind its canonical request digest. */
  requestDigest?: string
  /** If supplied, require a requested acr and a nonempty array of string methods. */
  acceptedAssurance?: readonly string[]
  /** Exact caller-required wire claims; domain and ledger policy remain caller-owned. */
  requiredClaims?: Readonly<Record<string, unknown>>
}>

/**
 * Validate bindings only after signature, issuer, audience and time verification.
 * The caller generates fresh nonces and owns replay consumption and current-state checks.
 */
export function assertSignedReceiptBinding(payload: JWTPayload, expected: SignedReceiptExpectation): void {
  if (!payload || !expected || typeof expected.nonce !== 'string' || !expected.nonce.trim()
    || payload.nonce !== expected.nonce) throw new Error('Receipt nonce does not match the current request.')
  if (expected.requestDigest !== undefined && (!/^[0-9a-f]{64}$/u.test(expected.requestDigest)
    || payload.request_hash !== expected.requestDigest)) throw new Error('Receipt request digest mismatch.')
  if (expected.acceptedAssurance !== undefined && (!Array.isArray(expected.acceptedAssurance)
    || !expected.acceptedAssurance.length || !expected.acceptedAssurance.every(value => typeof value === 'string' && value.trim())
    || typeof payload.acr !== 'string' || !expected.acceptedAssurance.includes(payload.acr)
    || !Array.isArray(payload.amr) || !payload.amr.length || !payload.amr.every(value => typeof value === 'string' && value.trim()))) {
    throw new Error('Receipt assurance does not match the requested context.')
  }
  for (const [claim, value] of Object.entries(expected.requiredClaims ?? {})) {
    const canonicalExpected = canonicalize(value)
    if (canonicalExpected === undefined || !Object.prototype.hasOwnProperty.call(payload, claim)
      || canonicalExpected !== canonicalize(payload[claim])) throw new Error(`Receipt binding mismatch: ${claim}.`)
  }
}

/** Caller-owned trust configuration; request content never chooses its verifier or keys. */
export type TenantClearingHouseTrust = Readonly<{
  homeTenantReference: string
  sourceTenant: Readonly<{ tenantReference: string; endpoint: string; capabilities: readonly string[] }>
  trustedFederatedTenantReferences: readonly string[]
  issuer: string
  audience: string
  jwks: PinnedVerificationKeySet
}>

/** Pure trust validation. Only a test-environment wrapper may enable loopback HTTP. */
export function assertTenantClearingHouseTrust(
  trust: TenantClearingHouseTrust, tenantDid: string, allowLocalTestEndpoint = false,
): URL {
  if (!trust || !tenantDid || trust.homeTenantReference !== tenantDid || trust.audience !== tenantDid) {
    throw new Error('Verifier trust must belong to the requesting tenant.')
  }
  const source = trust.sourceTenant
  if (!source || !Array.isArray(source.capabilities) || !source.capabilities.includes('verifier')
    || !source.tenantReference || trust.issuer !== source.tenantReference) {
    throw new Error('The trusted source must advertise the verifier capability.')
  }
  if (source.tenantReference !== tenantDid && (!Array.isArray(trust.trustedFederatedTenantReferences)
    || !trust.trustedFederatedTenantReferences.includes(source.tenantReference))) {
    throw new Error('The verifier source tenant is not explicitly trusted.')
  }
  const endpoint = new URL(source.endpoint)
  const loopback = allowLocalTestEndpoint && endpoint.protocol === 'http:' && ['127.0.0.1', '[::1]'].includes(endpoint.hostname)
  if ((!loopback && endpoint.protocol !== 'https:') || endpoint.username || endpoint.password || endpoint.hash) {
    throw new Error('Verifier endpoint requires HTTPS without credentials or fragments.')
  }
  if (!Array.isArray(trust.jwks?.keys) || !trust.jwks.keys.length) throw new Error('Pinned verification keys are required.')
  return endpoint
}
