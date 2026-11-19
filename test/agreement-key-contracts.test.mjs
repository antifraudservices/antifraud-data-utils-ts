// Flow contract: eligible public agreement families are distinct from signing-engine inputs; canonical RFC X25519 and ECDH EC fixtures retain public metadata, type-safe DID relationships and independent malformed input probes without private custody material.
import assert from 'node:assert/strict'
import {createPublicKey,generateKeyPairSync,diffieHellman} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import test from 'node:test'
import ts from 'typescript'
import {importJWK} from 'jose'
const fixtures=()=>import('antifraud-data-utils-ts/did-document-test-fixtures')
const contracts=()=>import('antifraud-data-utils-ts/cryptography')

test('public agreement types compile without widening existing signing-engine input types',()=>{
 const program=ts.createProgram([fileURLToPath(new URL('./fixtures/agreement-key-consumer.ts',import.meta.url))],{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,noEmit:true,skipLibCheck:true,types:[]})
 assert.deepEqual(ts.getPreEmitDiagnostics(program).map(d=>ts.flattenDiagnosticMessageText(d.messageText,'\n')),[])
})
test('the shared RFC X25519 public fixture imports and produces a nonzero agreement with an ephemeral key',async()=>{
 const {DID_DOCUMENT_TEST_PUBLIC_KEYS:keys}=await fixtures(),{X25519_PUBLIC_KEY_BYTES}=await contracts()
 const publicKey=createPublicKey({format:'jwk',key:keys.x25519}),algorithm=keys.x25519.crv.toLowerCase()
 assert.equal(publicKey.asymmetricKeyType,algorithm)
 assert.equal(Buffer.from(keys.x25519.x,'base64url').length,X25519_PUBLIC_KEY_BYTES)
 const ephemeral=generateKeyPairSync(algorithm)
 const secret=diffieHellman({publicKey,privateKey:ephemeral.privateKey})
 assert.equal(secret.length,X25519_PUBLIC_KEY_BYTES);assert.ok(secret.some(value=>value!==0))
 assert.equal(Object.hasOwn(keys.x25519,'d'),false)
})
test('all four standard ECDH labels import the shared eligible EC and X25519 public material',async()=>{
 const {createJoseAgreementKeyTestFixtures}=await fixtures(),{JoseEcdhAlgorithms}=await contracts()
 const rows=createJoseAgreementKeyTestFixtures()
 assert.equal(rows.length,Object.values(JoseEcdhAlgorithms).length*2)
 for(const row of rows){const imported=await importJWK(row.publicKeyJwk,row.publicKeyJwk.alg);assert.ok(imported)}
})
test('agreement keys populate explicitly typed relationships without changing the default document fixture',async()=>{
 const {createDidDocumentTestFixture:make,DID_DOCUMENT_TEST_PUBLIC_KEYS:keys,DID_DOCUMENT_TEST_PROBES:probes}=await fixtures()
 const original=make({did:probes.reservedDid}),agreement=make({did:probes.reservedDid,keys:[keys.x25519,keys.ecEcdh,keys.mlkem]})
 assert.deepEqual(original.verificationMethod[0].publicKeyJwk,keys.ec)
 assert.deepEqual(agreement.keyAgreement,agreement.verificationMethod.map(m=>m.id))
 assert.deepEqual(agreement.verificationMethod.map(m=>m.publicKeyJwk),[keys.x25519,keys.ecEcdh,keys.mlkem])
})
test('shared malformed agreement probes remain unknown data and do not corrupt positive samples',async()=>{
 const {createInvalidJoseAgreementKeyTestFixtures:invalid,DID_DOCUMENT_TEST_PUBLIC_KEYS:keys}=await fixtures()
 const before=structuredClone(keys.x25519),rows=invalid()
 assert.ok(rows.length>=8);assert.equal(new Set(rows.map(row=>row.name)).size,rows.length)
 for(const row of rows)assert.notDeepEqual(row.publicKeyJwk,before)
 assert.deepEqual(keys.x25519,before)
})
