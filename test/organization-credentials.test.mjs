// Flow contract: build the existing reviewed admission and three domain credential drafts from explicit email/phone parties and caller-governed roles; preserve email/proof payload bytes, keep phone out of email, and never treat draft construction or canonicalization as signature verification or host admission.
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildStableActorIdentifier } from '../dist/organization-identity.js'
import {
  buildOrganizationTestNetworkCredential,
  buildTestNetworkOrganizationCredentialSet,
  canonicalizeOrganizationTestNetworkCredential,
  canonicalizeTestNetworkOrganizationCredential,
} from '../dist/organization-credentials.js'

// Golden wire vectors captured from released gdc-common-utils-ts@2.9.30
// using only the synthetic fixtures below. Baseline npm tarball integrity:
// sha512-+ZJLEp/AfmCm4ZwJRU5wKTmWJPevlJ8Wa82EepyoGz0BE3sKBA2JjVbh4ML5+e+RIzstwoJnk4vWE4E44UhTqg==
// The published package exposes no source commit. Captured bytes are the oracle;
// no predecessor package is loaded at test time.
const reviewedWire = Object.freeze({
  "admission": "{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001\",\"type\":[\"VerifiableCredential\",\"OrganizationTestNetworkCredential\"],\"issuer\":\"did:web:example.invalid:host\",\"credentialSubject\":{\"id\":\"did:web:example.invalid:organization\",\"applicationId\":\"00000000-0000-4000-8000-000000000001\",\"accessPath\":\"test-network\",\"organization\":{\"legalName\":\"Example organization\",\"identifier\":\"EXAMPLE-ORG\"},\"controller\":{\"email\":\"controller@example.invalid\",\"hasCredential\":{\"material\":\"urn:jwk-thumbprint:sha-256:example\"}}},\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\"}",
  "domains": "[{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"issuer\":\"did:web:example.invalid:host\",\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\",\"evidence\":[{\"type\":\"DocumentVerification\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"documentVersion\":\"example-v1\",\"applicationId\":\"00000000-0000-4000-8000-000000000001\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:organization\",\"type\":[\"VerifiableCredential\",\"OrganizationCredential\",\"TestNetworkCredential\"],\"credentialSubject\":{\"id\":\"did:web:example.invalid:organization\",\"@type\":\"Organization\",\"legalName\":\"Example organization\",\"identifier\":{\"additionalType\":\"taxID\",\"value\":\"EXAMPLE-ORG\"},\"taxID\":\"EXAMPLE-ORG\",\"address\":{\"@type\":\"PostalAddress\",\"addressCountry\":\"CA\"},\"makesOffer\":{\"@type\":\"Offer\",\"category\":\"education-tech\"}}},{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"issuer\":\"did:web:example.invalid:host\",\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\",\"evidence\":[{\"type\":\"DocumentVerification\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"documentVersion\":\"example-v1\",\"applicationId\":\"00000000-0000-4000-8000-000000000001\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:legal-representative\",\"type\":[\"VerifiableCredential\",\"PersonCredential\",\"LegalRepresentativeCredential\",\"TestNetworkCredential\"],\"credentialSubject\":{\"id\":\"urn:multibase:zW1mHES95kTPVFXoZCRnuZK9J9XhR1b2eZCy3UsqkpQozgz\",\"@type\":\"Person\",\"name\":\"Example representative\",\"sameAs\":\"urn:multibase:zW1mHES95kTPVFXoZCRnuZK9J9XhR1b2eZCy3UsqkpQozgz\",\"hasOccupation\":{\"@type\":\"Occupation\",\"occupationalCategory\":\"ISCO-08|1120\"},\"memberOf\":{\"@type\":\"Organization\",\"legalName\":\"Example organization\",\"taxID\":\"EXAMPLE-ORG\"}}},{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"issuer\":\"did:web:example.invalid:host\",\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\",\"evidence\":[{\"type\":\"DocumentVerification\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"documentVersion\":\"example-v1\",\"applicationId\":\"00000000-0000-4000-8000-000000000001\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:service-controller\",\"type\":[\"VerifiableCredential\",\"ServiceCredential\",\"ServiceControllerCredential\",\"TestNetworkCredential\"],\"credentialSubject\":{\"id\":\"did:web:example.invalid:organization\",\"@type\":\"Service\",\"serviceType\":\"OrganizationControllerService\",\"provider\":{\"@type\":\"Organization\",\"legalName\":\"Example organization\",\"taxID\":\"EXAMPLE-ORG\"},\"owner\":{\"@type\":\"Person\",\"additionalType\":\"RESPRSN\",\"sameAs\":\"urn:multibase:zW1nnqssJhQ5d6rrncEKkCkkr3FTYHNN5TVYoiAMTm9HWBj\",\"hasOccupation\":{\"@type\":\"Occupation\",\"occupationalCategory\":\"ISCO-08|1330\"},\"hasCredential\":{\"material\":\"urn:jwk-thumbprint:sha-256:example\"}}}}]",
  "admissionCanonical": "{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"credentialSubject\":{\"accessPath\":\"test-network\",\"applicationId\":\"00000000-0000-4000-8000-000000000001\",\"controller\":{\"email\":\"controller@example.invalid\",\"hasCredential\":{\"material\":\"urn:jwk-thumbprint:sha-256:example\"}},\"id\":\"did:web:example.invalid:organization\",\"organization\":{\"identifier\":\"EXAMPLE-ORG\",\"legalName\":\"Example organization\"}},\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001\",\"issuer\":\"did:web:example.invalid:host\",\"type\":[\"VerifiableCredential\",\"OrganizationTestNetworkCredential\"],\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\"}",
  "domainCanonical": [
    "{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"credentialSubject\":{\"@type\":\"Organization\",\"address\":{\"@type\":\"PostalAddress\",\"addressCountry\":\"CA\"},\"id\":\"did:web:example.invalid:organization\",\"identifier\":{\"additionalType\":\"taxID\",\"value\":\"EXAMPLE-ORG\"},\"legalName\":\"Example organization\",\"makesOffer\":{\"@type\":\"Offer\",\"category\":\"education-tech\"},\"taxID\":\"EXAMPLE-ORG\"},\"evidence\":[{\"applicationId\":\"00000000-0000-4000-8000-000000000001\",\"documentVersion\":\"example-v1\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":\"DocumentVerification\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:organization\",\"issuer\":\"did:web:example.invalid:host\",\"type\":[\"VerifiableCredential\",\"OrganizationCredential\",\"TestNetworkCredential\"],\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\"}",
    "{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"credentialSubject\":{\"@type\":\"Person\",\"hasOccupation\":{\"@type\":\"Occupation\",\"occupationalCategory\":\"ISCO-08|1120\"},\"id\":\"urn:multibase:zW1mHES95kTPVFXoZCRnuZK9J9XhR1b2eZCy3UsqkpQozgz\",\"memberOf\":{\"@type\":\"Organization\",\"legalName\":\"Example organization\",\"taxID\":\"EXAMPLE-ORG\"},\"name\":\"Example representative\",\"sameAs\":\"urn:multibase:zW1mHES95kTPVFXoZCRnuZK9J9XhR1b2eZCy3UsqkpQozgz\"},\"evidence\":[{\"applicationId\":\"00000000-0000-4000-8000-000000000001\",\"documentVersion\":\"example-v1\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":\"DocumentVerification\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:legal-representative\",\"issuer\":\"did:web:example.invalid:host\",\"type\":[\"VerifiableCredential\",\"PersonCredential\",\"LegalRepresentativeCredential\",\"TestNetworkCredential\"],\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\"}",
    "{\"@context\":[\"https://www.w3.org/ns/credentials/v2\",\"https://schema.org\"],\"credentialSubject\":{\"@type\":\"Service\",\"id\":\"did:web:example.invalid:organization\",\"owner\":{\"@type\":\"Person\",\"additionalType\":\"RESPRSN\",\"hasCredential\":{\"material\":\"urn:jwk-thumbprint:sha-256:example\"},\"hasOccupation\":{\"@type\":\"Occupation\",\"occupationalCategory\":\"ISCO-08|1330\"},\"sameAs\":\"urn:multibase:zW1nnqssJhQ5d6rrncEKkCkkr3FTYHNN5TVYoiAMTm9HWBj\"},\"provider\":{\"@type\":\"Organization\",\"legalName\":\"Example organization\",\"taxID\":\"EXAMPLE-ORG\"},\"serviceType\":\"OrganizationControllerService\"},\"evidence\":[{\"applicationId\":\"00000000-0000-4000-8000-000000000001\",\"documentVersion\":\"example-v1\",\"id\":\"urn:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"type\":\"DocumentVerification\"}],\"id\":\"urn:uuid:00000000-0000-4000-8000-000000000001:service-controller\",\"issuer\":\"did:web:example.invalid:host\",\"type\":[\"VerifiableCredential\",\"ServiceCredential\",\"ServiceControllerCredential\",\"TestNetworkCredential\"],\"validFrom\":\"2026-11-08T00:00:00.000Z\",\"validUntil\":\"2026-11-09T00:00:00.000Z\"}"
  ]
})

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
  assert.equal(JSON.stringify(buildOrganizationTestNetworkCredential(base)), JSON.stringify(JSON.parse(reviewedWire.admission)))
})

test('preserves the exact published three domain credential JSONs for caller-supplied legacy roles', () => {
  assert.equal(JSON.stringify(buildTestNetworkOrganizationCredentialSet(base)), JSON.stringify(JSON.parse(reviewedWire.domains)))
})

test('preserves proof-free canonicalization bytes and does not count a proof as verified', () => {
  const admission = { ...JSON.parse(reviewedWire.admission), proof: { jws: 'unverified-example' } }
  assert.equal(canonicalizeOrganizationTestNetworkCredential(admission), reviewedWire.admissionCanonical)
  const domains = JSON.parse(reviewedWire.domains)
  for (const [index, credential] of domains.entries()) {
    const candidate = { ...credential, proof: [{ jws: 'unverified-example' }], evidence: [{ ...credential.evidence[0], proof: { test: true } }] }
    assert.equal(canonicalizeTestNetworkOrganizationCredential(candidate), reviewedWire.domainCanonical[index])
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
  assert.throws(() => canonicalizeOrganizationTestNetworkCredential({ ...JSON.parse(reviewedWire.admission), type: ['VerifiableCredential'] }))
  const domain = JSON.parse(reviewedWire.domains)[0]
  assert.throws(() => canonicalizeTestNetworkOrganizationCredential({ ...domain, type: ['VerifiableCredential', 'OrganizationCredential'] }))
})
