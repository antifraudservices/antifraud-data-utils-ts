// Flow contract: a synthetic social publication is recorded only when its public content reproduces the immutable manifest digest and the BFF supplies the exact verified managed-wallet proof; the receipt remains explicitly Demo and simulated.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ManagedSigningAlgorithm,
  ManagedSignatureProofStatus,
  SocialPublicationDemoAdapter,
  buildSocialPublicationManifestDigest,
  defineSocialPublicationDemoRecord,
} from '../dist/index.js'

const content = Object.freeze({
  mediaId: 'synthetic-coastline-001',
  caption: 'Field notes from the open learning lab.',
})
const relyingParty = 'https://social-demo.antifraud.services'
const purpose = 'synthetic-publication-manifest-signing'
const manifestDigest = buildSocialPublicationManifestDigest({...content, relyingParty, purpose})
const proof = Object.freeze({
  proofId: 'urn:proof:publication:one',
  requestId: 'urn:request:publication:one',
  operationId: 'urn:operation:publication:one',
  manifest: Object.freeze({
    id: 'urn:manifest:publication:one', version: '1', digestAlgorithm: 'sha3-384', digest: manifestDigest,
  }),
  relyingParty,
  purpose,
  signerReference: 'urn:user:synthetic-social-demo',
  algorithm: ManagedSigningAlgorithm.MlDsa65,
  verificationMethod: 'did:key:synthetic#actor-signing',
  createdAt: '2026-10-18T12:00:01.000Z',
  signature: 'c3ludGhldGljLXNpZ25hdHVyZQ',
  status: ManagedSignatureProofStatus.Verified,
})

test('defines an authoritative Demo readback without calling the simulated ledger Fabric', () => {
  const record = defineSocialPublicationDemoRecord({
    content,
    proof,
    receipt: {
      adapter: SocialPublicationDemoAdapter.InMemoryFabric,
      transactionId: 'demo-memory-opaque',
      recordedAt: '2026-10-18T12:00:07.000Z',
      cryptographicProof: true,
    },
  })

  assert.equal(record.status, 'demo-recorded')
  assert.equal(record.environment, 'demo')
  assert.equal(record.content.caption, content.caption)
  assert.equal(record.proof.manifest.digest, manifestDigest)
  assert.equal(record.receipt.adapter, 'in-memory-fabric-demo')
})

test('rejects changed public content, unverified proof metadata and non-Demo receipts', () => {
  assert.throws(() => defineSocialPublicationDemoRecord({
    content: {...content, caption: 'Changed after signing'}, proof,
    receipt: {
      adapter: SocialPublicationDemoAdapter.InMemoryFabric,
      transactionId: 'demo-memory-opaque', recordedAt: '2026-10-18T12:00:07.000Z', cryptographicProof: true,
    },
  }), /manifest digest/i)
  assert.throws(() => defineSocialPublicationDemoRecord({
    content, proof: {...proof, status: 'pending'},
    receipt: {
      adapter: SocialPublicationDemoAdapter.InMemoryFabric,
      transactionId: 'demo-memory-opaque', recordedAt: '2026-10-18T12:00:07.000Z', cryptographicProof: true,
    },
  }), /verified/i)
  assert.throws(() => defineSocialPublicationDemoRecord({
    content, proof,
    receipt: {
      adapter: 'fabric', transactionId: 'fabric-claim',
      recordedAt: '2026-10-18T12:00:07.000Z', cryptographicProof: true,
    },
  }), /Demo adapter/i)
})
