import type { IdentityAttestationCapability } from './identity-assurance/vocabulary.js'

/** Requested data only; current authority and permitted scope are resolved by the server. */
export type CredentialPresentationRequest = Readonly<{
  nonce: string
  resourceReference: string
  jurisdiction: string
  capability: typeof IdentityAttestationCapability.VerifyClaim
}>
export type CredentialPresentationSubmission = Readonly<{
  request: CredentialPresentationRequest
  presentation: string
}>
/** A result is produced only after signature, current-state and use-policy verification. */
export type CredentialPresentationVerificationResult = Readonly<{
  verified: true
  tenantReference: string
  actorReference: string
  credentialReferences: readonly string[]
  requestHash: string
  checkedAt: string
  stateProvider: 'memory' | 'fabric'
}>
export type GaiaXComplianceSubmission = Readonly<{ presentation: string }>
/** Server transport for the original signed engine artifact, distinct from its input presentation. */
export type GaiaXComplianceVerificationResult = Readonly<{
  credentialJwt: string
  credential: Readonly<Record<string, unknown>>
}>
