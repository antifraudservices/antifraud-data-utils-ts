import {
  IdentityAttestationCapability,
  type IdentityAttestationCapabilityValue,
} from './vocabulary.js'

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
  digestAlgorithm: 'sha-256' | 'sha-384' | 'sha-512'
  digest: string
}>

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

export type AuthenticatedWorkforceEvidenceContext = Readonly<{
  actorReference: string
  assignmentReference: string
  organizationReference: string
  groupReferences: readonly [string, ...string[]]
  consentReference: string
  capabilities: readonly IdentityAttestationCapabilityValue[]
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
    groupReferences: readonly string[]
    consentReference: string
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
  })
}

/**
 * Creates an unsigned, governed evidence statement for an authorized workforce
 * member. The actor, assignment, organization, group and Consent always come
 * from trusted server context. A credential provider may later read this
 * statement back and issue a signed attestation.
 */
export function defineAuthorizedWorkforceIdentityEvidenceStatement(input: Readonly<{
  context: AuthenticatedWorkforceEvidenceContext
  request: WorkforceIdentityEvidenceStatementRequest
}>): WorkforceIdentityEvidenceStatement {
  if (!input.context.capabilities.includes(IdentityAttestationCapability.RecordEvidence)) {
    throw new TypeError(`Missing required capability: ${IdentityAttestationCapability.RecordEvidence}`)
  }
  requireNonEmpty(input.context.actorReference, 'context.actorReference')
  requireNonEmpty(input.context.assignmentReference, 'context.assignmentReference')
  requireNonEmpty(input.context.organizationReference, 'context.organizationReference')
  if (!Array.isArray(input.context.groupReferences) || input.context.groupReferences.length === 0) {
    throw new TypeError('A controller-governed workforce group is required')
  }
  input.context.groupReferences.forEach((reference) => requireNonEmpty(reference, 'context.groupReferences'))
  requireNonEmpty(input.context.consentReference, 'context.consentReference')
  requireNonEmpty(input.request.operationId, 'request.operationId')
  requireNonEmpty(input.request.subjectReference, 'request.subjectReference')
  if (!Array.isArray(input.request.targets) || input.request.targets.length === 0) {
    throw new TypeError('Identity evidence requires at least one target')
  }
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
      groupReferences: Object.freeze([...input.context.groupReferences]),
      consentReference: input.context.consentReference,
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
