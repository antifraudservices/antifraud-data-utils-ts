// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CredentialIssuanceStatus,
  credentialIssuanceRequestFixture,
  defineCredentialIssuanceRequest,
  parseCredentialIssuanceReceiptWire,
  toCredentialIssuanceRequestWire,
} from '../dist/identity-assurance/index.js'

test('owns the canonical credential issuance lifecycle wire values', () => {
  assert.deepEqual(CredentialIssuanceStatus, {
    Pending: 'pending',
    Issued: 'issued',
    Denied: 'denied',
    Failed: 'failed',
  })
})

test('builds a provider request and rejects caller-supplied authoritative claims', () => {
  const request = defineCredentialIssuanceRequest(credentialIssuanceRequestFixture)
  assert.deepEqual(toCredentialIssuanceRequestWire(request), {
    subject_reference: request.subjectReference,
    capability: request.capability,
    verification_transaction_id: request.verificationTransactionId,
  })

  assert.throws(
    () => defineCredentialIssuanceRequest({...credentialIssuanceRequestFixture, claims: {name: 'forbidden'}}),
    /Caller-supplied claims/,
  )
})

test('parses an issued provider receipt without changing its credential', () => {
  const credential = Object.freeze({type: Object.freeze(['VerifiableCredential'])})
  assert.deepEqual(parseCredentialIssuanceReceiptWire({
    issuance_id: 'issuance-synthetic-001',
    status: CredentialIssuanceStatus.Issued,
    credential,
  }), {
    issuanceId: 'issuance-synthetic-001',
    status: CredentialIssuanceStatus.Issued,
    credential,
  })
})

test('rejects incomplete or contradictory provider receipts', () => {
  assert.throws(
    () => parseCredentialIssuanceReceiptWire({issuance_id: 'x', status: 'unknown'}),
    /Invalid credential-provider response/,
  )
  assert.throws(
    () => parseCredentialIssuanceReceiptWire({
      issuance_id: 'x',
      status: CredentialIssuanceStatus.Denied,
      credential: {type: ['VerifiableCredential']},
      reason: 'denied',
    }),
    /must not include a credential/,
  )
})
