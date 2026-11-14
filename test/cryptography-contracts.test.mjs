// Flow contract: a stateless crypto consumer compiles against public neutral key/byte contracts while private publication shapes and encoded/raw payload confusion are rejected.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'

test('public cryptography contracts support caller-owned keys without an upstream project', () => {
  const fixture = fileURLToPath(new URL('./fixtures/cryptography-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], {
    target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true,
    noEmit: true, skipLibCheck: true, types: [],
  })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.deepEqual(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), [])
})
