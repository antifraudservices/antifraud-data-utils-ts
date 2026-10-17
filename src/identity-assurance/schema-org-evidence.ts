import type { IdentityEvidenceAttachmentReference } from './identity-evidence.js'

export const SchemaOrgMediaObjectClaim = Object.freeze({
  Id: 'org.schema.MediaObject.id',
  IdentifierPropertyId: 'org.schema.MediaObject.identifier.propertyID',
  IdentifierValue: 'org.schema.MediaObject.identifier.value',
  ContentUrl: 'org.schema.MediaObject.contentUrl',
  EncodingFormat: 'org.schema.MediaObject.encodingFormat',
  ContentSize: 'org.schema.MediaObject.contentSize',
} as const)

export type SchemaOrgEvidenceMediaAttachment = IdentityEvidenceAttachmentReference & Readonly<{
  mediaType: string
  contentUrl: string
  contentSize: number
  contentId: string
}>

function requireSchemaOrgEvidenceMediaAttachment(
  attachment: SchemaOrgEvidenceMediaAttachment,
): void {
  if (attachment.digestAlgorithm !== 'sha3-384') {
    throw new TypeError('Schema.org evidence MediaObject requires the governed SHA3-384 CID profile')
  }
  if (!attachment.contentUrl.trim()) {
    throw new TypeError('Schema.org evidence MediaObject contentUrl must not be empty')
  }
  if (!attachment.mediaType.trim()) {
    throw new TypeError('Schema.org evidence MediaObject encodingFormat must not be empty')
  }
  if (!Number.isSafeInteger(attachment.contentSize) || attachment.contentSize < 0) {
    throw new TypeError('Schema.org evidence MediaObject contentSize must be a non-negative safe integer')
  }
}

export function projectEvidenceAttachmentToSchemaOrgMediaObject(
  attachment: SchemaOrgEvidenceMediaAttachment,
) {
  requireSchemaOrgEvidenceMediaAttachment(attachment)
  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'MediaObject',
    '@id': attachment.id,
    identifier: Object.freeze({
      '@type': 'PropertyValue',
      propertyID: 'cidv1-raw-sha3-384',
      value: attachment.contentId,
    }),
    contentUrl: attachment.contentUrl,
    encodingFormat: attachment.mediaType,
    contentSize: String(attachment.contentSize),
  })
}

export function toSchemaOrgEvidenceMediaFlatClaims(
  attachment: SchemaOrgEvidenceMediaAttachment,
): Readonly<Record<string, string>> {
  requireSchemaOrgEvidenceMediaAttachment(attachment)
  return Object.freeze({
    [SchemaOrgMediaObjectClaim.Id]: attachment.id,
    [SchemaOrgMediaObjectClaim.IdentifierPropertyId]: 'cidv1-raw-sha3-384',
    [SchemaOrgMediaObjectClaim.IdentifierValue]: attachment.contentId,
    [SchemaOrgMediaObjectClaim.ContentUrl]: attachment.contentUrl,
    [SchemaOrgMediaObjectClaim.EncodingFormat]: attachment.mediaType,
    [SchemaOrgMediaObjectClaim.ContentSize]: String(attachment.contentSize),
  })
}
