// Flow contract: unverified presentation parsing reads supported raw JSON, compact payloads and plain object data without executing conversion/accessor hooks or accepting non-object credentials; parsing never substitutes for signature, issuer, role, time or nonce verification.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import * as contracts from '../dist/index.js'

const credential = Object.freeze({ type: ['ExampleCredential'], issuer: 'did:example:issuer', credentialSubject: { id: 'did:example:subject', label: 'Evaluación' } })
const presentation = Object.freeze({ iss: 'did:example:holder', vp: { verifiableCredential: [credential] } })
const compact = payload => `unverified-header.${contracts.Content.objectToRawBase64UrlSafe(payload)}.unverified-signature`

test('decodes exact Unicode object data from supported unverified input forms', () => {
  for (const value of [credential, Object.assign(Object.create(null), credential), JSON.stringify(credential), compact(credential)]) assert.deepEqual(contracts.decodeUnverifiedJsonOrJwtObject(value), credential)
  assert.deepEqual(contracts.decodeUnverifiedJsonOrJwtObject('{}'), {})
})

test('collects supported credential input forms without adding a credential-type or trust policy', () => {
  const input = { ...presentation, vp: { verifiableCredential: [credential, JSON.stringify(credential), compact(credential), null, 7, false, [], 'malformed', compact([])] } }
  for (const value of [input, JSON.stringify(input), compact(input)]) assert.deepEqual(contracts.extractUnverifiedPresentationCredentials(value), [credential, credential, credential])
  assert.deepEqual(contracts.extractUnverifiedPresentationCredentials({ vp: { verifiableCredential: credential } }), [])
})

test('rejects malformed encodings and non-object decoded values instead of returning trusted-looking placeholders', () => {
  const invalidUtf8 = new Uint8Array([123,34,120,34,58,34,255,34,125])
  const invalidPayload = `h.${contracts.Content.bytesToRawBase64UrlSafe(invalidUtf8)}.s`
  for (const value of [undefined, null, 7, false, '', '[]', JSON.stringify([compact(credential)]), JSON.stringify(compact(credential)), 'null', '7', '{bad', 'h.@@@.s', 'h.A.s', 'h..s', 'h.payload.s.extra', compact([]), compact(null), compact(7), invalidPayload]) assert.equal(contracts.decodeUnverifiedJsonOrJwtObject(value), undefined)
})

test('rejects nonplain containers and inherited/accessor routing fields without invoking them', () => {
  let invoked = 0
  const inherited = Object.create({ get vp() { invoked++; throw new Error('inherited getter must not execute') } })
  const accessor = { get vp() { invoked++; throw new Error('own getter must not execute') } }
  const coercion = Object.create({ toString() { invoked++; throw new Error('conversion must not execute') } })
  const inheritedCredentials = { vp: Object.create({ verifiableCredential: [credential] }) }
  const hostileReflection = new Proxy({}, { ownKeys() { throw new Error('reflection rejected') } })
  const revoked = Proxy.revocable({}, {})
  revoked.revoke()
  for (const value of [inherited, accessor, coercion, inheritedCredentials, new String(JSON.stringify(presentation)), new Date(0), hostileReflection, revoked.proxy]) assert.deepEqual(contracts.extractUnverifiedPresentationCredentials(value), [])
  assert.equal(invoked, 0)
})

test('reads only own array entries and never invokes entry or iterator accessors', () => {
  let invoked = 0
  const entries = []
  Object.defineProperty(entries, '0', { get() { invoked++; throw new Error('array entry getter must not execute') }, enumerable: true })
  Object.defineProperty(entries, Symbol.iterator, { get() { invoked++; throw new Error('custom iterator must not execute') } })
  entries[1] = credential
  assert.deepEqual(contracts.extractUnverifiedPresentationCredentials({ vp: { verifiableCredential: entries } }), [credential])
  const inheritedEntry = new Array(1)
  Object.setPrototypeOf(inheritedEntry, { 0: credential })
  assert.deepEqual(contracts.extractUnverifiedPresentationCredentials({ vp: { verifiableCredential: inheritedEntry } }), [])
  assert.equal(invoked, 0)
})

test('retains nested subject data as opaque unverified values rather than claiming recursive validation', () => {
  let invoked = 0
  const nested = { get assertedClaim() { invoked++; throw new Error('opaque nested getter must not execute while parsing') } }
  const input = { type: ['ExampleCredential'], credentialSubject: nested }
  const output = contracts.extractUnverifiedPresentationCredentials({ vp: { verifiableCredential: [input] } })
  assert.equal(output.length, 1)
  assert.strictEqual(output[0].credentialSubject, nested)
  assert.equal(invoked, 0)
})

test('preserves own data keys without prototype mutation or source writes', () => {
  const input = JSON.parse('{"__proto__":{"benchmarkMarker":true},"vp":{"verifiableCredential":[]}}')
  const before = JSON.stringify(input)
  const decoded = contracts.decodeUnverifiedJsonOrJwtObject(input)
  assert.equal(Object.getPrototypeOf(decoded), Object.prototype)
  assert.equal(Object.hasOwn(decoded, '__proto__'), true)
  assert.equal({}.benchmarkMarker, undefined)
  assert.equal(JSON.stringify(input), before)
})

test('decoding does not claim to verify the header, signature, issuer or validity period', () => {
  const input = { ...presentation, exp: 0, nonce: 'not-validated' }
  const payload = contracts.Content.objectToRawBase64UrlSafe(input)
  for (const value of [`h.${payload}.s`, `different.${payload}.tampered`]) assert.deepEqual(contracts.extractUnverifiedPresentationCredentials(value), [credential])
})

test('public parser results retain unknown field values instead of inventing a verified credential type', () => {
  const fixture = fileURLToPath(new URL('./fixtures/unverified-credential-decoding-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})
