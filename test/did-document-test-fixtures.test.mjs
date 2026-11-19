// Flow contract: neutral public DID/JWK test material uses existing public contracts, contains no custody material, preserves independent fixtures across mutations, and exposes invalid vectors as untrusted JSON rather than valid keys.
import assert from 'node:assert/strict'
import {createPublicKey} from 'node:crypto'
import test from 'node:test'
import ts from 'typescript'
import {fileURLToPath} from 'node:url'
const fixture=()=>import('antifraud-data-utils-ts/did-document-test-fixtures')

test('public fixture consumer compiles with existing DID and cryptography contracts',()=>{
 const program=ts.createProgram([fileURLToPath(new URL('./fixtures/did-document-test-fixtures-consumer.ts',import.meta.url))],{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,noEmit:true,skipLibCheck:true,types:[]})
 assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[])
})
test('public samples contain only public parameters and a usable EC point',async()=>{
 const {DID_DOCUMENT_TEST_PUBLIC_KEYS:keys}=await fixture()
 assert.equal(createPublicKey({format:'jwk',key:keys.ec}).asymmetricKeyType,'ec')
 assert.equal(keys.mlkem.kty,'OKP');assert.equal(Buffer.from(keys.mlkem.x,'base64url').length,1184)
 for(const key of Object.values(keys))for(const field of ['d','k','p','q','seed','secretKey','privateKey'])assert.equal(Object.hasOwn(key,field),false)
})
test('positive documents preserve caller DID, declared key order and independent nested values',async()=>{
 const {createDidDocumentTestFixture:make,DID_DOCUMENT_TEST_PUBLIC_KEYS:keys,DID_DOCUMENT_TEST_PROBES:probes}=await fixture()
 const first=make({did:probes.reservedDid,keys:[keys.mlkem,keys.ec]}),second=make({did:probes.reservedDid,keys:[keys.mlkem,keys.ec]})
 assert.equal(first.id,probes.reservedDid);assert.deepEqual(first.keyAgreement,first.verificationMethod.map(m=>m.id))
 assert.deepEqual(first.verificationMethod.map(m=>m.publicKeyJwk),[keys.mlkem,keys.ec])
 first.verificationMethod[0].publicKeyJwk.kid='changed-only-in-first-document'
 assert.notDeepEqual(first,second);assert.deepEqual(second.verificationMethod[0].publicKeyJwk,keys.mlkem)
})
test('named adversarial document vectors retain a separate unchanged positive control',async()=>{
 const {createDidDocumentTestFixture:make,createInvalidDidDocumentTestFixtures:invalid,DID_DOCUMENT_TEST_PROBES:probes}=await fixture()
 const before=make({did:probes.reservedDid}),vectors=invalid({did:probes.reservedDid})
 assert.ok(vectors.length>=12);assert.equal(new Set(vectors.map(v=>v.name)).size,vectors.length)
 for(const vector of vectors){assert.equal(typeof vector.name,'string');assert.notDeepEqual(vector.document,before)}
 assert.deepEqual(make({did:probes.reservedDid}),before)
})
test('transport probes distinguish loopback capability tests from foreign and userinfo substitution',async()=>{
 const {DID_DOCUMENT_TEST_PROBES:probes}=await fixture()
 assert.equal(new URL(probes.loopbackDocumentUrl).hostname,'127.0.0.1')
 assert.notEqual(new URL(probes.foreignDocumentUrl).hostname,new URL(probes.reservedOrigin).hostname)
 assert.ok(new URL(probes.userinfoDocumentUrl).username)
 assert.ok(new URL(probes.queryDocumentUrl).search)
 assert.ok(new URL(probes.fragmentDocumentUrl).hash)
})
