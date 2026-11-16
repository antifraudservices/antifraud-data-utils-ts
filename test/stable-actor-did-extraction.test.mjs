// Flow contract: extract only the unchanged opaque actor component from bare-host and tenant employee DIDs, preserve historical path/role bytes, reject missing bindings, and never treat extraction as contact reversal or authority admission.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as identity from '../dist/organization-identity.js'
import * as publicApi from '../dist/index.js'

// Golden wire vectors captured from released gdc-common-utils-ts@2.9.30
// using only the synthetic fixtures below. Baseline npm tarball integrity:
// sha512-+ZJLEp/AfmCm4ZwJRU5wKTmWJPevlJ8Wa82EepyoGz0BE3sKBA2JjVbh4ML5+e+RIzstwoJnk4vWE4E44UhTqg==
// The published package exposes no source commit. Captured bytes are the oracle;
// no predecessor package is loaded at test time.
const reviewedActors = Object.freeze(["urn:multibase:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK", "urn:multibase:zW1giLKJrjrNjHVQVR15bMZUu8AgojUEUW2BL66v1Z6Fojp"])
const contacts=[{contactKind:'email',contact:'Employee@example.invalid'},{contactKind:'phone',contact:'+12025550123'}]
const vectors=contacts.flatMap((contact,index)=>{
 const actor=reviewedActors[index],payload=actor.slice('urn:multibase:'.length)
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
  assert.equal(publicApi.stableActorIdentifierFromDidWeb(did),actor)
 }
})

test('missing employee marker, opaque component or role cannot yield an actor binding',()=>{
 assert.equal(typeof identity.stableActorIdentifierFromDidWeb,'function')
 for(const value of ['', 'did:web:example.invalid', 'did:web:example.invalid:individual:zSynthetic:RESPRSN',
  'did:web:example.invalid:employee::RESPRSN','did:web:example.invalid:employee:zSynthetic:',
  'did:web:example.invalid:employee:urn%3Amultibase%3AzSynthetic:RESPRSN']){
  assert.throws(()=>identity.stableActorIdentifierFromDidWeb(value))
  assert.throws(()=>publicApi.stableActorIdentifierFromDidWeb(value))
 }
})

test('existing contact-derived actor and employee DID builders retain independent published-vector extraction',()=>{
 for(const [index,contact] of contacts.entries()){
  const actor=identity.buildStableActorIdentifier(contact)
  const did=identity.buildOrganizationEmployeeDidWeb({...contact,organizationDidWeb:'did:web:example.invalid',role:'RESPRSN'})
  assert.equal(identity.stableActorIdentifierFromDidWeb(did),reviewedActors[index])
  assert.equal(actor,reviewedActors[index])
 }
})
