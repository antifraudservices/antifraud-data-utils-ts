import {
  SchemaOrgIdentityClaim,
  type SchemaOrgIdentityClaimValue,
} from './vocabulary.js'

export const ClaimProofFormat = Object.freeze({
  IetfSdJwtVc: 'ietf-sd-jwt-vc',
  IsoMdoc: 'iso-18013-5-mdoc',
  W3cVcDataIntegrity: 'w3c-vc-data-integrity',
  W3cVcJoseCose: 'w3c-vc-jose-cose',
  OidcVerifiedClaims: 'oidc-verified-claims',
  ExternalSignedEvidence: 'external-signed-evidence',
} as const)

export type ClaimProofFormatValue =
  typeof ClaimProofFormat[keyof typeof ClaimProofFormat]

export const ClaimCryptographicBinding = Object.freeze({
  IssuerSignatureWithDisclosureDigests: 'issuer-signature-with-disclosure-digests',
  IssuerSignedDataElement: 'issuer-signed-data-element',
  CredentialProof: 'credential-proof',
  ExternalVerificationResult: 'external-verification-result',
  SignedEvidence: 'signed-evidence',
} as const)

export type ClaimCryptographicBindingValue =
  typeof ClaimCryptographicBinding[keyof typeof ClaimCryptographicBinding]

export const ClaimProofStatus = Object.freeze({
  Active: 'active',
  Suspended: 'suspended',
  Revoked: 'revoked',
  Expired: 'expired',
} as const)

export type ClaimProofStatusValue =
  typeof ClaimProofStatus[keyof typeof ClaimProofStatus]

export const IdentityPredicateKind = Object.freeze({
  AgeOver: 'age-over',
} as const)

export type ClaimProofReference = Readonly<{
  id: string
  format: ClaimProofFormatValue
  issuer: string
  credentialReference: string
  cryptographicBinding: ClaimCryptographicBindingValue
  status: ClaimProofStatusValue
  disclosureDigest?: string
  verificationMethod?: string
  issuedAt?: string
  expiresAt?: string
}>

export type DirectClaimProofTarget = Readonly<{
  kind: 'claim'
  claimPath: SchemaOrgIdentityClaimValue
}>

export type AgeOverPredicateProofTarget = Readonly<{
  kind: 'predicate'
  predicate: typeof IdentityPredicateKind.AgeOver
  sourceClaimPath: typeof SchemaOrgIdentityClaim.PersonBirthDate
  threshold: number
  result: boolean
}>

export type ClaimProofTarget = DirectClaimProofTarget | AgeOverPredicateProofTarget

export type ClaimProofBinding = Readonly<{
  target: ClaimProofTarget
  proofs: readonly [ClaimProofReference, ...ClaimProofReference[]]
}>

function assertAgeThreshold(threshold: number): void {
  if (!Number.isInteger(threshold) || threshold < 1 || threshold > 150) {
    throw new TypeError('Age-over threshold must be an integer between 1 and 150')
  }
}

export function eudiPidAgeOverClaimName(threshold: number): `age_over_${number}` {
  assertAgeThreshold(threshold)
  return `age_over_${threshold}`
}

export function defineClaimProofBinding(input: Readonly<{
  target: ClaimProofTarget
  proofs: readonly ClaimProofReference[]
}>): ClaimProofBinding {
  if (input.proofs.length === 0) {
    throw new TypeError('A claim or predicate must have at least one proof')
  }
  if (input.target.kind === 'predicate') {
    assertAgeThreshold(input.target.threshold)
  }
  return Object.freeze({
    target: Object.freeze({ ...input.target }),
    proofs: Object.freeze([...input.proofs]) as unknown as ClaimProofBinding['proofs'],
  })
}
