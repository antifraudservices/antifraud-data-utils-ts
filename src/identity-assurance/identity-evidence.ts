import {
  IdentityAttestationCapability,
  SchemaOrgIdentityClaim,
  type IdentityAttestationCapabilityValue,
} from './vocabulary.js'
import { IdentityPredicateKind } from './claim-proofs.js'

/** Evidence types registered by OpenID Identity Assurance. */
export const IdentityEvidenceType = Object.freeze({
  Document: 'document',
  ElectronicRecord: 'electronic_record',
  Vouch: 'vouch',
  ElectronicSignature: 'electronic_signature',
} as const)

export type IdentityEvidenceTypeValue =
  typeof IdentityEvidenceType[keyof typeof IdentityEvidenceType]

export type IdentityEvidenceAttachmentReference = Readonly<{
  id: string
  mediaType?: string
  contentUrl?: string
  contentSize?: number
  digestAlgorithm: 'sha-256' | 'sha-384' | 'sha-512' | 'sha3-384'
  digest: string
  contentId?: string
}>

const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function decodeBase58btc(value: string): Uint8Array {
  let decoded = 0n
  for (const character of value) {
    const index = BASE58BTC_ALPHABET.indexOf(character)
    if (index < 0) throw new TypeError('Invalid base58btc character')
    decoded = decoded * 58n + BigInt(index)
  }
  const bytes: number[] = []
  while (decoded > 0n) {
    bytes.unshift(Number(decoded & 0xffn))
    decoded >>= 8n
  }
  for (const character of value) {
    if (character !== '1') break
    bytes.unshift(0)
  }
  return Uint8Array.from(bytes)
}

function encodeBase58btc(bytes: Uint8Array): string {
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)

  let encoded = ''
  while (value > 0n) {
    encoded = BASE58BTC_ALPHABET[Number(value % 58n)] + encoded
    value /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded = `1${encoded}`
  }
  return `z${encoded}`
}

/** Builds the canonical CIDv1(raw, SHA3-384) for already-hashed evidence bytes. */
export function buildSha3_384EvidenceContentIdFromDigest(
  digestBytes: Uint8Array,
): string {
  if (!(digestBytes instanceof Uint8Array) || digestBytes.byteLength !== 48) {
    throw new TypeError('Evidence SHA3-384 digest must contain 48 bytes')
  }
  return encodeBase58btc(Uint8Array.from([0x01, 0x55, 0x15, 0x30, ...digestBytes]))
}

/** Validates CIDv1(raw, SHA3-384) encoded with multibase base58btc. */
export function assertSha3_384EvidenceContentId(contentId: string): void {
  if (!/^z[1-9A-HJ-NP-Za-km-z]+$/u.test(contentId)) {
    throw new TypeError('Evidence contentId must be a base58btc multibase CID')
  }
  const bytes = decodeBase58btc(contentId.slice(1))
  if (
    bytes.length !== 52
    || bytes[0] !== 0x01
    || bytes[1] !== 0x55
    || bytes[2] !== 0x15
    || bytes[3] !== 0x30
  ) {
    throw new TypeError('Evidence contentId must be CIDv1 raw with a SHA3-384 multihash')
  }
}

export function assertSha3_384EvidenceContentIdMatchesDigest(
  contentId: string,
  digest: string,
): void {
  assertSha3_384EvidenceContentId(contentId)
  const cidBytes = decodeBase58btc(contentId.slice(1))
  let digestBytes: Uint8Array
  try {
    digestBytes = Uint8Array.from(atob(digest), character => character.charCodeAt(0))
  } catch {
    throw new TypeError('Evidence attachment digest must be base64 encoded')
  }
  const cidDigest = cidBytes.slice(4)
  if (
    digestBytes.length !== cidDigest.length
    || digestBytes.some((value, index) => value !== cidDigest[index])
  ) {
    throw new TypeError('Evidence attachment digest does not match contentId')
  }
}

export type IdentityEvidenceCheck = Readonly<{
  checkMethod: string
  organizationReference?: string
  checkId: string
  checkedAt?: string
}>

export type IdentityEvidenceInput = Readonly<{
  id: string
  type: IdentityEvidenceTypeValue
  observedAt: string
  checks: readonly [IdentityEvidenceCheck, ...IdentityEvidenceCheck[]]
  attachments?: readonly IdentityEvidenceAttachmentReference[]
}>

export type IdentityEvidenceTarget =
  | Readonly<{ kind: 'subject' }>
  | Readonly<{ kind: 'claim'; claimPath: string }>
  | Readonly<{
      kind: 'relationship'
      relationshipType: string
      relatedSubjectReference: string
    }>

  | Readonly<{
      kind: 'predicate'
      predicate: typeof IdentityPredicateKind.AgeOver
      sourceSubjectReference: string
      sourceClaimPath: typeof SchemaOrgIdentityClaim.PersonBirthDate
      threshold: number
      result: boolean
    }>

export const IdentityEvidenceTargetClaim = Object.freeze({
  SubjectReference: 'identity.evidence.subjectReference',
  Kind: 'identity.evidence.target.kind',
  ClaimPath: 'identity.evidence.target.claimPath',
  RelationshipType: 'identity.evidence.target.relationshipType',
  RelatedSubjectReference: 'identity.evidence.target.relatedSubjectReference',
  Predicate: 'identity.evidence.target.predicate',
  SourceSubjectReference: 'identity.evidence.target.sourceSubjectReference',
  SourceClaimPath: 'identity.evidence.target.sourceClaimPath',
  Threshold: 'identity.evidence.target.threshold',
  Result: 'identity.evidence.target.result',
} as const)

export const IdentityEvidenceCheckClaim = Object.freeze({
  Reference: 'identity.evidence.checkReference',
} as const)

export type AuthenticatedWorkforceEvidenceContext = Readonly<{
  actorReference: string
  assignmentReference: string
  organizationReference: string
  groupMembership: Readonly<{
    groupReference: string
    status: 'active' | 'inactive'
  }>
  groupAuthorization: Readonly<{
    authorizationReference: string
    groupReference: string
    controllerReference: string
    status: 'active' | 'inactive'
    capabilities: readonly IdentityAttestationCapabilityValue[]
  }>
  subjectAuthorizationReference?: string
}>

export type WorkforceIdentityEvidenceStatementRequest = Readonly<{
  operationId: string
  subjectReference: string
  targets: readonly [IdentityEvidenceTarget, ...IdentityEvidenceTarget[]]
  evidence: readonly [IdentityEvidenceInput, ...IdentityEvidenceInput[]]
}>

export type WorkforceIdentityEvidenceStatement = Readonly<{
  operationId: string
  subjectReference: string
  capability: typeof IdentityAttestationCapability.RecordEvidence
  createdBy: Readonly<{
    actorReference: string
    assignmentReference: string
    organizationReference: string
  }>
  authorization: Readonly<{
    groupReference: string
    groupAuthorizationReference: string
    controllerReference: string
    subjectAuthorizationReference?: string
  }>
  targets: readonly IdentityEvidenceTarget[]
  evidence: readonly IdentityEvidenceInput[]
}>

const RAW_EVIDENCE_PROPERTIES = Object.freeze([
  'base64',
  'bytes',
  'content',
  'document',
  'image',
])

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${field} must not be empty`)
  }
}

function assertReferenceOnlyEvidence(evidence: IdentityEvidenceInput): void {
  for (const property of RAW_EVIDENCE_PROPERTIES) {
    if (Object.hasOwn(evidence, property)) {
      throw new TypeError('Raw evidence documents are not accepted; use digest-bound attachment references')
    }
  }
  requireNonEmpty(evidence.id, 'evidence.id')
  requireNonEmpty(evidence.observedAt, 'evidence.observedAt')
  if (!Object.values(IdentityEvidenceType).includes(evidence.type)) {
    throw new TypeError(`Unsupported identity evidence type: ${String(evidence.type)}`)
  }
  if (!Array.isArray(evidence.checks) || evidence.checks.length === 0) {
    throw new TypeError('Identity evidence requires at least one check')
  }
  evidence.checks.forEach((check) => {
    requireNonEmpty(check.checkMethod, 'evidence.checks.checkMethod')
    requireNonEmpty(check.checkId, 'evidence.checks.checkId')
  })
  evidence.attachments?.forEach((attachment) => {
    requireNonEmpty(attachment.id, 'evidence.attachments.id')
    requireNonEmpty(attachment.digest, 'evidence.attachments.digest')
    if (attachment.contentUrl !== undefined) {
      requireNonEmpty(attachment.contentUrl, 'evidence.attachments.contentUrl')
    }
    if (
      attachment.contentSize !== undefined
      && (!Number.isSafeInteger(attachment.contentSize) || attachment.contentSize < 0)
    ) {
      throw new TypeError('Evidence attachment contentSize must be a non-negative safe integer')
    }
    if (attachment.contentId !== undefined) {
      assertSha3_384EvidenceContentId(attachment.contentId)
      if (attachment.digestAlgorithm !== 'sha3-384') {
        throw new TypeError('A SHA3-384 evidence contentId requires digestAlgorithm sha3-384')
      }
      assertSha3_384EvidenceContentIdMatchesDigest(attachment.contentId, attachment.digest)
    }
  })
}

function assertEvidenceTarget(target: IdentityEvidenceTarget): void {
  if (target.kind === 'subject') return
  if (target.kind === 'claim') {
    requireNonEmpty(target.claimPath, 'targets.claimPath')
    return
  }
  if (target.kind === 'relationship') {
    requireNonEmpty(target.relationshipType, 'targets.relationshipType')
    requireNonEmpty(target.relatedSubjectReference, 'targets.relatedSubjectReference')
    return
  }
  if (target.kind === 'predicate') {
    if (target.predicate !== IdentityPredicateKind.AgeOver) {
      throw new TypeError(`Unsupported identity predicate: ${String(target.predicate)}`)
    }
    requireNonEmpty(target.sourceSubjectReference, 'targets.sourceSubjectReference')
    if (target.sourceClaimPath !== SchemaOrgIdentityClaim.PersonBirthDate) {
      throw new TypeError('Age-over evidence must derive from the Schema.org Person.birthDate claim')
    }
    if (!Number.isInteger(target.threshold) || target.threshold < 1 || target.threshold > 150) {
      throw new TypeError('Age-over threshold must be an integer between 1 and 150')
    }
    if (typeof target.result !== 'boolean') {
      throw new TypeError('Age-over evidence result must be boolean')
    }
    return
  }
  throw new TypeError('Unsupported identity evidence target')
}

/** Converts one validated target into strings suitable for claims-first indexing. */
export function toIdentityEvidenceTargetFlatClaims(input: Readonly<{
  subjectReference: string
  target: IdentityEvidenceTarget
}>): Readonly<Record<string, string>> {
  requireNonEmpty(input.subjectReference, 'subjectReference')
  assertEvidenceTarget(input.target)
  const common = {
    [IdentityEvidenceTargetClaim.SubjectReference]: input.subjectReference,
    [IdentityEvidenceTargetClaim.Kind]: input.target.kind,
  }
  if (input.target.kind === 'subject') return Object.freeze(common)
  if (input.target.kind === 'claim') return Object.freeze({
    ...common,
    [IdentityEvidenceTargetClaim.ClaimPath]: input.target.claimPath,
  })
  if (input.target.kind === 'relationship') return Object.freeze({
    ...common,
    [IdentityEvidenceTargetClaim.RelationshipType]: input.target.relationshipType,
    [IdentityEvidenceTargetClaim.RelatedSubjectReference]: input.target.relatedSubjectReference,
  })
  return Object.freeze({
    ...common,
    [IdentityEvidenceTargetClaim.Predicate]: input.target.predicate,
    [IdentityEvidenceTargetClaim.SourceSubjectReference]: input.target.sourceSubjectReference,
    [IdentityEvidenceTargetClaim.SourceClaimPath]: input.target.sourceClaimPath,
    [IdentityEvidenceTargetClaim.Threshold]: String(input.target.threshold),
    [IdentityEvidenceTargetClaim.Result]: String(input.target.result),
  })
}

/**
 * Creates an unsigned, governed evidence statement for an authorized workforce
 * member. The actor, assignment, organization, active group membership and
 * reusable group authorization always come from trusted server context. A
 * credential provider may later read this statement back and issue a signed
 * attestation. No employee-specific Consent is created.
 */
export function defineAuthorizedWorkforceIdentityEvidenceStatement(input: Readonly<{
  context: AuthenticatedWorkforceEvidenceContext
  request: WorkforceIdentityEvidenceStatementRequest
}>): WorkforceIdentityEvidenceStatement {
  if (!input.context.groupAuthorization.capabilities.includes(IdentityAttestationCapability.RecordEvidence)) {
    throw new TypeError(`Missing required capability: ${IdentityAttestationCapability.RecordEvidence}`)
  }
  requireNonEmpty(input.context.actorReference, 'context.actorReference')
  requireNonEmpty(input.context.assignmentReference, 'context.assignmentReference')
  requireNonEmpty(input.context.organizationReference, 'context.organizationReference')
  if (input.context.groupMembership.status !== 'active') {
    throw new TypeError('An active group membership is required')
  }
  requireNonEmpty(input.context.groupMembership.groupReference, 'context.groupMembership.groupReference')
  if (input.context.groupAuthorization.status !== 'active') {
    throw new TypeError('An active group authorization is required')
  }
  requireNonEmpty(input.context.groupAuthorization.authorizationReference, 'context.groupAuthorization.authorizationReference')
  requireNonEmpty(input.context.groupAuthorization.controllerReference, 'context.groupAuthorization.controllerReference')
  if (input.context.groupMembership.groupReference !== input.context.groupAuthorization.groupReference) {
    throw new TypeError('Membership and authorization must reference the same professional group')
  }
  requireNonEmpty(input.request.operationId, 'request.operationId')
  requireNonEmpty(input.request.subjectReference, 'request.subjectReference')
  if (!Array.isArray(input.request.targets) || input.request.targets.length === 0) {
    throw new TypeError('Identity evidence requires at least one target')
  }
  input.request.targets.forEach(assertEvidenceTarget)
  if (!Array.isArray(input.request.evidence) || input.request.evidence.length === 0) {
    throw new TypeError('Identity evidence requires at least one evidence item')
  }
  input.request.evidence.forEach(assertReferenceOnlyEvidence)

  return Object.freeze({
    operationId: input.request.operationId,
    subjectReference: input.request.subjectReference,
    capability: IdentityAttestationCapability.RecordEvidence,
    createdBy: Object.freeze({
      actorReference: input.context.actorReference,
      assignmentReference: input.context.assignmentReference,
      organizationReference: input.context.organizationReference,
    }),
    authorization: Object.freeze({
      groupReference: input.context.groupMembership.groupReference,
      groupAuthorizationReference: input.context.groupAuthorization.authorizationReference,
      controllerReference: input.context.groupAuthorization.controllerReference,
      ...(input.context.subjectAuthorizationReference
        ? { subjectAuthorizationReference: input.context.subjectAuthorizationReference }
        : {}),
    }),
    targets: Object.freeze(input.request.targets.map((target) => Object.freeze({ ...target }))),
    evidence: Object.freeze(input.request.evidence.map((evidence) => Object.freeze({
      ...evidence,
      checks: Object.freeze(evidence.checks.map((check) => Object.freeze({ ...check }))) as IdentityEvidenceInput['checks'],
      ...(evidence.attachments
        ? { attachments: Object.freeze(evidence.attachments.map((attachment) => Object.freeze({ ...attachment }))) }
        : {}),
    }))),
  })
}
