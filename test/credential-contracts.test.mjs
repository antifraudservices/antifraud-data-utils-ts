// Flow contract: neutral credential and presentation projections preserve current consumer wire profiles, support typed sector claims, and distinguish unverified data from encoded tokens and verified authorization without importing product policy.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import * as contracts from '../dist/index.js'

test('canonical credential contexts and base types retain their exact identities', () => {
  assert.equal(contracts.W3cCredentialContexts?.V1, 'https://www.w3.org/2018/credentials/v1')
  assert.equal(contracts.W3cCredentialContexts?.V2, 'https://www.w3.org/ns/credentials/v2')
  assert.equal(contracts.VC_CONTEXT_V2, contracts.W3cCredentialContexts?.V2)
  assert.equal(contracts.W3cCredentialTypes?.VerifiableCredential, 'VerifiableCredential')
  assert.equal(contracts.W3cCredentialTypes?.VerifiablePresentation, 'VerifiablePresentation')
  assert.ok(Object.isFrozen(contracts.W3cCredentialContexts))
  assert.ok(Object.isFrozen(contracts.W3cCredentialTypes))
})

test('public credential and presentation consumer profiles compile without assigning verification status', () => {
  const fixture = fileURLToPath(new URL('./fixtures/credential-contracts-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})
