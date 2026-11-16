import {sha256} from '@noble/hashes/sha2.js'
import {Content} from './cryptography/content.js'

const JWK_THUMBPRINT_SHA256_URN_PREFIX='urn:ietf:params:oauth:jwk-thumbprint:sha-256:'

/** Public thumbprint parameters, not a key-validity or private-material publication filter. */
export interface JwkThumbprintInput {
  readonly kty?: string
  readonly crv?: string
  readonly x?: string
  readonly y?: string
  readonly e?: string
  readonly n?: string
  readonly alg?: string
  readonly pub?: string
}

function publicMembers(jwk: JwkThumbprintInput): (keyof JwkThumbprintInput)[] {
  if (jwk.kty === 'EC') return ['crv', 'kty', 'x', 'y']
  if (jwk.kty === 'RSA') return ['e', 'kty', 'n']
  if (jwk.kty === 'OKP') return ['crv', 'kty', 'x']
  if (jwk.kty === 'AKP') return ['alg', 'kty', 'pub']
  throw new Error('Unsupported public JWK thumbprint family.')
}

/** RFC7638 public-member transcript; AKP retains the existing alg/kty/pub extension profile. */
export function computeRfc7638JwkThumbprint(jwk: JwkThumbprintInput): string {
  const members = publicMembers(jwk)
  const transcript = members.map(name => {
    const value = jwk[name]
    if (typeof value !== 'string' || !value) throw new Error(`Public JWK thumbprint requires ${name}.`)
    return `${JSON.stringify(name)}:${JSON.stringify(value)}`
  }).join(',')
  return Content.bytesToRawBase64UrlSafe(sha256(new TextEncoder().encode(`{${transcript}}`)))
}

/** RFC9278 SHA-256 URI framing; computing an identifier does not establish key ownership. */
export function toJwkThumbprintSha256Urn(jwk: JwkThumbprintInput): string {
  return `${JWK_THUMBPRINT_SHA256_URN_PREFIX}${computeRfc7638JwkThumbprint(jwk)}`
}

/** Existing trimmed URI syntax only; this neither validates a digest nor establishes key ownership. */
export function isJwkThumbprintSha256Urn(value: unknown): value is string {
  const normalized=typeof value==='string'?value.trim():''
  return normalized.startsWith(JWK_THUMBPRINT_SHA256_URN_PREFIX)
    && /^[A-Za-z0-9_-]{43}$/u.test(normalized.slice(JWK_THUMBPRINT_SHA256_URN_PREFIX.length))
}
