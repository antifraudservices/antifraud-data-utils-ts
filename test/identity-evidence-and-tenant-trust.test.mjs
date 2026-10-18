// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// Journey: (1) a controller governs one reusable group authorization; (2) an active group member records evidence;
// (3) the home tenant is the initial trust root; (4) an external source is selected only through explicit federation trust.
// Invariants: browser fields never choose the actor or authorization, raw evidence is not embedded, and source issuance remains separate.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ClearingHouseTenantCapability,
  EudiPidClaim,
  IdentityAttestationCapability,
  IdentityEvidenceCheckClaim,
  IdentityEvidenceType,
  IdentityPredicateKind,
  OidcIdentityClaim,
  SchemaOrgIdentityClaim,
  IdentityEvidenceTargetClaim,
  SchemaOrgMediaObjectClaim,
  defineAuthorizedWorkforceIdentityEvidenceStatement,
  eudiPidAgeOverClaimName,
  selectAuthoritativeTenantEndpoint,
  projectEvidenceAttachmentToSchemaOrgMediaObject,
  toSchemaOrgEvidenceMediaFlatClaims,
  toIdentityEvidenceTargetFlatClaims,
  workforceIdentityEvidenceStatementJsonSchema,
} from '../dist/identity-assurance/index.js'

const homeTenant = Object.freeze({
  tenantReference: 'did:web:home.example',
  endpoint: 'https://home.example/identity/clearing-house',
  capabilities: Object.freeze([
    ClearingHouseTenantCapability.Employer,
    ClearingHouseTenantCapability.IndexProvider,
  ]),
})

const workforceContext = Object.freeze({
  actorReference: 'urn:actor:authorized-workforce-member',
  assignmentReference: 'urn:assignment:authorized-workforce-member',
  organizationReference: homeTenant.tenantReference,
  groupMembership: Object.freeze({
    groupReference: 'urn:group:controller-created-work-area',
    status: 'active',
  }),
  groupAuthorization: Object.freeze({
    authorizationReference: 'urn:authorization:group-subject-maintenance',
    groupReference: 'urn:group:controller-created-work-area',
    controllerReference: 'urn:controller:organization-controller',
    status: 'active',
    capabilities: Object.freeze([
      IdentityAttestationCapability.RecordEvidence,
      IdentityAttestationCapability.CreateSubject,
      IdentityAttestationCapability.UpdateSubject,
    ]),
  }),
  subjectAuthorizationReference: 'urn:authorization:subject-if-required',
})

const evidenceStatementRequest = Object.freeze({
  operationId: 'urn:operation:identity-evidence-1',
  subjectReference: 'urn:subject:opaque',
  targets: Object.freeze([{kind: 'subject'}]),
  evidence: Object.freeze([{
    id: 'urn:evidence:vouch-1',
    type: IdentityEvidenceType.Vouch,
    observedAt: '2026-10-17T12:00:00.000Z',
    checks: Object.freeze([{
      checkMethod: 'in-person-professional-review',
      checkId: 'urn:check:opaque',
    }]),
  }]),
})

test('keeps EUDI PID data elements distinct from OpenID Identity Assurance claims', () => {
  assert.equal(EudiPidClaim.BirthDate, 'birth_date')
  assert.equal(EudiPidClaim.AgeOver18, 'age_over_18')
  assert.equal(OidcIdentityClaim.Birthdate, 'birthdate')
  assert.notEqual(EudiPidClaim.BirthDate, OidcIdentityClaim.Birthdate)
  assert.equal(eudiPidAgeOverClaimName(18), EudiPidClaim.AgeOver18)
  assert.throws(() => eudiPidAgeOverClaimName(21), /only standardizes age_over_18/i)
})

test('publishes a form-ready schema for governed workforce evidence statements', () => {
  assert.deepEqual(workforceIdentityEvidenceStatementJsonSchema.required, [
    'operationId',
    'subjectReference',
    'capability',
    'createdBy',
    'authorization',
    'targets',
    'evidence',
  ])
  assert.equal(
    workforceIdentityEvidenceStatementJsonSchema.properties.evidence.items.additionalProperties,
    false,
  )
  assert.equal(
    'document' in workforceIdentityEvidenceStatementJsonSchema.properties.evidence.items.properties,
    false,
  )
})

test('models student, lawful-representative relationship and configurable age evidence without product types', () => {
  const statement = defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: workforceContext,
    request: {
      ...evidenceStatementRequest,
      subjectReference: 'urn:subject:student-opaque',
      targets: [
        {kind: 'subject'},
        {
          kind: 'relationship',
          relationshipType: 'lawful-representative',
          relatedSubjectReference: 'urn:subject:representative-opaque',
        },
        {
          kind: 'predicate',
          predicate: IdentityPredicateKind.AgeOver,
          sourceSubjectReference: 'urn:subject:student-opaque',
          sourceClaimPath: SchemaOrgIdentityClaim.PersonBirthDate,
          threshold: 21,
          result: true,
        },
      ],
    },
  })

  assert.equal(statement.subjectReference, 'urn:subject:student-opaque')
  assert.deepEqual(statement.targets[1], {
    kind: 'relationship',
    relationshipType: 'lawful-representative',
    relatedSubjectReference: 'urn:subject:representative-opaque',
  })
  assert.deepEqual(statement.targets[2], {
    kind: 'predicate',
    predicate: IdentityPredicateKind.AgeOver,
    sourceSubjectReference: 'urn:subject:student-opaque',
    sourceClaimPath: SchemaOrgIdentityClaim.PersonBirthDate,
    threshold: 21,
    result: true,
  })
  assert.equal(
    workforceIdentityEvidenceStatementJsonSchema.properties.targets.items.properties.threshold.maximum,
    150,
  )
})

test('accepts governed age-over thresholds while reserving the EUDI PID name for 18', () => {
  for (const threshold of [18, 19, 21, 65]) {
    assert.doesNotThrow(() => defineAuthorizedWorkforceIdentityEvidenceStatement({
      context: workforceContext,
      request: {
        ...evidenceStatementRequest,
        targets: [{
          kind: 'predicate',
          predicate: IdentityPredicateKind.AgeOver,
          sourceSubjectReference: 'urn:subject:person-opaque',
          sourceClaimPath: SchemaOrgIdentityClaim.PersonBirthDate,
          threshold,
          result: true,
        }],
      },
    }))
  }

  assert.equal(eudiPidAgeOverClaimName(18), EudiPidClaim.AgeOver18)
  assert.throws(() => eudiPidAgeOverClaimName(19), /only standardizes age_over_18/i)
  assert.throws(() => eudiPidAgeOverClaimName(21), /only standardizes age_over_18/i)
})

test('projects animal, owner relationship and age-over targets to neutral flat claims', () => {
  assert.equal(IdentityEvidenceCheckClaim.Reference, 'identity.evidence.checkReference')

  assert.deepEqual(toIdentityEvidenceTargetFlatClaims({
    subjectReference: 'did:web:person.example:owner',
    target: {
      kind: 'predicate',
      predicate: IdentityPredicateKind.AgeOver,
      sourceSubjectReference: 'did:web:person.example:owner',
      sourceClaimPath: SchemaOrgIdentityClaim.PersonBirthDate,
      threshold: 21,
      result: true,
    },
  }), {
    [IdentityEvidenceTargetClaim.SubjectReference]: 'did:web:person.example:owner',
    [IdentityEvidenceTargetClaim.Kind]: 'predicate',
    [IdentityEvidenceTargetClaim.Predicate]: 'age-over',
    [IdentityEvidenceTargetClaim.SourceSubjectReference]: 'did:web:person.example:owner',
    [IdentityEvidenceTargetClaim.SourceClaimPath]: 'org.schema.Person.birthDate',
    [IdentityEvidenceTargetClaim.Threshold]: '21',
    [IdentityEvidenceTargetClaim.Result]: 'true',
  })

  assert.deepEqual(toIdentityEvidenceTargetFlatClaims({
    subjectReference: 'did:web:animal.example:card',
    target: {
      kind: 'relationship',
      relationshipType: 'owner',
      relatedSubjectReference: 'did:web:person.example:owner',
    },
  }), {
    [IdentityEvidenceTargetClaim.SubjectReference]: 'did:web:animal.example:card',
    [IdentityEvidenceTargetClaim.Kind]: 'relationship',
    [IdentityEvidenceTargetClaim.RelationshipType]: 'owner',
    [IdentityEvidenceTargetClaim.RelatedSubjectReference]: 'did:web:person.example:owner',
  })
})

test('builds workforce identity evidence from controller-governed context instead of caller identity fields', () => {
  const statement = defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: workforceContext,
    request: evidenceStatementRequest,
  })

  assert.equal(statement.createdBy.actorReference, workforceContext.actorReference)
  assert.equal(statement.createdBy.assignmentReference, workforceContext.assignmentReference)
  assert.equal(statement.createdBy.organizationReference, workforceContext.organizationReference)
  assert.equal(statement.authorization.groupReference, workforceContext.groupMembership.groupReference)
  assert.equal(statement.authorization.groupAuthorizationReference, workforceContext.groupAuthorization.authorizationReference)
  assert.equal(statement.authorization.subjectAuthorizationReference, workforceContext.subjectAuthorizationReference)
  assert.equal('employeeConsentReference' in statement.authorization, false)
  assert.equal(statement.capability, IdentityAttestationCapability.RecordEvidence)
  assert.equal(statement.evidence[0].type, IdentityEvidenceType.Vouch)
  assert.equal(JSON.stringify(statement).includes('occupation'), false)
})

test('rejects workforce evidence creation without active membership or reusable group authorization', () => {
  assert.throws(
    () => defineAuthorizedWorkforceIdentityEvidenceStatement({
      context: {
        ...workforceContext,
        groupAuthorization: {...workforceContext.groupAuthorization, capabilities: []},
      },
      request: evidenceStatementRequest,
    }),
    /identity\.evidence\.record/,
  )
  assert.throws(
    () => defineAuthorizedWorkforceIdentityEvidenceStatement({
      context: {
        ...workforceContext,
        groupMembership: {...workforceContext.groupMembership, status: 'inactive'},
      },
      request: evidenceStatementRequest,
    }),
    /active group membership/i,
  )
  assert.throws(
    () => defineAuthorizedWorkforceIdentityEvidenceStatement({
      context: {
        ...workforceContext,
        groupAuthorization: {...workforceContext.groupAuthorization, groupReference: 'urn:group:different'},
      },
      request: evidenceStatementRequest,
    }),
    /same professional group/i,
  )
})

test('reuses one group authorization for different active employee memberships', () => {
  const first = defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: workforceContext,
    request: evidenceStatementRequest,
  })
  const second = defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: {
      ...workforceContext,
      actorReference: 'urn:actor:second-workforce-member',
      assignmentReference: 'urn:assignment:second-workforce-member',
    },
    request: {...evidenceStatementRequest, operationId: 'urn:operation:identity-evidence-2'},
  })

  assert.notEqual(first.createdBy.assignmentReference, second.createdBy.assignmentReference)
  assert.equal(first.authorization.groupAuthorizationReference, second.authorization.groupAuthorizationReference)
})

test('rejects embedded identity documents while retaining digest-bound attachment references', () => {
  assert.throws(
    () => defineAuthorizedWorkforceIdentityEvidenceStatement({
      context: workforceContext,
      request: {
        ...evidenceStatementRequest,
        evidence: [{
          ...evidenceStatementRequest.evidence[0],
          document: {base64: 'raw-personal-document'},
        }],
      },
    }),
    /raw evidence documents are not accepted/i,
  )

  const statement = defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: workforceContext,
    request: {
      ...evidenceStatementRequest,
      evidence: [{
        ...evidenceStatementRequest.evidence[0],
        attachments: [{
          id: 'urn:attachment:opaque',
          mediaType: 'application/pdf',
          digestAlgorithm: 'sha3-384',
          digest: 'mJ+lnlA8LeEHHgH2qJjjCt1TmFJWDRmtelW8l7lXsSswcDcGahIuhvPVoXAvQ/PA',
          contentId: 'zKYrhS8ZkySGc9pjHe8KE4bo1RjKKbjaxatf3zM16DD2hLGPvK3bqbSGvpNYA2qafoUeBYT',
        }],
      }],
    },
  })

  assert.equal(statement.evidence[0].attachments[0].digestAlgorithm, 'sha3-384')
  assert.match(statement.evidence[0].attachments[0].contentId, /^z/)

  assert.throws(() => defineAuthorizedWorkforceIdentityEvidenceStatement({
    context: workforceContext,
    request: {
      ...evidenceStatementRequest,
      evidence: [{
        ...evidenceStatementRequest.evidence[0],
        attachments: [{
          id: 'urn:attachment:opaque',
          mediaType: 'image/tiff',
          digestAlgorithm: 'sha3-384',
          digest: 'opaque-digest',
          contentId: 'z123',
        }],
      }],
    },
  }), /CIDv1 raw with a SHA3-384 multihash/i)
})

test('uses Schema.org MediaObject as the canonical scanned-evidence representation', () => {
  const attachment = {
    id: 'urn:attachment:opaque',
    mediaType: 'application/pdf',
    contentSize: 2048,
    contentUrl: 'https://evidence.example/objects/opaque',
    digestAlgorithm: 'sha3-384',
    digest: 'mJ+lnlA8LeEHHgH2qJjjCt1TmFJWDRmtelW8l7lXsSswcDcGahIuhvPVoXAvQ/PA',
    contentId: 'zKYrhS8ZkySGc9pjHe8KE4bo1RjKKbjaxatf3zM16DD2hLGPvK3bqbSGvpNYA2qafoUeBYT',
  }

  assert.deepEqual(projectEvidenceAttachmentToSchemaOrgMediaObject(attachment), {
    '@context': 'https://schema.org',
    '@type': 'MediaObject',
    '@id': attachment.id,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'cidv1-raw-sha3-384',
      value: attachment.contentId,
    },
    contentUrl: attachment.contentUrl,
    encodingFormat: attachment.mediaType,
    contentSize: String(attachment.contentSize),
  })

  assert.deepEqual(toSchemaOrgEvidenceMediaFlatClaims(attachment), {
    [SchemaOrgMediaObjectClaim.Id]: attachment.id,
    [SchemaOrgMediaObjectClaim.IdentifierPropertyId]: 'cidv1-raw-sha3-384',
    [SchemaOrgMediaObjectClaim.IdentifierValue]: attachment.contentId,
    [SchemaOrgMediaObjectClaim.ContentUrl]: attachment.contentUrl,
    [SchemaOrgMediaObjectClaim.EncodingFormat]: attachment.mediaType,
    [SchemaOrgMediaObjectClaim.ContentSize]: String(attachment.contentSize),
  })
})

test('trusts the home tenant endpoint without silently trusting another tenant', () => {
  const selected = selectAuthoritativeTenantEndpoint({
    homeTenantReference: homeTenant.tenantReference,
    sourceTenant: homeTenant,
    requiredCapability: ClearingHouseTenantCapability.Employer,
    trustedFederatedTenantReferences: [],
  })

  assert.deepEqual(selected, {
    trust: 'home-tenant',
    tenantReference: homeTenant.tenantReference,
    endpoint: homeTenant.endpoint,
  })

  assert.throws(
    () => selectAuthoritativeTenantEndpoint({
      homeTenantReference: homeTenant.tenantReference,
      sourceTenant: {
        ...homeTenant,
        tenantReference: 'did:web:external.example',
        endpoint: 'https://external.example/identity/clearing-house',
      },
      requiredCapability: ClearingHouseTenantCapability.IndexProvider,
      trustedFederatedTenantReferences: [],
    }),
    /not trusted by the home tenant/i,
  )
})

test('allows an external authoritative tenant only after explicit federation trust', () => {
  const externalTenantReference = 'did:web:external.example'
  const selected = selectAuthoritativeTenantEndpoint({
    homeTenantReference: homeTenant.tenantReference,
    sourceTenant: {
      ...homeTenant,
      tenantReference: externalTenantReference,
      endpoint: 'https://external.example/identity/clearing-house',
    },
    requiredCapability: ClearingHouseTenantCapability.IndexProvider,
    trustedFederatedTenantReferences: [externalTenantReference],
  })

  assert.equal(selected.trust, 'federated-tenant')
  assert.equal(selected.tenantReference, externalTenantReference)
})
