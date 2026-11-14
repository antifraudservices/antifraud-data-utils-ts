// Flow contract: neutral public DID and signature profile contracts compile without a product, storage adapter or frozen dependency.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
test('public DID key relationships and encoded JWS fields stay distinct',()=>{
 const fixture=fileURLToPath(new URL('./fixtures/did-jws-consumer.ts',import.meta.url))
 const program=ts.createProgram([fixture],{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,noEmit:true,skipLibCheck:true,types:[]})
 assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')),[])
})
