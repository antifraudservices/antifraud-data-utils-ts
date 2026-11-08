// Flow contract: normalize an actual email or E.164 phone, derive the established stable actor and organization employee DID, preserve published email bytes and reject wrong-channel or malformed inputs without treating contact data as authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStableActorIdentifier as compatibilityActor, buildPortalActorDidWeb } from 'gdc-common-utils-ts/utils/actor-identifier'
import { buildProfessionalDidWeb } from 'gdc-common-utils-ts/utils/did'
import { normalizeActorContact, buildStableActorIdentifier, buildOrganizationEmployeeDidWeb } from '../dist/organization-identity.js'

const fixture = Object.freeze({
  organizationDidWeb: 'did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech',
  role: 'ISCO-08|2359',
  email: 'Employee@Example.Invalid',
  phone: '+16505550111',
  deviceId: 'example-device',
})
const vectors = [
  { contactKind: 'email', contact: fixture.email },
  { contactKind: 'email', contact: ` mailto:${fixture.email} ` },
  { contactKind: 'email', contact: fixture.email.replace('Employee', 'Employee+Tag') },
  { contactKind: 'email', contact: fixture.email.toLowerCase() },
  { contactKind: 'phone', contact: fixture.phone },
  { contactKind: 'phone', contact: ` tel:${fixture.phone.slice(0, 2)} (650) 555-0111 ` },
]

test('normalizes contact values with an explicit channel', () => {
  assert.equal(normalizeActorContact(vectors[1]), fixture.email.toLowerCase())
  assert.equal(normalizeActorContact(vectors.at(-1)), fixture.phone)
})

test('preserves published actor hashes for email and phone, including formatted inputs', () => {
  for (const vector of vectors) assert.equal(buildStableActorIdentifier(vector), compatibilityActor(vector))
  assert.notEqual(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors.at(-1)))
  assert.equal(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors[3]))
  assert.notEqual(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors[2]))
})

test('preserves exact published organization employee DID bytes for email', () => {
  for (const vector of vectors.filter(vector => vector.contactKind === 'email')) {
    for (const deviceId of [undefined, fixture.deviceId]) {
      const actual = buildOrganizationEmployeeDidWeb({ ...fixture, ...vector, deviceId })
      assert.equal(actual, buildProfessionalDidWeb({ ...fixture, email: normalizeActorContact(vector), deviceId }))
    }
  }
})

test('uses the already established employee DID representation for a phone actor', () => {
  const actorIdentifier = compatibilityActor({ contactKind: 'phone', contact: fixture.phone })
  const actual = buildOrganizationEmployeeDidWeb({ ...fixture, contactKind: 'phone', contact: fixture.phone, deviceId: undefined })
  assert.equal(actual, buildPortalActorDidWeb({ portalDidWeb: fixture.organizationDidWeb, actorIdentifier, role: fixture.role }))
  assert.equal(actual.includes(fixture.phone), false)
  assert.equal(actual.includes(fixture.email), false)
  assert.equal(actual.includes(':employee:'), true)
  assert.notEqual(actual, buildOrganizationEmployeeDidWeb({ ...fixture, contactKind: 'phone', contact: fixture.phone, role: 'RESPRSN', deviceId: undefined }))
})

test('does not substitute a phone for email or accept unsupported contact kinds', () => {
  for (const input of [
    { contactKind: 'email', contact: fixture.phone },
    { contactKind: 'phone', contact: fixture.email },
    { contactKind: 'sms', contact: fixture.phone },
    { contactKind: 'phone', contact: '++16505550111' },
    { contactKind: 'phone', contact: '16505550111' },
    { contactKind: 'phone', contact: '+0123456789' },
    { contactKind: 'phone', contact: '+1234567890123456' },
    { contactKind: 'email', contact: '' },
  ]) assert.throws(() => buildStableActorIdentifier(input))
})

test('requires an organization did:web root and a nonempty separate role', () => {
  const input = { ...fixture, contactKind: 'phone', contact: fixture.phone }
  assert.throws(() => buildOrganizationEmployeeDidWeb({ ...input, organizationDidWeb: 'did:key:example' }))
  assert.throws(() => buildOrganizationEmployeeDidWeb({ ...input, role: ' ' }))
})
