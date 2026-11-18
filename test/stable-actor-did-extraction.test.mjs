// Flow contract: extract only the unchanged opaque actor component from bare-host and tenant employee DIDs, preserve historical path/role bytes, reject missing bindings, and never treat extraction as contact reversal or authority admission.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as identity from '../dist/organization-identity.js'
import * as publicApi from '../dist/index.js'
import {readFileSync} from 'node:fs'
const recorded=JSON.parse(readFileSync(new URL('./fixtures/predecessor-vectors.json',import.meta.url),'utf8'))

// Read-only wire provenance: https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/actor-identifier.ts
// Exact predecessor source hashes and immutable full URLs accompany the inert fixture.
const contacts=[{contactKind:'email',contact:'Employee@example.invalid'},{contactKind:'phone',contact:'+12025550123'}]
const vectors=contacts.flatMap(contact=>{
 const actor=identity.buildStableActorIdentifier(contact),payload=actor.slice('urn:multibase:'.length)
 return [
  {actor,did:`did:web:example.invalid:employee:${payload}:RESPRSN`},
  {actor,did:`did:web:example.invalid:example-tenant:cds-es-md:v1:health-care:employee:${payload}:ISCO-08%7C2261`},
  {actor,did:` did:web:example.invalid:employee:${payload}:RESPRSN:device:synthetic-device `},
 ]
})

test('public extraction preserves the historical bare-host, tenant, role and trailing-path actor bytes',()=>{
 assert.equal(typeof identity.stableActorIdentifierFromDidWeb,'function')
 assert.equal(publicApi.stableActorIdentifierFromDidWeb,identity.stableActorIdentifierFromDidWeb)
 for(const {actor,did} of vectors){
  assert.equal(identity.stableActorIdentifierFromDidWeb(did),actor)
  const expected=recorded.extraction.find(row=>row.input===did)
  assert.ok(expected)
  assert.equal(identity.stableActorIdentifierFromDidWeb(did),expected.expected)
  assert.equal(publicApi.stableActorIdentifierFromDidWeb(did),expected.expected)
 }
})

test('missing employee marker, opaque component or role cannot yield an actor binding',()=>{
 assert.equal(typeof identity.stableActorIdentifierFromDidWeb,'function')
 for(const value of ['', 'did:web:example.invalid', 'did:web:example.invalid:individual:zSynthetic:RESPRSN',
  'did:web:example.invalid:employee::RESPRSN','did:web:example.invalid:employee:zSynthetic:',
  'did:web:example.invalid:employee:urn%3Amultibase%3AzSynthetic:RESPRSN']){
  assert.throws(()=>identity.stableActorIdentifierFromDidWeb(value))
  assert.throws(()=>publicApi.stableActorIdentifierFromDidWeb(value))
  assert.equal(recorded.invalidExtraction.find(row=>row.input===value)?.rejected,true)
 }
})

test('existing contact-derived actor and employee DID builders retain independent published-oracle extraction',()=>{
 for(const [index,contact] of contacts.entries()){
  const actor=identity.buildStableActorIdentifier(contact)
  const did=identity.buildOrganizationEmployeeDidWeb({...contact,organizationDidWeb:'did:web:example.invalid',role:'RESPRSN'})
  const expected=recorded.extraction[index*3]
  assert.equal(did,expected.input)
  assert.equal(identity.stableActorIdentifierFromDidWeb(did),expected.expected)
  assert.equal(actor,expected.expected)
 }
})
