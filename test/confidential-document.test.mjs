// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// Journey: (1) define an immutable document set; (2) bind each file to a CIDv1(raw, SHA3-384) MediaObject;
// (3) serialize direct JSON:API resources; (4) reject ambiguous legacy identifier typing and tampered content identity.
// Invariants: raw bytes never enter the primary document, identifier.value is the complete CID, and FHIR is projection only.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  SchemaOrgContentIdentifierProfile,
  SchemaOrgDocumentResourceType,
  SyntheticConfidentialDocumentFixture,
  buildSchemaOrgConfidentialDocumentGraph,
  normalizeSchemaOrgContentIdentifier,
} from '../dist/identity-assurance/index.js'

const {attachment} = SyntheticConfidentialDocumentFixture

test('builds a direct JSON:API Schema.org document and media graph', () => {
  const graph = buildSchemaOrgConfidentialDocumentGraph({
    manifest: SyntheticConfidentialDocumentFixture.manifest,
    documents: [{
      ...SyntheticConfidentialDocumentFixture.document,
      attachment,
    }],
  })

  assert.equal(graph.jsonapi.version, '1.1')
  assert.equal(graph.data.length, 3)
  assert.deepEqual(graph.data.map(({type, id}) => ({type, id})), [
    {type: SchemaOrgDocumentResourceType.DigitalDocument, id: SyntheticConfidentialDocumentFixture.manifest.id},
    {type: SchemaOrgDocumentResourceType.DigitalDocument, id: SyntheticConfidentialDocumentFixture.document.id},
    {type: SchemaOrgDocumentResourceType.MediaObject, id: attachment.id},
  ])
  assert.deepEqual(graph.data[0].relationships.hasPart.data, [{
    type: SchemaOrgDocumentResourceType.DigitalDocument,
    id: SyntheticConfidentialDocumentFixture.document.id,
  }])
  assert.deepEqual(graph.data[1].relationships.encoding.data, {
    type: SchemaOrgDocumentResourceType.MediaObject,
    id: attachment.id,
  })
  assert.deepEqual(graph.data[2].attributes, {
    identifier: {
      propertyID: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
      value: attachment.contentId,
    },
    encodingFormat: attachment.mediaType,
    contentSize: String(attachment.contentSize),
    contentUrl: attachment.contentUrl,
  })
  assert.equal('resource' in graph.data[0], false)
  assert.equal('entry' in graph, false)
})

test('normalizes legacy additionalType input but emits only PropertyValue.propertyID', () => {
  assert.deepEqual(normalizeSchemaOrgContentIdentifier({
    additionalType: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
    value: attachment.contentId,
  }), {
    propertyID: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
    value: attachment.contentId,
  })

  assert.throws(() => normalizeSchemaOrgContentIdentifier({
    propertyID: SchemaOrgContentIdentifierProfile.CidV1RawSha3_384,
    additionalType: 'legacy-conflicting-profile',
    value: attachment.contentId,
  }), /propertyID and legacy additionalType disagree/i)
})

test('rejects duplicate resources, raw bytes and a CID that does not match the digest', () => {
  assert.throws(() => buildSchemaOrgConfidentialDocumentGraph({
    manifest: {
      id: attachment.id,
      name: 'Conflicting manifest',
      additionalType: 'agreement-manifest',
      version: '1',
    },
    documents: [{
      id: 'urn:document:source-001',
      name: 'Source',
      additionalType: 'source-document',
      version: '1',
      attachment,
    }],
  }), /resource identifiers must be unique/i)

  assert.throws(() => buildSchemaOrgConfidentialDocumentGraph({
    manifest: {
      id: 'urn:document-set:agreement-001',
      name: 'Agreement',
      additionalType: 'agreement-manifest',
      version: '1',
    },
    documents: [{
      id: 'urn:document:source-001',
      name: 'Source',
      additionalType: 'source-document',
      version: '1',
      attachment: {...attachment, bytes: 'forbidden'},
    }],
  }), /raw document bytes are not accepted/i)

  assert.throws(() => buildSchemaOrgConfidentialDocumentGraph({
    manifest: {
      id: 'urn:document-set:agreement-001',
      name: 'Agreement',
      additionalType: 'agreement-manifest',
      version: '1',
    },
    documents: [{
      id: 'urn:document:source-001',
      name: 'Source',
      additionalType: 'source-document',
      version: '1',
      attachment: {...attachment, digest: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'},
    }],
  }), /digest does not match contentId/i)
})
