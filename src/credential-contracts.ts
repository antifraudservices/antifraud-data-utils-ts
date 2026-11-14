import type { JwsHeader } from './cryptography/jws-types.js'
import type { JwtRegisteredClaims } from './openid-contracts.js'

export const W3cCredentialContexts = Object.freeze({
  V1: 'https://www.w3.org/2018/credentials/v1',
  V2: 'https://www.w3.org/ns/credentials/v2',
} as const)
export const W3cCredentialTypes = Object.freeze({
  VerifiableCredential: 'VerifiableCredential',
  VerifiablePresentation: 'VerifiablePresentation',
} as const)
export const VC_CONTEXT_V2 = W3cCredentialContexts.V2

/** Supported proof data projection. Its presence does not establish a verified signature or a trust framework. */
export interface CredentialProof {
  type: string
  created?: string
  jws?: string
  proofPurpose?: string
  verificationMethod?: string
  [extension: string]: unknown
}

/**
 * Existing credential consumer profile: one object subject, string issuer and
 * required validFrom. This is narrower than every possible W3C credential.
 * Unknown defaults retain the need to validate untrusted subject/evidence data.
 */
export interface VerifiableCredentialV2<Subject extends object = Record<string, unknown>, Evidence = unknown> {
  '@context': string[]
  id?: string
  type: string[]
  credentialSubject: Subject extends readonly unknown[] ? never : Subject
  evidence?: Evidence[]
  issuer: string
  proof?: CredentialProof | CredentialProof[]
  validFrom: string
  validUntil?: string
}

/** Encoded or decoded input only; neither form is verified by assigning this type. */
export type VpCredentialInput = string | Record<string, unknown> | VerifiableCredentialV2<object>
export type VpCredential = Record<string, unknown>

/** Supported decoded JWT presentation data; not the complete set of native W3C presentation forms. */
export interface VpTokenPayload extends JwtRegisteredClaims {
  iss: string
  aud?: string
  nonce?: string
  vp: {
    '@context'?: unknown
    type?: unknown
    holder?: string
    verifiableCredential: VpCredentialInput[]
    [extension: string]: unknown
  }
  [extension: string]: unknown
}

/** Presentation header profile makes the key ID optional; algorithm metadata is not algorithm validation. */
export type VpTokenHeader = Pick<JwsHeader, 'alg' | 'typ'> & Partial<Pick<JwsHeader, 'kid'>> & {
  [extension: string]: unknown
}
