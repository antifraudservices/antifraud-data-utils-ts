// Flow contract: build the existing reviewed admission and three domain credential drafts from explicit email/phone parties and caller-governed roles; preserve email/proof payload bytes, keep phone out of email, and never treat draft construction or canonicalization as signature verification or host admission.
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildOrganizationTestNetworkCredential as admissionOracle,
  canonicalizeOrganizationTestNetworkCredential as admissionCanonicalOracle,
} from 'gdc-common-utils-ts/utils/organization-test-network-credential'
import {
  buildTestNetworkOrganizationCredentialSet as domainOracle,
  canonicalizeTestNetworkOrganizationCredential as domainCanonicalOracle,
} from 'gdc-common-utils-ts/utils/test-network-organization-credentials'
import { buildStableActorIdentifier } from '../dist/organization-identity.js'
import {
  buildOrganizationTestNetworkCredential,
  buildTestNetworkOrganizationCredentialSet,
  canonicalizeOrganizationTestNetworkCredential,
  canonicalizeTestNetworkOrganizationCredential,
} from '../dist/organization-credentials.js'

const base = Object.freeze({
  issuerDid: 'did:web:example.invalid:host', subjectDid: 'did:web:example.invalid:organization',
  organizationDid: 'did:web:example.invalid:organization', applicationId: '00000000-0000-4000-8000-000000000001',
  credentialId: 'urn:uuid:00000000-0000-4000-8000-000000000001', validFrom: '2026-11-08T00:00:00.000Z',
  validUntil: '2026-11-09T00:00:00.000Z', legalName: 'Example organization', organizationIdentifier: 'EXAMPLE-ORG',
  controllerEmail: 'Controller@Example.Invalid', legalRepresentativeEmail: 'Representative@Example.Invalid',
  controllerKeyMaterial: 'urn:jwk-thumbprint:sha-256:example', accessPath: 'test-network',
  pdfSha256: 'a'.repeat(64), documentVersion: 'example-v1', identifierType: 'taxID', addressCountry: 'ca',
  serviceCategory: 'education-tech', legalRepresentativeFullName: 'Example representative',
  legalRepresentativeOccupation: 'ISCO-08|1120', controllerOccupation: 'ISCO-08|1330', controllerAuthorityRole: 'RESPRSN',
})
const phone = '+16505550111'
const phoneController = { ...base, controllerEmail: undefined, controllerTelephone: phone }

test('preserves the exact published admission credential JSON for email', () => {
  assert.equal(JSON.stringify(buildOrganizationTestNetworkCredential(base)), JSON.stringify(admissionOracle(base)))
})

test('preserves the exact published three domain credential JSONs for caller-supplied legacy roles', () => {
  assert.equal(JSON.stringify(buildTestNetworkOrganizationCredentialSet(base)), JSON.stringify(domainOracle(base)))
})

test('preserves proof-free canonicalization bytes and does not count a proof as verified', () => {
  const admission = { ...admissionOracle(base), proof: { jws: 'unverified-example' } }
  assert.equal(canonicalizeOrganizationTestNetworkCredential(admission), admissionCanonicalOracle(admission))
  const domains = domainOracle(base)
  for (const credential of domains) {
    const candidate = { ...credential, proof: [{ jws: 'unverified-example' }], evidence: [{ ...credential.evidence[0], proof: { test: true } }] }
    assert.equal(canonicalizeTestNetworkOrganizationCredential(candidate), domainCanonicalOracle(candidate))
  }
})

test('projects a phone controller as telephone and binds its domain owner to the established phone actor', () => {
  const admission = buildOrganizationTestNetworkCredential(phoneController)
  assert.equal(admission.credentialSubject.controller.telephone, phone)
  assert.equal(Object.hasOwn(admission.credentialSubject.controller, 'email'), false)
  const [, representative, controller] = buildTestNetworkOrganizationCredentialSet(phoneController)
  assert.equal(controller.credentialSubject.owner.sameAs, buildStableActorIdentifier({ contactKind: 'phone', contact: phone }))
  assert.equal(representative.credentialSubject.sameAs, buildStableActorIdentifier({ contactKind: 'email', contact: base.legalRepresentativeEmail }))
})

test('keeps independently selected representative and controller channels separate', () => {
  const input = { ...base, legalRepresentativeEmail: undefined, legalRepresentativeTelephone: phone }
  const [, representative, controller] = buildTestNetworkOrganizationCredentialSet(input)
  assert.equal(representative.credentialSubject.sameAs, buildStableActorIdentifier({ contactKind: 'phone', contact: phone }))
  assert.equal(controller.credentialSubject.owner.sameAs, buildStableActorIdentifier({ contactKind: 'email', contact: base.controllerEmail }))
  assert.notEqual(representative.credentialSubject.sameAs, controller.credentialSubject.owner.sameAs)
})

test('supports the same phone for representative and controller without adding email fields', () => {
  const input = { ...phoneController, legalRepresentativeEmail: undefined, legalRepresentativeTelephone: phone }
  const [, representative, controller] = buildTestNetworkOrganizationCredentialSet(input)
  assert.equal(representative.credentialSubject.sameAs, controller.credentialSubject.owner.sameAs)
  assert.equal(representative.credentialSubject.hasOccupation.occupationalCategory, input.legalRepresentativeOccupation)
  assert.equal(controller.credentialSubject.owner.additionalType, input.controllerAuthorityRole)
  assert.equal(JSON.stringify([buildOrganizationTestNetworkCredential(input), representative, controller]).includes('"email"'), false)
})

test('rejects ambiguous, absent or wrong-channel party contacts instead of silently selecting one', () => {
  for (const input of [
    { ...base, controllerTelephone: phone },
    { ...base, controllerEmail: undefined },
    { ...base, controllerEmail: phone },
    { ...base, legalRepresentativeTelephone: phone },
    { ...base, legalRepresentativeEmail: undefined },
  ]) assert.throws(() => buildTestNetworkOrganizationCredentialSet(input))
  assert.throws(() => buildOrganizationTestNetworkCredential({ ...base, controllerTelephone: phone }))
})

test('requires caller-governed occupations and controller authority instead of assigning them', () => {
  for (const key of ['legalRepresentativeOccupation', 'controllerOccupation', 'controllerAuthorityRole']) {
    assert.throws(() => buildTestNetworkOrganizationCredentialSet({ ...base, [key]: '' }))
  }
})

test('rejects canonicalization under the wrong credential type or without domain Test Network marker', () => {
  assert.throws(() => canonicalizeOrganizationTestNetworkCredential({ ...admissionOracle(base), type: ['VerifiableCredential'] }))
  const domain = domainOracle(base)[0]
  assert.throws(() => canonicalizeTestNetworkOrganizationCredential({ ...domain, type: ['VerifiableCredential', 'OrganizationCredential'] }))
})
