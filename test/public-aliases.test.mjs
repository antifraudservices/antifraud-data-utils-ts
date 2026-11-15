// Flow contract: preserve opaque public CID/DID aliases separately from exchange controller/telephone alias normalization, retain established SHA3-256 multihash bytes without weakening strict contact validation, and never coerce unsupported objects into identity data or authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import {readFileSync} from 'node:fs'
import {sha3_256} from '@noble/hashes/sha3.js'
import {decodeBase58btc} from '../dist/encoding/base58btc.js'
import {buildStableActorIdentifier,normalizeActorContact} from '../dist/organization-identity.js'
import {SyntheticConfidentialDocumentFixture} from '../dist/identity-assurance/index.js'
const values=JSON.parse(readFileSync(new URL('./fixtures/public-alias-values.json',import.meta.url),'utf8'))
const contract=await import('../dist/public-aliases.js').catch(error=>{
 if(error.code==='ERR_MODULE_NOT_FOUND')return {}
 throw error
})
function need(name){assert.equal(typeof contract[name],'function','missing owned '+name);return contract[name]}
function assertRawHash(value,canonical){
 assert.ok(value.startsWith('urn:multibase:z'))
 const bytes=decodeBase58btc(value.slice('urn:multibase:'.length))
 assert.deepEqual(bytes,Uint8Array.from([0x16,0x20,...sha3_256(new TextEncoder().encode(canonical))]))
}

test('public alias lists retain bare CIDs and exact opaque aliases while trimming CSV and stable duplicates',()=>{
 const normalize=need('normalizePublicAliasList')
 const cid=SyntheticConfidentialDocumentFixture.attachment.contentId
 assert.ok(cid.startsWith('z'))
 assert.deepEqual(normalize([` ${cid},${values.did} `,values.urn,values.did,` ${values.email} `]),[cid,values.did,values.urn,values.email])
 assert.deepEqual(normalize(` ${values.did}, ,${values.urn},${values.did}`),[values.did,values.urn])
 assert.deepEqual(normalize(undefined),[])
})
test('controller aliases preserve opaque identifiers and canonicalize only the established exchange hash envelope',()=>{
 const normalize=need('normalizeControllerAlias')
 const actor=buildStableActorIdentifier({contactKind:'email',contact:values.email})
 assert.equal(normalize(' '+values.email+' '),actor)
 assert.equal(normalize(actor.slice('urn:multibase:'.length)),actor)
 assert.equal(normalize('URN:MULTIBASE: '+actor.slice('urn:multibase:'.length)),actor)
 assert.equal(normalize(values.did),values.did)
 assert.equal(normalize(values.urn),values.urn)
 assert.equal(normalize('  '),'')
})
test('exchange email hashing retains its exact prefix bytes and stays separate from strict contact normalization',()=>{
 const normalize=need('normalizeControllerAlias')
 const input='mailto:'+values.email
 const expectedCanonical=input.toLowerCase()
 assertRawHash(normalize(input),expectedCanonical)
 assert.notEqual(normalize(input),buildStableActorIdentifier({contactKind:'email',contact:input}))
 assert.equal(normalizeActorContact({contactKind:'email',contact:input}),values.email.toLowerCase())
})
test('telephone aliases preserve formatted and already-hashed exchange values without changing strict E164 behavior',()=>{
 const normalize=need('normalizeTelephoneAlias')
 const actor=buildStableActorIdentifier({contactKind:'phone',contact:values.phone})
 assert.equal(normalize(values.formattedPhone),actor)
 assert.equal(normalize(actor),actor)
 assert.equal(normalize(actor.slice('urn:multibase:'.length)),actor)
 assert.equal(normalize('no digits'),'')
 assertRawHash(normalize('not-a-number123'),'123')
 assert.throws(()=>normalizeActorContact({contactKind:'phone',contact:'not-a-number123'}))
})
test('unsupported objects are not coerced and alias lists never read inherited or accessor entries',()=>{
 const list=need('normalizePublicAliasList'),controller=need('normalizeControllerAlias'),telephone=need('normalizeTelephoneAlias')
 const unsupported={toString(){throw new Error('unsupported object was coerced')}}
 assert.deepEqual(list(unsupported),[])
 assert.equal(controller(unsupported),'')
 assert.equal(telephone(unsupported),'')
 const accessor=[];Object.defineProperty(accessor,'0',{get(){throw new Error('accessor alias was invoked')},enumerable:true})
 assert.deepEqual(list(accessor),[])
 const inherited=[];Object.setPrototypeOf(inherited,{0:values.did});inherited.length=1
 assert.deepEqual(list(inherited),[])
})
