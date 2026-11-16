// Flow contract: root and explicit clearing-house exports resolve to the same neutral validators, and a TypeScript consumer composes their owned cryptography types without an authorization grant.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import * as root from '../dist/index.js'
import * as publicEntry from 'antifraud-data-utils-ts/clearing-house'
const require = createRequire(import.meta.url)
test('root and clearing-house subpath expose the same verification functions', () => {
  for (const name of ['verifyPinnedJwt', 'verifyPinnedDetachedJws', 'canonicalRequestDigest', 'assertSignedReceiptBinding', 'assertTenantClearingHouseTrust']) assert.equal(root[name], publicEntry[name])
})
test('a typed consumer uses neutral verifier and cryptography contracts', () => {
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2023', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', fileURLToPath(new URL('./fixtures/clearing-house-consumer.ts', import.meta.url))], { stdio: 'pipe' })
})

test('the Gateway and SDK share neutral verification submission/result types', () => {
  execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '--strict', '--skipLibCheck', '--target', 'ES2023', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', fileURLToPath(new URL('./fixtures/verification-contracts-consumer.ts', import.meta.url))], { stdio: 'pipe' })
})
