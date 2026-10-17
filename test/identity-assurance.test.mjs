// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ClaimProofFormat,
  IdentityAttestationCapability,
  IdentityPredicateKind,
  OidcIdentityClaim,
  SchemaOrgIdentityClaim,
  defineClaimProofBinding,
  eudiPidAgeOverClaimName,
  importOidc4IdaToSchemaOrgFlatClaims,
  projectSchemaOrgFlatClaimsToOidc4Ida,
  verifiedClaimsJsonSchema,
} from '../dist/identity-assurance/index.js'

const verificationFixture = Object.freeze({
  trust_framework: 'urn:example:trust-framework',
  assurance_level: 'urn:example:assurance-level',
  time: '2026-10-17T10:00:00.000Z',
  evidence: Object.freeze([Object.freeze({
    type: 'electronic_record',
    record: Object.freeze({ type: 'authoritative-register' }),
  })]),
})

test('exports product-neutral identity attestation capabilities', () => {
  assert.deepEqual(IdentityAttestationCapability, {
    CreateSubject: 'identity.subject.create',
    UpdateSubject: 'identity.subject.update',
    RecordEvidence: 'identity.evidence.record',
    VerifyClaim: 'identity.claim.verify',
    AttestSubject: 'identity.subject.attest',
    AttestRelationship: 'identity.relationship.attest',
  })
})

test('projects governed Schema.org person claims to OIDC4IDA verified claims', () => {
  const projected = projectSchemaOrgFlatClaimsToOidc4Ida({
    claims: {
      [SchemaOrgIdentityClaim.PersonGivenName]: 'Alex',
      [SchemaOrgIdentityClaim.PersonFamilyName]: 'Morgan',
      [SchemaOrgIdentityClaim.PersonBirthDate]: '2000-01-01',
    },
    verification: verificationFixture,
  })

  assert.deepEqual(projected, {
    claims: {
      [OidcIdentityClaim.GivenName]: 'Alex',
      [OidcIdentityClaim.FamilyName]: 'Morgan',
      [OidcIdentityClaim.Birthdate]: '2000-01-01',
    },
    verification: verificationFixture,
  })
})

test('imports OIDC4IDA claims without silently overwriting existing flat claims', () => {
  const imported = importOidc4IdaToSchemaOrgFlatClaims({
    verifiedClaims: {
      claims: {
        [OidcIdentityClaim.Birthdate]: '2000-01-01',
        unsupported_claim: 'retained as a warning',
      },
      verification: verificationFixture,
    },
    existingClaims: {
      [SchemaOrgIdentityClaim.PersonBirthDate]: '2000-02-02',
    },
  })

  assert.deepEqual(imported.claims, {})
  assert.deepEqual(imported.conflicts, [{
    claim: SchemaOrgIdentityClaim.PersonBirthDate,
    existingValue: '2000-02-02',
    importedValue: '2000-01-01',
  }])
  assert.deepEqual(imported.unmappedClaims, ['unsupported_claim'])
  assert.equal(imported.verification, verificationFixture)
})

test('publishes a JSON Schema that requires claims and verification separately', () => {
  assert.deepEqual(verifiedClaimsJsonSchema.required, ['claims', 'verification'])
  assert.deepEqual(verifiedClaimsJsonSchema.properties.verification.required, ['evidence'])
})

test('binds one claim to multiple credential-level cryptographic proofs', () => {
  const binding = defineClaimProofBinding({
    target: {
      kind: 'claim',
      claimPath: SchemaOrgIdentityClaim.PersonBirthDate,
    },
    proofs: [
      {
        id: 'urn:proof:pid',
        format: ClaimProofFormat.IetfSdJwtVc,
        issuer: 'https://issuer.example',
        credentialReference: 'urn:credential:pid',
        cryptographicBinding: 'issuer-signature-with-disclosure-digests',
        status: 'active',
      },
      {
        id: 'urn:proof:record',
        format: ClaimProofFormat.OidcVerifiedClaims,
        issuer: 'https://register.example',
        credentialReference: 'urn:evidence:record',
        cryptographicBinding: 'external-verification-result',
        status: 'active',
      },
    ],
  })

  assert.equal(binding.proofs.length, 2)
  assert.equal(binding.target.claimPath, SchemaOrgIdentityClaim.PersonBirthDate)
})

test('models age-over as a derived predicate without disclosing birth date', () => {
  const binding = defineClaimProofBinding({
    target: {
      kind: 'predicate',
      predicate: IdentityPredicateKind.AgeOver,
      sourceClaimPath: SchemaOrgIdentityClaim.PersonBirthDate,
      threshold: 18,
      result: true,
    },
    proofs: [{
      id: 'urn:proof:age-over-18',
      format: ClaimProofFormat.IetfSdJwtVc,
      issuer: 'https://issuer.example',
      credentialReference: 'urn:credential:pid',
      disclosureDigest: 'sha-256:opaque-digest',
      cryptographicBinding: 'issuer-signature-with-disclosure-digests',
      status: 'active',
    }],
  })

  assert.equal(eudiPidAgeOverClaimName(binding.target.threshold), 'age_over_18')
  assert.equal('birthDate' in binding.target, false)
})

test('rejects a claim or predicate without at least one proof', () => {
  assert.throws(
    () => defineClaimProofBinding({
      target: {
        kind: 'claim',
        claimPath: SchemaOrgIdentityClaim.PersonBirthDate,
      },
      proofs: [],
    }),
    /at least one proof/,
  )
})
