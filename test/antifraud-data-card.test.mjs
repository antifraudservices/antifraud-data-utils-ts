// Flow contract: Antifraud prepares a non-health Antifraud Data Card whose VC credentialSubject is one canonical JSON:API primary document containing Schema.org resources, while signing authority stays external and afdc:/ round-trips independently from pqc:/ proofs.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assembleAntifraudDataCardJws,
  decodeAntifraudDataCardPayload,
  decodeAntifraudDataCardQr,
  encodeAntifraudDataCardQr,
  prepareAntifraudDataCard,
} from '../dist/identity-assurance/index.js'

const document = {
  jsonapi: { version: '1.1' },
  data: {
    type: 'DigitalDocument',
    id: 'urn:document:qualification-1',
    attributes: { '@type': 'DigitalDocument', name: 'Qualification evidence' },
  },
}

test('prepares and round-trips an afdc:/ credential with a JSON:API Schema.org subject', () => {
  const prepared = prepareAntifraudDataCard({
    issuer: 'https://issuer.example',
    kid: 'did:web:issuer.example#credential-es256',
    notBefore: 1_794_000_000,
    jsonApiDocument: document,
  })
  assert.deepEqual(prepared.payload.vc.credentialSubject.jsonApiDocument, document)
  assert.equal('fhirBundle' in prepared.payload.vc.credentialSubject, false)
  assert.ok(prepared.payload.vc.type.includes('urn:antifraudservices:credential:antifraud-data-card:v1'))
  const compact = assembleAntifraudDataCardJws(prepared, 'signature')
  const qr = encodeAntifraudDataCardQr(compact)
  assert.ok(qr.every(value => value.startsWith('afdc:/')))
  assert.equal(decodeAntifraudDataCardQr(qr), compact)
  assert.deepEqual(decodeAntifraudDataCardPayload(compact), prepared.payload)
})

test('rejects a credentialSubject that is not a JSON:API primary document', () => {
  assert.throws(() => prepareAntifraudDataCard({
    issuer: 'https://issuer.example', kid: 'key', notBefore: 1,
    jsonApiDocument: { fhirBundle: { resourceType: 'Bundle' } },
  }), /json_api_primary_document_required/u)
})
