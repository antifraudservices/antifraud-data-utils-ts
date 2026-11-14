// Flow contract: actor routing recognizes only primitive syntactic identifiers without proving possession, and typed plaintext DIDComm data reuses immutable attachment projections without importing product policy or pretending that decoding verifies a message.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import * as contracts from '../dist/index.js'

test('stable actor recognition preserves the legacy string syntax without asserting a digest or ownership', () => {
  for (const value of ['urn:multibase:z1', 'urn:multibase:z111', '  urn:multibase:z123ABC  ']) assert.equal(contracts.isStableActorIdentifier(value), true)
  assert.equal(contracts.isStableActorIdentifier(contracts.buildStableActorIdentifier({ contactKind: 'email', contact: 'actor@example.invalid' })), true)
})

test('stable actor recognition rejects invalid prefixes and base58btc alphabet characters', () => {
  for (const value of ['', 'urn:multibase:z', 'URN:multibase:z1', 'urn:multibase:b1', 'urn:multibase:z0', 'urn:multibase:zO', 'urn:multibase:zI', 'urn:multibase:zl', 'urn:multibase:z1:extra', 'urn:multibase:z1\nextra']) assert.equal(contracts.isStableActorIdentifier(value), false)
})

test('stable actor recognition never coerces an object or invokes inherited conversion hooks', () => {
  const dangerous = Object.create({ get toString() { throw new Error('must not invoke inherited conversion') } })
  const hostile = { get [Symbol.toPrimitive]() { throw new Error('must not read conversion hooks') } }
  const pretending = { toString() { throw new Error('must not invoke conversion') } }
  for (const value of [undefined, null, 1, true, Symbol('example'), {}, [], new String('urn:multibase:z1'), dangerous, hostile, pretending]) assert.equal(contracts.isStableActorIdentifier(value), false)
})

test('DIDComm public profile accepts typed object bodies and existing immutable attachment builders', () => {
  assert.equal(contracts.DIDCOMM_PLAINTEXT_JSON_MEDIA_TYPE, 'application/didcomm-plain+json')
  const fixture = fileURLToPath(new URL('./fixtures/actor-didcomm-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})
