// Flow contract: verify caller-pinned JWTs and detached signatures with real cryptography, bind signed receipts to the caller's current nonce and request, and reject ambiguous keys or altered evidence. No transport, key discovery, ledger or authorization policy is performed here.
import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import test from 'node:test'
import { CompactSign, FlattenedSign, SignJWT, exportJWK, generateKeyPair } from 'jose'
import { CryptographyService, Content } from '../dist/cryptography/index.js'
import {
  assertSignedReceiptBinding,
  assertTenantClearingHouseTrust,
  canonicalRequestDigest,
  verifyPinnedDetachedJws,
  verifyPinnedJwt,
} from '../dist/clearing-house.js'

const issuer = 'did:web:issuer.example'
const audience = 'did:web:verifier.example'
const now = 1_800_000_000
const { publicKey, privateKey } = await generateKeyPair('ES384', { extractable: true })
const publicJwk = { ...await exportJWK(publicKey), kid: 'signing-key', alg: 'ES384', use: 'sig' }
const keys = { keys: [publicJwk] }
const claims = { iss: issuer, aud: audience, iat: now - 1, exp: now + 60, jti: 'request-1' }
const sign = (payload = claims, header = { alg: 'ES384', kid: 'signing-key' }) => new SignJWT(payload).setProtectedHeader(header).sign(privateKey)
const cryptoHelper = {
  async getRandomBytes(count) { return randomBytes(count) },
  async digestString(value, algorithm) { return createHash(algorithm.replace('-', '').toLowerCase()).update(value).digest('hex') },
  randomUUID,
}
const cryptography = new CryptographyService(cryptoHelper)

// No self-declared or embedded key changes the trust selected by the caller.
test('verifies a real ES384 JWT and its pinned issuer, audience and times', async () => {
  assert.deepEqual(await verifyPinnedJwt(await sign(), keys, issuer, now, { audience }), claims)
})
test('rejects a changed JWT payload', async () => {
  const token = (await sign()).split('.')
  token[1] = Buffer.from(JSON.stringify({ ...claims, role: 'changed' })).toString('base64url')
  await assert.rejects(verifyPinnedJwt(token.join('.'), keys, issuer, now))
})
test('rejects an attacker signature even with the trusted kid and embedded attacker key', async () => {
  const attacker = await generateKeyPair('ES384')
  const token = await new SignJWT(claims).setProtectedHeader({ alg: 'ES384', kid: 'signing-key', jwk: await exportJWK(attacker.publicKey) }).sign(attacker.privateKey)
  await assert.rejects(verifyPinnedJwt(token, keys, issuer, now))
})
test('rejects missing, ambiguous, encryption-only and algorithm-mismatched trusted keys', async () => {
  const token = await sign()
  for (const jwks of [{ keys: [] }, { keys: [publicJwk, publicJwk] }, { keys: [{ ...publicJwk, use: 'enc' }] }, { keys: [{ ...publicJwk, alg: 'ES256' }] }, { keys: [{ ...publicJwk, key_ops: ['sign'] }] }]) {
    await assert.rejects(verifyPinnedJwt(token, jwks, issuer, now))
  }
})
test('requires a key id unless the caller explicitly enables a unique legacy key', async () => {
  const token = await sign(claims, { alg: 'ES384' })
  await assert.rejects(verifyPinnedJwt(token, keys, issuer, now))
  assert.equal((await verifyPinnedJwt(token, keys, issuer, now, { allowMissingKid: true })).iss, issuer)
  await assert.rejects(verifyPinnedJwt(token, { keys: [publicJwk, { ...publicJwk, kid: 'other' }] }, issuer, now, { allowMissingKid: true }))
})
test('rejects issuer, audience and expired or future JWT claims', async () => {
  for (const changed of [{ iss: 'did:web:other.example' }, { aud: 'other' }, { exp: now }, { nbf: now + 1 }, { iat: now + 31 }, { exp: 'later' }, { iat: 'now' }]) {
    await assert.rejects(verifyPinnedJwt(await sign({ ...claims, ...changed }), keys, issuer, now, { audience }))
  }
})
test('requires issued-at, expiry and a nonempty string token id by default', async () => {
  for (const changed of [{ iat: undefined }, { exp: undefined }, { jti: undefined }, { jti: {} }, { jti: '' }, { jti: ' ' }]) {
    await assert.rejects(verifyPinnedJwt(await sign({ ...claims, ...changed }), keys, issuer, now))
  }
})
test('accepts standard multiple audiences only when they contain the expected audience', async () => {
  assert.equal((await verifyPinnedJwt(await sign({ ...claims, aud: ['other', audience] }), keys, issuer, now, { audience })).iss, issuer)
})
test('explicit credential profile accepts a W3C issuer without JWT times but checks any supplied expiry', async () => {
  const credential = { issuer: { id: issuer }, credentialSubject: { id: 'subject' } }
  assert.deepEqual(await verifyPinnedJwt(await sign(credential), keys, issuer, now, { requireJwtTimes: false }), credential)
  await assert.rejects(verifyPinnedJwt(await sign(credential), keys, issuer, now))
  await assert.rejects(verifyPinnedJwt(await sign({ ...credential, exp: now }), keys, issuer, now, { requireJwtTimes: false }))
})
test('rejects unsupported critical headers and unencoded JWT payloads', async () => {
  const token = await new CompactSign(Content.objectToBytes(claims)).setProtectedHeader({ alg: 'ES384', kid: 'signing-key', b64: false, crit: ['b64'] }).sign(privateKey)
  await assert.rejects(verifyPinnedJwt(token, keys, issuer, now))
  const [header, payload, signature] = (await sign()).split('.')
  const untrustedHeader = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(header, 'base64url')), crit: [] })).toString('base64url')
  await assert.rejects(verifyPinnedJwt(`${untrustedHeader}.${payload}.${signature}`, keys, issuer, now))
})
test('rejects non-signature algorithms and invalid clock input', async () => {
  const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.`
  await assert.rejects(verifyPinnedJwt(unsigned, keys, issuer, now))
  await assert.rejects(verifyPinnedJwt(await sign(), keys, issuer, Number.NaN))
})

const bytes = Content.stringToBytesUTF8('canonical credential bytes')
async function detached(header = { alg: 'ES384', kid: 'signing-key', b64: false, crit: ['b64'] }) {
  const value = await new FlattenedSign(bytes).setProtectedHeader(header).sign(privateKey)
  return `${value.protected}..${value.signature}`
}
test('verifies a real detached ES384 unencoded signature and rejects changed bytes', async () => {
  const jws = await detached()
  await verifyPinnedDetachedJws(bytes, jws, publicJwk)
  await assert.rejects(verifyPinnedDetachedJws(Content.stringToBytesUTF8('changed'), jws, publicJwk))
})
test('also verifies the standard base64url-encoded detached payload form', async () => {
  await verifyPinnedDetachedJws(bytes, await detached({ alg: 'ES384', kid: 'signing-key' }), publicJwk)
})
test('rejects malformed detached proofs, conflicting key ids and invalid critical headers', async () => {
  const jws = await detached()
  for (const key of [{ ...publicJwk, kid: 'other' }, { ...publicJwk, use: 'enc' }, { ...publicJwk, alg: 'ES256' }, { ...publicJwk, key_ops: ['sign'] }]) {
    await assert.rejects(verifyPinnedDetachedJws(bytes, jws, key))
  }
  const parts = jws.split('.')
  await assert.rejects(verifyPinnedDetachedJws(bytes, `${parts[0]}.payload.${parts[2]}`, publicJwk))
  for (const header of [{ alg: 'ES384', kid: 'signing-key', b64: false }, { alg: 'ES384', kid: 'signing-key', b64: false, crit: ['other'] }, { alg: 'ES384', kid: 'signing-key', b64: false, crit: ['b64', 'b64'] }]) {
    const bad = `${Content.objectToRawBase64UrlSafe(header)}..${parts[2]}`
    await assert.rejects(verifyPinnedDetachedJws(bytes, bad, publicJwk))
  }
})
test('verifies real ML-DSA JWT and detached signatures only through the injected engine', async () => {
  const pair = await cryptography.generateKeyPairMlDsa(undefined, 'ML-DSA-44')
  const header = { alg: 'ML-DSA-44', kid: pair.publicJWKey.kid }
  const signed = await cryptography.signDataJws(claims, header, pair.secretKeyBytes)
  const compact = cryptography.jwsToCompact(signed)
  const jwks = { keys: [pair.publicJWKey] }
  await assert.rejects(verifyPinnedJwt(compact, jwks, issuer, now))
  assert.deepEqual(await verifyPinnedJwt(compact, jwks, issuer, now, { cryptography, audience }), claims)
  const protectedHeader = Content.objectToRawBase64UrlSafe({ ...header, b64: false, crit: ['b64'] })
  const input = new Uint8Array([...Content.stringToBytesUTF8(`${protectedHeader}.`), ...bytes])
  const signature = await cryptography.signBytes(input, pair.secretKeyBytes, 'ML-DSA-44')
  const proof = `${protectedHeader}..${Content.bytesToRawBase64UrlSafe(signature)}`
  await assert.rejects(verifyPinnedDetachedJws(bytes, proof, pair.publicJWKey))
  await verifyPinnedDetachedJws(bytes, proof, pair.publicJWKey, cryptography)
  await assert.rejects(verifyPinnedDetachedJws(Content.stringToBytesUTF8('changed'), proof, pair.publicJWKey, cryptography))
})

test('canonical SHA256 request digest is order independent and binds nested values', () => {
  const a = { z: [1, { b: true, a: 'value' }], a: 'request' }
  const b = { a: 'request', z: [1, { a: 'value', b: true }] }
  assert.equal(canonicalRequestDigest(a), canonicalRequestDigest(b))
  assert.equal(canonicalRequestDigest(a), createHash('sha256').update('{"a":"request","z":[1,{"a":"value","b":true}]}').digest('hex'))
  assert.notEqual(canonicalRequestDigest(a), canonicalRequestDigest({ ...a, a: 'changed' }))
  assert.throws(() => canonicalRequestDigest(undefined))
})
test('signed receipt binding requires the current nonce, request digest, assurance and requested claim values', () => {
  const expected = { nonce: 'current-request-nonce', requestDigest: canonicalRequestDigest({ request: true }), acceptedAssurance: ['verified'], requiredClaims: { ledger_verified: true, vp_hash: 'sha256-vp', client_id: 'device-1', consent_identifiers: ['consent-1'] } }
  const receipt = { nonce: expected.nonce, request_hash: expected.requestDigest, acr: 'verified', amr: ['openid4vp'], ...expected.requiredClaims }
  assert.doesNotThrow(() => assertSignedReceiptBinding(receipt, expected))
  for (const changed of [{ nonce: 'old-request' }, { request_hash: 'other' }, { acr: 'other' }, { amr: [] }, { amr: [1] }, { ledger_verified: false }, { vp_hash: 'other' }, { client_id: 'other' }, { consent_identifiers: [] }]) {
    assert.throws(() => assertSignedReceiptBinding({ ...receipt, ...changed }, expected))
  }
  assert.throws(() => assertSignedReceiptBinding(receipt, { ...expected, nonce: '' }))
})

const tenantTrust = {
  homeTenantReference: audience,
  sourceTenant: { tenantReference: issuer, endpoint: 'https://issuer.example/verify', capabilities: ['verifier'] },
  trustedFederatedTenantReferences: [issuer], issuer, audience, jwks: keys,
}
test('validates caller-owned tenant trust and an explicitly recognized federated verifier', () => {
  assert.equal(assertTenantClearingHouseTrust(tenantTrust, audience).href, 'https://issuer.example/verify')
  for (const changed of [{ homeTenantReference: issuer }, { audience: issuer }, { issuer: audience }, { trustedFederatedTenantReferences: [] }, { jwks: { keys: [] } }, { sourceTenant: { ...tenantTrust.sourceTenant, capabilities: [] } }]) {
    assert.throws(() => assertTenantClearingHouseTrust({ ...tenantTrust, ...changed }, audience))
  }
})
test('rejects endpoint credentials, fragments and non-HTTPS except explicitly allowed loopback tests', () => {
  for (const endpoint of ['http://issuer.example/verify', 'https://user:password@issuer.example/verify', 'https://issuer.example/verify#fragment', 'not-a-url']) {
    assert.throws(() => assertTenantClearingHouseTrust({ ...tenantTrust, sourceTenant: { ...tenantTrust.sourceTenant, endpoint } }, audience, true))
  }
  const local = { ...tenantTrust, sourceTenant: { ...tenantTrust.sourceTenant, endpoint: 'http://127.0.0.1:3000/verify' } }
  assert.throws(() => assertTenantClearingHouseTrust(local, audience))
  assert.equal(assertTenantClearingHouseTrust(local, audience, true).protocol, 'http:')
})

test('rejects symmetric signatures, private pinned keys and nonfinite or unusable clocks', async () => {
  const symmetric = await new SignJWT(claims).setProtectedHeader({ alg: 'HS256', kid: 'signing-key' }).sign(randomBytes(32))
  await assert.rejects(verifyPinnedJwt(symmetric, keys, issuer, now))
  const privateJwk = { ...await exportJWK(privateKey), kid: 'signing-key', alg: 'ES384', use: 'sig' }
  await assert.rejects(verifyPinnedJwt(await sign(), { keys: [privateJwk] }, issuer, now))
  await assert.rejects(verifyPinnedDetachedJws(bytes, await detached(), privateJwk))
  for (const clock of [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -1, 1e100]) {
    await assert.rejects(verifyPinnedJwt(await sign(), keys, issuer, clock))
  }
})
test('receipt verification rejects missing required fields and undefined expected bindings', () => {
  const expected = { nonce: 'fresh-nonce', acceptedAssurance: ['verified'], requiredClaims: { ledger_verified: true, vp_hash: 'hash' } }
  const receipt = { nonce: expected.nonce, acr: 'verified', amr: ['openid4vp'], ledger_verified: true, vp_hash: 'hash' }
  for (const field of Object.keys(receipt)) {
    const missing = { ...receipt }
    delete missing[field]
    assert.throws(() => assertSignedReceiptBinding(missing, expected))
  }
  assert.throws(() => assertSignedReceiptBinding(receipt, { ...expected, requiredClaims: { vp_hash: undefined } }))
})

test('does not accept empty assurance values or non-JSON required receipt bindings', () => {
  assert.throws(() => assertSignedReceiptBinding({ nonce: 'current', acr: '', amr: ['method'] }, { nonce: 'current', acceptedAssurance: [''] }))
  assert.throws(() => assertSignedReceiptBinding({ nonce: 'current', opaque: () => true }, { nonce: 'current', requiredClaims: { opaque: () => true } }))
})

test('rejects a valid ML-DSA proof whose critical b64 parameter is absent', async () => {
  const pair = await cryptography.generateKeyPairMlDsa(undefined, 'ML-DSA-44')
  const header = Content.objectToRawBase64UrlSafe({ alg: 'ML-DSA-44', kid: pair.publicJWKey.kid, crit: ['b64'] })
  const input = Content.stringToBytesUTF8(`${header}.${Content.bytesToRawBase64UrlSafe(bytes)}`)
  const signature = await cryptography.signBytes(input, pair.secretKeyBytes, 'ML-DSA-44')
  const proof = `${header}..${Content.bytesToRawBase64UrlSafe(signature)}`
  await assert.rejects(verifyPinnedDetachedJws(bytes, proof, pair.publicJWKey, cryptography))
})
