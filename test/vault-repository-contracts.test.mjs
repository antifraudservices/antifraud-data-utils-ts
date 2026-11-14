// Flow contract: cross-sector consumers compile one neutral record/query/repository port without importing a product SDK or backend adapter; query input remains the existing exact-field profile rather than silently becoming EAV, HMAC or nested-path search.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

test('neutral vault contracts compile typed records and operations without a product dependency', () => {
  const fixture = fileURLToPath(new URL('./fixtures/vault-repository-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})

test('neutral repository source contains abstract contracts rather than product imports or persistence implementations', () => {
  const filename = fileURLToPath(new URL('../src/vault-repository.ts', import.meta.url))
  const source = ts.createSourceFile(filename, readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true)
  const forbidden = []
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteralLike(statement.moduleSpecifier) && /^(?:sos-|gdc-|fhir-)/u.test(statement.moduleSpecifier.text)) forbidden.push('foreign product or clinical dependency')
    if (ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement) || ts.isVariableStatement(statement)) forbidden.push('runtime implementation in the abstract port module')
  }
  assert.deepEqual(forbidden, [])
})
