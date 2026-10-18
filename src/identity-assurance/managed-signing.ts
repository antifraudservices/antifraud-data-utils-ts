import { SyntheticConfidentialDocumentFixture } from './confidential-document.js'

export const ManagedSignatureRequestState = Object.freeze({
  Pending: 'pending',
  Authorized: 'authorized',
  Rejected: 'rejected',
  Cancelled: 'cancelled',
  Expired: 'expired',
  Signed: 'signed',
  Failed: 'failed',
} as const)

export type ManagedSignatureRequestStateValue =
  typeof ManagedSignatureRequestState[keyof typeof ManagedSignatureRequestState]

export const UserPresenceMethod = Object.freeze({
  Biometric: 'biometric',
  Pin: 'pin',
  Password: 'password',
} as const)

export type UserPresenceMethodValue =
  typeof UserPresenceMethod[keyof typeof UserPresenceMethod]

export const ManagedSigningAlgorithm = Object.freeze({
  MlDsa65: 'ML-DSA-65',
} as const)

export const ManagedSigningKeyPurpose = Object.freeze({
  ActorSigning: 'actor-signing',
} as const)

export type ManagedSignatureManifestBinding = Readonly<{
  id: string
  version: string
  digestAlgorithm: 'sha3-384'
  digest: string
}>

export type ManagedSignatureRequestDraft = Readonly<{
  requestId: string
  operationId: string
  manifest: ManagedSignatureManifestBinding
  createdAt: string
  expiresAt: string
}>

export type ManagedSignatureTrustedContext = Readonly<{
  authenticatedUserId: string
  registeredDeviceId: string
  relyingParty: string
  purpose: string
  signerReference: string
  signingKey: Readonly<{
    purpose: typeof ManagedSigningKeyPurpose.ActorSigning
    algorithm: typeof ManagedSigningAlgorithm.MlDsa65
    verificationMethod: string
  }>
}>

export type ManagedSignatureRequest = ManagedSignatureRequestDraft
  & ManagedSignatureTrustedContext
  & Readonly<{ state: typeof ManagedSignatureRequestState.Pending }>

export const ManagedSignatureProofStatus = Object.freeze({
  Verified: 'verified',
} as const)

export type ManagedSignatureProof = Readonly<{
  proofId: string
  requestId: string
  operationId: string
  manifest: ManagedSignatureManifestBinding
  relyingParty: string
  purpose: string
  signerReference: string
  algorithm: typeof ManagedSigningAlgorithm.MlDsa65
  verificationMethod: string
  createdAt: string
  signature: string
  status: typeof ManagedSignatureProofStatus.Verified
}>

export type ManagedSignatureProofResult = Readonly<{
  proofId: string
  signature: string
  createdAt: string
  verified: boolean
}>

const CLIENT_FORBIDDEN_AUTHORITY = Object.freeze([
  'authenticatedUserId',
  'registeredDeviceId',
  'relyingParty',
  'purpose',
  'signerReference',
  'signingKey',
  'verificationMethod',
])

const REQUEST_BOUND_PROOF_FIELDS = Object.freeze([
  'requestId',
  'operationId',
  'manifest',
  'manifestDigest',
  'relyingParty',
  'purpose',
  'signerReference',
  'algorithm',
  'verificationMethod',
  'status',
])

function requireNonEmpty(value: string, path: string): string {
  const normalized = String(value).trim()
  if (!normalized) throw new TypeError(`${path} must not be empty`)
  return normalized
}

function requireIsoInstant(value: string, path: string): string {
  const normalized = requireNonEmpty(value, path)
  const epoch = Date.parse(normalized)
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== normalized) {
    throw new TypeError(`${path} must be an ISO 8601 UTC instant`)
  }
  return normalized
}

function assertSha3_384Base64(value: string): string {
  const normalized = requireNonEmpty(value, 'manifest.digest')
  if (!/^(?:[A-Za-z0-9+/]{4}){16}$/u.test(normalized)) {
    throw new TypeError('manifest.digest must be a base64-encoded 48-byte SHA3-384 digest')
  }
  return normalized
}

/**
 * Builds one pending request from browser-controlled manifest continuity and
 * trusted backend identity, device, purpose, relying-party and key context.
 */
export function defineManagedSignatureRequest(
  draft: ManagedSignatureRequestDraft & Readonly<Record<string, unknown>>,
  trustedContext: ManagedSignatureTrustedContext,
): ManagedSignatureRequest {
  for (const property of CLIENT_FORBIDDEN_AUTHORITY) {
    if (Object.hasOwn(draft, property)) {
      throw new TypeError(`Browser draft contains server-owned signing authority (${property})`)
    }
  }
  if (trustedContext.signingKey.algorithm !== ManagedSigningAlgorithm.MlDsa65) {
    throw new TypeError('Managed manifest signing requires ML-DSA-65')
  }
  if (trustedContext.signingKey.purpose !== ManagedSigningKeyPurpose.ActorSigning) {
    throw new TypeError('Managed manifest signing requires the actor-signing key purpose')
  }

  const createdAt = requireIsoInstant(draft.createdAt, 'createdAt')
  const expiresAt = requireIsoInstant(draft.expiresAt, 'expiresAt')
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) {
    throw new TypeError('expiresAt must be after createdAt')
  }
  if (draft.manifest.digestAlgorithm !== 'sha3-384') {
    throw new TypeError('manifest.digestAlgorithm must be sha3-384')
  }

  const manifest = Object.freeze({
    id: requireNonEmpty(draft.manifest.id, 'manifest.id'),
    version: requireNonEmpty(draft.manifest.version, 'manifest.version'),
    digestAlgorithm: 'sha3-384' as const,
    digest: assertSha3_384Base64(draft.manifest.digest),
  })
  const signingKey = Object.freeze({
    purpose: ManagedSigningKeyPurpose.ActorSigning,
    algorithm: ManagedSigningAlgorithm.MlDsa65,
    verificationMethod: requireNonEmpty(
      trustedContext.signingKey.verificationMethod,
      'signingKey.verificationMethod',
    ),
  })

  return Object.freeze({
    requestId: requireNonEmpty(draft.requestId, 'requestId'),
    operationId: requireNonEmpty(draft.operationId, 'operationId'),
    manifest,
    createdAt,
    expiresAt,
    authenticatedUserId: requireNonEmpty(
      trustedContext.authenticatedUserId,
      'authenticatedUserId',
    ),
    registeredDeviceId: requireNonEmpty(
      trustedContext.registeredDeviceId,
      'registeredDeviceId',
    ),
    relyingParty: requireNonEmpty(trustedContext.relyingParty, 'relyingParty'),
    purpose: requireNonEmpty(trustedContext.purpose, 'purpose'),
    signerReference: requireNonEmpty(
      trustedContext.signerReference,
      'signerReference',
    ),
    signingKey,
    state: ManagedSignatureRequestState.Pending,
  })
}

/**
 * Projects verified wallet output into public proof metadata while copying all
 * authority and manifest bindings from the immutable request.
 */
export function defineManagedSignatureProof(
  request: ManagedSignatureRequest,
  result: ManagedSignatureProofResult & Readonly<Record<string, unknown>>,
): ManagedSignatureProof {
  for (const property of REQUEST_BOUND_PROOF_FIELDS) {
    if (Object.hasOwn(result, property)) {
      throw new TypeError(`Wallet result contains request-bound proof field (${property})`)
    }
  }
  if (result.verified !== true) {
    throw new TypeError('Managed signature proof must be verified before projection')
  }
  const signature = requireNonEmpty(result.signature, 'signature')
  if (!/^[A-Za-z0-9_-]+$/u.test(signature)) {
    throw new TypeError('signature must be unpadded base64url')
  }
  const createdAt = requireIsoInstant(result.createdAt, 'proof.createdAt')
  if (
    Date.parse(createdAt) < Date.parse(request.createdAt)
    || Date.parse(createdAt) > Date.parse(request.expiresAt)
  ) {
    throw new TypeError('proof.createdAt must fall within the signature request lifetime')
  }
  return Object.freeze({
    proofId: requireNonEmpty(result.proofId, 'proofId'),
    requestId: request.requestId,
    operationId: request.operationId,
    manifest: request.manifest,
    relyingParty: request.relyingParty,
    purpose: request.purpose,
    signerReference: request.signerReference,
    algorithm: ManagedSigningAlgorithm.MlDsa65,
    verificationMethod: request.signingKey.verificationMethod,
    createdAt,
    signature,
    status: ManagedSignatureProofStatus.Verified,
  })
}

/** Synthetic, non-sensitive fixture shared by SDK, gateway and portal tests. */
export const SyntheticManagedSignatureRequestFixture = Object.freeze({
  draft: Object.freeze({
    requestId: 'urn:signature-request:synthetic-publication-v1',
    operationId: 'urn:operation:synthetic-publication-signing-v1',
    manifest: Object.freeze({
      id: SyntheticConfidentialDocumentFixture.manifest.id,
      version: SyntheticConfidentialDocumentFixture.manifest.version,
      digestAlgorithm: 'sha3-384' as const,
      digest: SyntheticConfidentialDocumentFixture.attachment.digest,
    }),
    createdAt: '2026-10-18T20:00:00.000Z',
    expiresAt: '2026-10-18T20:05:00.000Z',
  }),
  trustedContext: Object.freeze({
    authenticatedUserId: 'urn:user:synthetic-signer',
    registeredDeviceId: 'urn:device:synthetic-signer-primary',
    relyingParty: 'https://social-demo.antifraud.services',
    purpose: 'synthetic-publication-manifest-signing',
    signerReference: 'did:example:synthetic-signer',
    signingKey: Object.freeze({
      purpose: ManagedSigningKeyPurpose.ActorSigning,
      algorithm: ManagedSigningAlgorithm.MlDsa65,
      verificationMethod: 'did:example:synthetic-signer#actor-signing-ml-dsa-65',
    }),
  }),
})
