import { IdentityAttestationCapability } from './vocabulary.js'

const evidenceSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', minLength: 1 },
  },
  additionalProperties: true,
} as const

const workforceEvidenceCheckSchema = {
  type: 'object',
  required: ['checkMethod', 'checkId'],
  properties: {
    checkMethod: { type: 'string', minLength: 1 },
    organizationReference: { type: 'string', minLength: 1 },
    checkId: { type: 'string', minLength: 1 },
    checkedAt: { type: 'string', format: 'date-time' },
  },
  additionalProperties: false,
} as const

const workforceEvidenceAttachmentSchema = {
  type: 'object',
  required: ['id', 'digestAlgorithm', 'digest'],
  properties: {
    id: { type: 'string', minLength: 1 },
    mediaType: { type: 'string', minLength: 1 },
    digestAlgorithm: { enum: ['sha-256', 'sha-384', 'sha-512'] },
    digest: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const

const workforceEvidenceItemSchema = {
  type: 'object',
  required: ['id', 'type', 'observedAt', 'checks'],
  properties: {
    id: { type: 'string', minLength: 1 },
    type: { enum: ['document', 'electronic_record', 'vouch', 'electronic_signature'] },
    observedAt: { type: 'string', format: 'date-time' },
    checks: {
      type: 'array',
      minItems: 1,
      items: workforceEvidenceCheckSchema,
    },
    attachments: {
      type: 'array',
      items: workforceEvidenceAttachmentSchema,
    },
  },
  additionalProperties: false,
} as const

export const verifiedClaimsJsonSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://antifraudservices.github.io/antifraud-data-utils-ts/schemas/oidc4ida-verified-claims.json',
  title: 'OIDC4IDA Verified Claims',
  type: 'object',
  required: ['claims', 'verification'],
  properties: {
    claims: {
      type: 'object',
      additionalProperties: true,
    },
    verification: {
      type: 'object',
      required: ['evidence'],
      properties: {
        trust_framework: { type: ['string', 'null'] },
        assurance_level: { type: ['string', 'null'] },
        assurance_process: { type: ['string', 'null'] },
        verification_process: { type: ['string', 'null'] },
        time: { type: ['string', 'null'], format: 'date-time' },
        evidence: {
          type: 'array',
          minItems: 1,
          items: evidenceSchema,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: false,
} as const)

/**
 * Stored-statement schema. A form may render its evidence fields, but the host
 * must populate the read-only actor and authorization fields from its trusted
 * session, active group membership and reusable group authorization.
 */
export const workforceIdentityEvidenceStatementJsonSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://antifraudservices.github.io/antifraud-data-utils-ts/schemas/workforce-identity-evidence-statement.json',
  title: 'Authorized workforce identity evidence statement',
  type: 'object',
  required: [
    'operationId',
    'subjectReference',
    'capability',
    'createdBy',
    'authorization',
    'targets',
    'evidence',
  ],
  properties: {
    operationId: { type: 'string', minLength: 1 },
    subjectReference: { type: 'string', minLength: 1 },
    capability: { const: IdentityAttestationCapability.RecordEvidence, readOnly: true },
    createdBy: {
      type: 'object',
      readOnly: true,
      required: ['actorReference', 'assignmentReference', 'organizationReference'],
      properties: {
        actorReference: { type: 'string', minLength: 1 },
        assignmentReference: { type: 'string', minLength: 1 },
        organizationReference: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
    authorization: {
      type: 'object',
      readOnly: true,
      required: ['groupReference', 'groupAuthorizationReference', 'controllerReference'],
      properties: {
        groupReference: { type: 'string', minLength: 1 },
        groupAuthorizationReference: { type: 'string', minLength: 1 },
        controllerReference: { type: 'string', minLength: 1 },
        subjectAuthorizationReference: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
    targets: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['kind'],
        properties: {
          kind: { enum: ['subject', 'claim', 'relationship'] },
          claimPath: { type: 'string', minLength: 1 },
          relationshipType: { type: 'string', minLength: 1 },
          relatedSubjectReference: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
      },
    },
    evidence: {
      type: 'array',
      minItems: 1,
      items: workforceEvidenceItemSchema,
    },
  },
  additionalProperties: false,
} as const)
