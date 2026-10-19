// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// Journey: (1) create a minimal synthetic PDF; (2) carry its exact bytes as a DIDComm attachment;
// (3) carry an existing Schema.org MediaObject by protected reference; (4) reject ambiguous binary payloads.
// Invariants: Antifraud remains Schema.org-native, DIDComm is transport, and no FHIR DocumentReference is created.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SyntheticConfidentialDocumentFixture,
  buildDidCommInlineBinaryAttachment,
  buildDidCommLinkedBinaryAttachment,
  buildSha3_384EvidenceContentIdFromDigest,
} from '../dist/identity-assurance/index.js'

// The literal bytes are the behavior under test: a minimal synthetic PDF fixture.
const minimalPdfBytes = new TextEncoder().encode([
  '%PDF-1.4',
  '1 0 obj',
  '<< /Type /Catalog /Pages 2 0 R >>',
  'endobj',
  '2 0 obj',
  '<< /Type /Pages /Count 0 >>',
  'endobj',
  'xref',
  '0 3',
  '0000000000 65535 f ',
  '0000000009 00000 n ',
  '0000000058 00000 n ',
  'trailer',
  '<< /Size 3 /Root 1 0 R >>',
  'startxref',
  '105',
  '%%EOF',
  '',
].join('\n'))

test('builds the canonical CIDv1 raw content identifier from a SHA3-384 digest', () => {
  const digest = Buffer.from(
    'mJ+lnlA8LeEHHgH2qJjjCt1TmFJWDRmtelW8l7lXsSswcDcGahIuhvPVoXAvQ/PA',
    'base64',
  )

  assert.equal(
    buildSha3_384EvidenceContentIdFromDigest(digest),
    'zKYrhS8ZkySGc9pjHe8KE4bo1RjKKbjaxatf3zM16DD2hLGPvK3bqbSGvpNYA2qafoUeBYT',
  )
  assert.throws(
    () => buildSha3_384EvidenceContentIdFromDigest(new Uint8Array(47)),
    /48 bytes/i,
  )
})

test('carries the exact bytes of a minimal PDF as an inline DIDComm attachment', () => {
  const attachment = buildDidCommInlineBinaryAttachment({
    id: 'urn:attachment:synthetic-minimal-pdf',
    mediaType: 'application/pdf',
    bytes: minimalPdfBytes,
  })

  assert.equal(attachment.id, 'urn:attachment:synthetic-minimal-pdf')
  assert.equal(attachment.media_type, 'application/pdf')
  assert.equal(attachment.byte_count, minimalPdfBytes.byteLength)
  assert.deepEqual(Object.keys(attachment.data), ['base64'])

  const decoded = Buffer.from(attachment.data.base64, 'base64url')
  assert.deepEqual(decoded, Buffer.from(minimalPdfBytes))
  assert.match(decoded.toString('ascii'), /^%PDF-1\.4/)
  assert.match(decoded.toString('ascii'), /%%EOF\n$/)
  assert.equal('resource' in attachment, false)
  assert.equal('DocumentReference' in attachment, false)
})

test('carries a Schema.org MediaObject as a protected linked DIDComm attachment', () => {
  const mediaObject = SyntheticConfidentialDocumentFixture.attachment
  const attachment = buildDidCommLinkedBinaryAttachment(mediaObject)

  assert.deepEqual(attachment, {
    id: mediaObject.id,
    media_type: mediaObject.mediaType,
    byte_count: mediaObject.contentSize,
    data: {
      links: [mediaObject.contentUrl],
      hash: attachment.data.hash,
    },
  })
  assert.match(attachment.data.hash, /^z[1-9A-HJ-NP-Za-km-z]+$/)
  assert.notEqual(attachment.data.hash, mediaObject.contentId)
})

test('rejects empty binary payloads and incomplete linked attachments', () => {
  assert.throws(() => buildDidCommInlineBinaryAttachment({
    id: 'urn:attachment:empty',
    mediaType: 'application/pdf',
    bytes: new Uint8Array(),
  }), /must not be empty/i)

  assert.throws(() => buildDidCommInlineBinaryAttachment({
    id: 'urn:attachment:invalid-media-type',
    mediaType: 'pdf',
    bytes: minimalPdfBytes,
  }), /Internet media type/i)

  assert.throws(() => buildDidCommLinkedBinaryAttachment({
    ...SyntheticConfidentialDocumentFixture.attachment,
    contentUrl: '',
  }), /contentUrl must not be empty/i)
})
