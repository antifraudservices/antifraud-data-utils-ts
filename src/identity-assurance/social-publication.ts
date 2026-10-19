import {sha3_384} from '@noble/hashes/sha3.js'

import {
  ManagedSigningAlgorithm,
  ManagedSignatureProofStatus,
  type ManagedSignatureProof,
} from './managed-signing.js'

export const SocialPublicationDemoProfile = Object.freeze({
  Manifest: 'antifraud-social-publication-demo-v1',
  Environment: 'demo',
  Status: 'demo-recorded',
} as const)

export const SocialPublicationDemoAdapter = Object.freeze({
  InMemoryFabric: 'in-memory-fabric-demo',
} as const)

export type SocialPublicationContent = Readonly<{
  mediaId: string
  caption: string
}>

export type SocialPublicationDemoReceipt = Readonly<{
  adapter: typeof SocialPublicationDemoAdapter.InMemoryFabric
  transactionId: string
  recordedAt: string
  cryptographicProof: true
}>

export type SocialPublicationDemoRecord = Readonly<{
  id: string
  environment: typeof SocialPublicationDemoProfile.Environment
  status: typeof SocialPublicationDemoProfile.Status
  content: SocialPublicationContent
  proof: ManagedSignatureProof
  receipt: SocialPublicationDemoReceipt
}>

type SocialPublicationManifestInput = SocialPublicationContent & Readonly<{
  relyingParty: string
  purpose: string
}>

function required(value: string, path: string): string {
  const normalized = String(value).trim()
  if (!normalized) throw new TypeError(`${path} must not be empty`)
  return normalized
}

function instant(value: string, path: string): string {
  const normalized = required(value, path)
  const epoch = Date.parse(normalized)
  if (!Number.isFinite(epoch) || new Date(epoch).toISOString() !== normalized) {
    throw new TypeError(`${path} must be an ISO 8601 UTC instant`)
  }
  return normalized
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function buildSocialPublicationManifestDigest(input: SocialPublicationManifestInput): string {
  const canonical = JSON.stringify({
    profile: SocialPublicationDemoProfile.Manifest,
    mediaId: required(input.mediaId, 'content.mediaId'),
    caption: required(input.caption, 'content.caption'),
    relyingParty: required(input.relyingParty, 'proof.relyingParty'),
    purpose: required(input.purpose, 'proof.purpose'),
  })
  return base64(sha3_384(new TextEncoder().encode(canonical)))
}

export function defineSocialPublicationDemoRecord(input: Readonly<{
  content: SocialPublicationContent
  proof: ManagedSignatureProof
  receipt: SocialPublicationDemoReceipt
}>): SocialPublicationDemoRecord {
  if (input.proof.status !== ManagedSignatureProofStatus.Verified) {
    throw new TypeError('A verified managed-wallet proof is required')
  }
  if (input.proof.algorithm !== ManagedSigningAlgorithm.MlDsa65) {
    throw new TypeError('The publication proof must use ML-DSA-65')
  }
  const expectedDigest = buildSocialPublicationManifestDigest({
    ...input.content,
    relyingParty: input.proof.relyingParty,
    purpose: input.proof.purpose,
  })
  if (input.proof.manifest.digestAlgorithm !== 'sha3-384'
    || input.proof.manifest.digest !== expectedDigest) {
    throw new TypeError('Public content does not match the signed manifest digest')
  }
  if (input.receipt.adapter !== SocialPublicationDemoAdapter.InMemoryFabric) {
    throw new TypeError('The focused MVP requires the explicit Demo adapter')
  }
  if (input.receipt.cryptographicProof !== true) {
    throw new TypeError('The Demo receipt requires a cryptographic proof')
  }
  const proofCreatedAt = instant(input.proof.createdAt, 'proof.createdAt')
  const recordedAt = instant(input.receipt.recordedAt, 'receipt.recordedAt')
  if (Date.parse(recordedAt) < Date.parse(proofCreatedAt)) {
    throw new TypeError('receipt.recordedAt must not precede the proof')
  }
  const content = Object.freeze({
    mediaId: required(input.content.mediaId, 'content.mediaId'),
    caption: required(input.content.caption, 'content.caption'),
  })
  const receipt = Object.freeze({
    adapter: SocialPublicationDemoAdapter.InMemoryFabric,
    transactionId: required(input.receipt.transactionId, 'receipt.transactionId'),
    recordedAt,
    cryptographicProof: true as const,
  })
  return Object.freeze({
    id: required(input.proof.requestId, 'proof.requestId'),
    environment: SocialPublicationDemoProfile.Environment,
    status: SocialPublicationDemoProfile.Status,
    content,
    proof: Object.freeze(structuredClone(input.proof)),
    receipt,
  })
}
