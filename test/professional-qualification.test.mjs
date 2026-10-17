// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  QualificationAuthorityKind,
  QualificationLifecycleStatus,
  QualificationType,
  QualificationVerificationStatus,
  SchemaOrgQualificationClaim,
  buildQualificationLedgerAnchor,
  defineProfessionalQualification,
  deriveQualificationTrustBadges,
  projectProfessionalQualificationToSchemaOrg,
  toSchemaOrgQualificationFlatClaims,
} from '../dist/identity-assurance/index.js'

const qualificationFixture = Object.freeze({
  id: 'urn:qualification:opaque',
  subjectReference: 'Practitioner/practitioner-opaque',
  type: QualificationType.Licence,
  identifier: Object.freeze({
    system: 'https://registry.example/qualifications',
    value: 'qualification-opaque',
  }),
  code: Object.freeze({
    system: 'https://terminology.example/qualifications',
    code: 'registered-professional',
    display: 'Registered professional',
  }),
  issuer: Object.freeze({
    organizationReference: 'Organization/university-opaque',
    legalIdentifier: 'legal-id-opaque',
    jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
  }),
  period: Object.freeze({
    start: '2025-01-01',
    end: '2027-01-01',
  }),
  lifecycleStatus: QualificationLifecycleStatus.Active,
  proofs: Object.freeze([
    Object.freeze({
      id: 'urn:proof:employer-opaque',
      authorityKind: QualificationAuthorityKind.Employer,
      organizationReference: 'Organization/employer-opaque',
      legalIdentifier: 'employer-legal-id-opaque',
      jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
      verificationStatus: QualificationVerificationStatus.Attested,
      verifiedAt: '2026-10-17T10:00:00.000Z',
      proofReference: 'urn:credential:employer-attestation-opaque',
    }),
    Object.freeze({
      id: 'urn:proof:issuer-opaque',
      authorityKind: QualificationAuthorityKind.QualificationIssuer,
      organizationReference: 'Organization/university-opaque',
      legalIdentifier: 'legal-id-opaque',
      jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
      verificationStatus: QualificationVerificationStatus.Verified,
      verifiedAt: '2026-10-18T10:00:00.000Z',
      proofReference: 'urn:credential:issuer-opaque',
    }),
    Object.freeze({
      id: 'urn:proof:regulator-opaque',
      authorityKind: QualificationAuthorityKind.ProfessionalBody,
      organizationReference: 'Organization/regulator-opaque',
      legalIdentifier: 'regulator-legal-id-opaque',
      jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
      verificationStatus: QualificationVerificationStatus.Verified,
      verifiedAt: '2026-10-19T10:00:00.000Z',
      proofReference: 'urn:credential:regulator-opaque',
    }),
  ]),
})

test('keeps employer, qualification issuer and professional body proofs distinct', () => {
  const qualification = defineProfessionalQualification(qualificationFixture)

  assert.deepEqual(deriveQualificationTrustBadges(qualification), [
    { kind: 'employer-attested', status: 'current', proofId: 'urn:proof:employer-opaque' },
    { kind: 'issuer-verified', status: 'current', proofId: 'urn:proof:issuer-opaque' },
    { kind: 'professional-body-verified', status: 'current', proofId: 'urn:proof:regulator-opaque' },
    { kind: 'licence-active', status: 'current' },
  ])
})

test('rejects a qualification issuer proof that does not match legal identifier and jurisdiction', () => {
  assert.throws(
    () => defineProfessionalQualification({
      ...qualificationFixture,
      proofs: [{
        ...qualificationFixture.proofs[1],
        legalIdentifier: 'different-legal-id',
      }],
    }),
    /qualification issuer proof must match/i,
  )
})

test('uses Schema.org flat claims for forms, indexes and credential exchange', () => {
  const claims = toSchemaOrgQualificationFlatClaims(
    defineProfessionalQualification(qualificationFixture),
  )

  assert.equal(claims[SchemaOrgQualificationClaim.Id], 'urn:qualification:opaque')
  assert.equal(
    claims[SchemaOrgQualificationClaim.IdentifierPropertyId],
    'https://registry.example/qualifications',
  )
  assert.equal(
    claims[SchemaOrgQualificationClaim.IdentifierValue],
    'qualification-opaque',
  )
  assert.equal(claims[SchemaOrgQualificationClaim.CredentialCategory], 'licence')
  assert.equal(claims[SchemaOrgQualificationClaim.PublisherIdentifierValue], 'legal-id-opaque')
  assert.equal(
    claims[SchemaOrgQualificationClaim.ValidInIdentifier],
    'urn:iso:std:iso:3166:-2:XX-TEST',
  )
})

test('projects the credential and its recognizers to Schema.org', () => {
  const projection = projectProfessionalQualificationToSchemaOrg(
    defineProfessionalQualification(qualificationFixture),
  )

  assert.equal(projection['@type'], 'Person')
  assert.equal(projection.hasCredential['@type'], 'EducationalOccupationalCredential')
  assert.equal(projection.hasCredential.credentialCategory, 'licence')
  assert.equal(projection.hasCredential.publisher.identifier.value, 'legal-id-opaque')
  assert.equal(projection.hasCredential.validIn.identifier, 'urn:iso:std:iso:3166:-2:XX-TEST')
  assert.equal(projection.hasCredential.recognizedBy.length, 2)
})

test('builds a privacy-minimized qualification ledger anchor', () => {
  const anchor = buildQualificationLedgerAnchor({
    evidenceId: 'urn:evidence:opaque',
    subjectLink: 'urn:sha3-384:subject-opaque',
    issuerLink: 'urn:sha3-384:issuer-opaque',
    verifierLinks: ['urn:sha3-384:verifier-opaque'],
    contentHash: 'urn:sha3-384:content-opaque',
    lifecycleStatus: QualificationLifecycleStatus.Active,
    jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
    recordedAt: '2026-10-19T10:00:00.000Z',
  })

  assert.deepEqual(anchor, {
    assetType: 'qualification-evidence',
    evidenceId: 'urn:evidence:opaque',
    subjectLink: 'urn:sha3-384:subject-opaque',
    issuerLink: 'urn:sha3-384:issuer-opaque',
    verifierLinks: ['urn:sha3-384:verifier-opaque'],
    contentHash: 'urn:sha3-384:content-opaque',
    lifecycleStatus: 'active',
    jurisdiction: 'urn:iso:std:iso:3166:-2:XX-TEST',
    recordedAt: '2026-10-19T10:00:00.000Z',
  })
  assert.equal(JSON.stringify(anchor).includes('Practitioner/'), false)
  assert.equal(JSON.stringify(anchor).includes('qualification-opaque'), false)
  assert.equal(JSON.stringify(anchor).includes('legal-id-opaque'), false)
})
