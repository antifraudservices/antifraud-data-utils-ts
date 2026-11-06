// Flow contract: any domain can carry one RFC 7797 detached ML-DSA proof in the neutral pqc:/ URI and numeric multi-QR transport without repeating or interpreting the signed health, identity or business document.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodePostQuantumDetachedProofQr,
  decodePostQuantumDetachedProofUri,
  encodePostQuantumDetachedProofQr,
  encodePostQuantumDetachedProofUri,
} from '../dist/cryptography/index.js'

const header = Buffer.from(JSON.stringify({ alg: 'ML-DSA-65', kid: 'did:web:issuer.example#pqc', b64: false, crit: ['b64'] })).toString('base64url')
const detached = `${header}..${'signature'.repeat(300)}`

test('round-trips the generic detached proof URI and two numeric QR labels', () => {
  const uri = encodePostQuantumDetachedProofUri(detached)
  assert.equal(uri, `pqc:/${detached}`)
  assert.equal(decodePostQuantumDetachedProofUri(uri), detached)
  const qr = encodePostQuantumDetachedProofQr(detached)
  assert.equal(qr.length, 2)
  assert.ok(qr.every(value => /^pqc:\/[12]\/2\/\d+$/u.test(value)))
  assert.equal(decodePostQuantumDetachedProofQr([...qr].reverse()), detached)
})

test('rejects a detached proof without the RFC 7797 b64 critical header', () => {
  const invalidHeader = Buffer.from(JSON.stringify({ alg: 'ML-DSA-65', kid: 'key' })).toString('base64url')
  assert.throws(() => encodePostQuantumDetachedProofUri(`${invalidHeader}..signature`), /detached_jws_invalid/u)
})
