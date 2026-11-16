// Flow contract: normalize an actual email or E.164 phone, derive the established stable actor and organization employee DID, preserve published email bytes and reject wrong-channel or malformed inputs without treating contact data as authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeActorContact, buildStableActorIdentifier, buildOrganizationEmployeeDidWeb } from '../dist/organization-identity.js'

// Golden wire vectors captured from released gdc-common-utils-ts@2.9.30
// using only the synthetic fixtures below. Baseline npm tarball integrity:
// sha512-+ZJLEp/AfmCm4ZwJRU5wKTmWJPevlJ8Wa82EepyoGz0BE3sKBA2JjVbh4ML5+e+RIzstwoJnk4vWE4E44UhTqg==
// The published package exposes no source commit. Captured bytes are the oracle;
// no predecessor package is loaded at test time.
const reviewedWire = Object.freeze({
  "actors": [
    "urn:multibase:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK",
    "urn:multibase:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK",
    "urn:multibase:zW1kzKhP6Z6uTKEomsbXitSJVWbrW2HUmyqRAcFynSHQ7mD",
    "urn:multibase:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK",
    "urn:multibase:zW1pQiLt7MP8e7TmU95v91yp9S3Jc8feM2hbN7by1jYaXyN",
    "urn:multibase:zW1pQiLt7MP8e7TmU95v91yp9S3Jc8feM2hbN7by1jYaXyN"
  ],
  "employees": [
    [
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359",
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359:example-device"
    ],
    [
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359",
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359:example-device"
    ],
    [
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1kzKhP6Z6uTKEomsbXitSJVWbrW2HUmyqRAcFynSHQ7mD:ISCO-08|2359",
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1kzKhP6Z6uTKEomsbXitSJVWbrW2HUmyqRAcFynSHQ7mD:ISCO-08|2359:example-device"
    ],
    [
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359",
      "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1hfu3K7j9WfUqGTnxJ6FwDX4AQnzAqQM9x9pZ8gQLmwZK:ISCO-08|2359:example-device"
    ]
  ],
  "phoneEmployee": "did:web:example.invalid:tenant:example-organization:cds-CA-BC:v1:education-tech:employee:zW1pQiLt7MP8e7TmU95v91yp9S3Jc8feM2hbN7by1jYaXyN:ISCO-08|2359"
})

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
  for (const [index, vector] of vectors.entries()) assert.equal(buildStableActorIdentifier(vector), reviewedWire.actors[index])
  assert.notEqual(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors.at(-1)))
  assert.equal(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors[3]))
  assert.notEqual(buildStableActorIdentifier(vectors[0]), buildStableActorIdentifier(vectors[2]))
})

test('preserves exact published organization employee DID bytes for email', () => {
  for (const [index, vector] of vectors.filter(vector => vector.contactKind === 'email').entries()) {
    for (const [deviceIndex, deviceId] of [undefined, fixture.deviceId].entries()) {
      const actual = buildOrganizationEmployeeDidWeb({ ...fixture, ...vector, deviceId })
      assert.equal(actual, reviewedWire.employees[index][deviceIndex])
    }
  }
})

test('uses the already established employee DID representation for a phone actor', () => {
  const actual = buildOrganizationEmployeeDidWeb({ ...fixture, contactKind: 'phone', contact: fixture.phone, deviceId: undefined })
  assert.equal(actual, reviewedWire.phoneEmployee)
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
