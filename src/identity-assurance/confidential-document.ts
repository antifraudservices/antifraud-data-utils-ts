import {
  assertSha3_384EvidenceContentId,
  assertSha3_384EvidenceContentIdMatchesDigest,
} from './identity-evidence.js'
import type { SchemaOrgEvidenceMediaAttachment } from './schema-org-evidence.js'

export const SchemaOrgContentIdentifierProfile = Object.freeze({
  CidV1RawSha3_384: 'cidv1-raw-sha3-384',
} as const)

export const SchemaOrgDocumentResourceType = Object.freeze({
  DigitalDocument: 'DigitalDocument',
  MediaObject: 'MediaObject',
} as const)

export type SchemaOrgContentIdentifierInput = Readonly<{
  propertyID?: string
  additionalType?: string
  value: string
}>

export type SchemaOrgContentIdentifier = Readonly<{
  propertyID: typeof SchemaOrgContentIdentifierProfile.CidV1RawSha3_384
  value: string
}>

export type SchemaOrgDigitalDocumentDescriptor = Readonly<{
  id: string
  name: string
  additionalType: string
  version: string
}>

export type SchemaOrgConfidentialDocumentInput = SchemaOrgDigitalDocumentDescriptor & Readonly<{
  attachment: SchemaOrgEvidenceMediaAttachment
}>

export type SchemaOrgConfidentialDocumentGraphInput = Readonly<{
  manifest: SchemaOrgDigitalDocumentDescriptor
  documents: readonly [
    SchemaOrgConfidentialDocumentInput,
    ...SchemaOrgConfidentialDocumentInput[],
  ]
}>

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(`${field} must not be empty`)
  return normalized
}

export function normalizeSchemaOrgContentIdentifier(
  identifier: SchemaOrgContentIdentifierInput,
): SchemaOrgContentIdentifier {
  const propertyID = identifier.propertyID?.trim()
  const legacyAdditionalType = identifier.additionalType?.trim()
  if (propertyID && legacyAdditionalType && propertyID !== legacyAdditionalType) {
    throw new TypeError('Schema.org identifier propertyID and legacy additionalType disagree')
  }
  const selectedProfile = propertyID || legacyAdditionalType
  if (selectedProfile !== SchemaOrgContentIdentifierProfile.CidV1RawSha3_384) {
    throw new TypeError('Schema.org content identifier requires the governed CIDv1 raw SHA3-384 profile')
  }
  const value = requireNonEmpty(identifier.value, 'identifier.value')
  assertSha3_384EvidenceContentId(value)
  return Object.freeze({
    propertyID: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
    value,
  })
}

const RAW_ATTACHMENT_PROPERTIES = Object.freeze([
  'base64',
  'bytes',
  'content',
  'data',
  'document',
])

function requireAttachment(attachment: SchemaOrgEvidenceMediaAttachment): void {
  for (const property of RAW_ATTACHMENT_PROPERTIES) {
    if (Object.hasOwn(attachment, property)) {
      throw new TypeError('Raw document bytes are not accepted; use a protected content URL and CID')
    }
  }
  requireNonEmpty(attachment.id, 'attachment.id')
  requireNonEmpty(attachment.contentUrl, 'attachment.contentUrl')
  requireNonEmpty(attachment.mediaType, 'attachment.mediaType')
  requireNonEmpty(attachment.digest, 'attachment.digest')
  requireNonEmpty(attachment.contentId, 'attachment.contentId')
  if (attachment.digestAlgorithm !== 'sha3-384') {
    throw new TypeError('Confidential document attachment requires digestAlgorithm sha3-384')
  }
  if (!Number.isSafeInteger(attachment.contentSize) || attachment.contentSize < 0) {
    throw new TypeError('Confidential document attachment size must be a non-negative safe integer')
  }
  assertSha3_384EvidenceContentIdMatchesDigest(attachment.contentId, attachment.digest)
}

function requireDocumentDescriptor(
  document: SchemaOrgDigitalDocumentDescriptor,
  field: string,
): void {
  requireNonEmpty(document.id, `${field}.id`)
  requireNonEmpty(document.name, `${field}.name`)
  requireNonEmpty(document.additionalType, `${field}.additionalType`)
  requireNonEmpty(document.version, `${field}.version`)
}

export function buildSchemaOrgConfidentialDocumentGraph(
  input: SchemaOrgConfidentialDocumentGraphInput,
) {
  requireDocumentDescriptor(input.manifest, 'manifest')
  if (!Array.isArray(input.documents) || input.documents.length === 0) {
    throw new TypeError('Confidential document graph requires at least one document')
  }

  const resourceIds = new Set<string>([input.manifest.id])
  for (const [index, document] of input.documents.entries()) {
    requireDocumentDescriptor(document, `documents[${index}]`)
    requireAttachment(document.attachment)
    for (const id of [document.id, document.attachment.id]) {
      if (resourceIds.has(id)) {
        throw new TypeError('Schema.org document resource identifiers must be unique')
      }
      resourceIds.add(id)
    }
  }

  const manifestResource = Object.freeze({
    type: SchemaOrgDocumentResourceType.DigitalDocument,
    id: input.manifest.id,
    attributes: Object.freeze({
      name: input.manifest.name,
      additionalType: input.manifest.additionalType,
      version: input.manifest.version,
    }),
    relationships: Object.freeze({
      hasPart: Object.freeze({
        data: Object.freeze(input.documents.map(document => Object.freeze({
          type: SchemaOrgDocumentResourceType.DigitalDocument,
          id: document.id,
        }))),
      }),
    }),
  })

  const documentResources = input.documents.flatMap(document => [
    Object.freeze({
      type: SchemaOrgDocumentResourceType.DigitalDocument,
      id: document.id,
      attributes: Object.freeze({
        name: document.name,
        additionalType: document.additionalType,
        version: document.version,
      }),
      relationships: Object.freeze({
        encoding: Object.freeze({
          data: Object.freeze({
            type: SchemaOrgDocumentResourceType.MediaObject,
            id: document.attachment.id,
          }),
        }),
      }),
    }),
    Object.freeze({
      type: SchemaOrgDocumentResourceType.MediaObject,
      id: document.attachment.id,
      attributes: Object.freeze({
        identifier: normalizeSchemaOrgContentIdentifier({
          propertyID: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
          value: document.attachment.contentId,
        }),
        encodingFormat: document.attachment.mediaType,
        contentSize: String(document.attachment.contentSize),
        contentUrl: document.attachment.contentUrl,
      }),
    }),
  ])

  return Object.freeze({
    jsonapi: Object.freeze({version: '1.1'}),
    data: Object.freeze([manifestResource, ...documentResources]),
  })
}
