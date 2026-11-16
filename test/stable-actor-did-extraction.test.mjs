// Flow contract: extract only the unchanged opaque actor component from bare-host and tenant employee DIDs, preserve historical path/role bytes, reject missing bindings, and never treat extraction as contact reversal or authority admission.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as identity from '../dist/organization-identity.js'
import * as publicApi from '../dist/index.js'
import {stableActorIdentifierFromDidWeb as historicalExtraction} from 'gdc-common-utils-ts/utils/actor-identifier'

// Read-only wire provenance: https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/actor-identifier.ts
// The predecessor is an existing development-only oracle, never a shipped import.
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
  assert.equal(identity.stableActorIdentifierFromDidWeb(did),historicalExtraction(did))
 }
})

test('missing employee marker, opaque component or role cannot yield an actor binding',()=>{
 assert.equal(typeof identity.stableActorIdentifierFromDidWeb,'function')
 for(const value of ['', 'did:web:example.invalid', 'did:web:example.invalid:individual:zSynthetic:RESPRSN',
  'did:web:example.invalid:employee::RESPRSN','did:web:example.invalid:employee:zSynthetic:',
  'did:web:example.invalid:employee:urn%3Amultibase%3AzSynthetic:RESPRSN']){
  assert.throws(()=>identity.stableActorIdentifierFromDidWeb(value))
  assert.throws(()=>historicalExtraction(value))
 }
})

test('existing contact-derived actor and employee DID builders retain independent published-oracle extraction',()=>{
 for(const contact of contacts){
  const actor=identity.buildStableActorIdentifier(contact)
  const did=identity.buildOrganizationEmployeeDidWeb({...contact,organizationDidWeb:'did:web:example.invalid',role:'RESPRSN'})
  assert.equal(historicalExtraction(did),actor)
 }
})
