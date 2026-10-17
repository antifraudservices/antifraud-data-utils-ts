export const QualificationType = Object.freeze({
  Degree: 'degree',
  Certificate: 'certificate',
  Licence: 'licence',
  Accreditation: 'accreditation',
  Training: 'training',
} as const)

export type QualificationTypeValue =
  typeof QualificationType[keyof typeof QualificationType]

export const QualificationAuthorityKind = Object.freeze({
  Employer: 'employer',
  QualificationIssuer: 'qualification-issuer',
  ProfessionalBody: 'professional-body',
} as const)

export type QualificationAuthorityKindValue =
  typeof QualificationAuthorityKind[keyof typeof QualificationAuthorityKind]

/** Product-neutral result of checking one authoritative proof. */
export const QualificationVerificationStatus = Object.freeze({
  Attested: 'attested',
  Verified: 'verified',
  InProcess: 'in-process',
  RequiresReverification: 'requires-reverification',
  VerificationFailed: 'verification-failed',
  ReverificationFailed: 'reverification-failed',
  EnteredInError: 'entered-in-error',
} as const)

export type QualificationVerificationStatusValue =
  typeof QualificationVerificationStatus[keyof typeof QualificationVerificationStatus]

export const QualificationLifecycleStatus = Object.freeze({
  Active: 'active',
  Suspended: 'suspended',
  Revoked: 'revoked',
  Expired: 'expired',
  Unknown: 'unknown',
} as const)

export type QualificationLifecycleStatusValue =
  typeof QualificationLifecycleStatus[keyof typeof QualificationLifecycleStatus]

export type QualificationOrganizationReference = Readonly<{
  organizationReference: string
  legalIdentifier: string
  jurisdiction: string
}>

export type QualificationProof = Readonly<{
  id: string
  authorityKind: QualificationAuthorityKindValue
  organizationReference: string
  legalIdentifier: string
  jurisdiction: string
  verificationStatus: QualificationVerificationStatusValue
  verifiedAt: string
  proofReference: string
}>

export type ProfessionalQualification = Readonly<{
  id: string
  subjectReference: string
  type: QualificationTypeValue
  identifier: Readonly<{
    system?: string
    value: string
  }>
  code: Readonly<{
    system: string
    code: string
    display?: string
  }>
  issuer: QualificationOrganizationReference
  period?: Readonly<{
    start?: string
    end?: string
  }>
  lifecycleStatus: QualificationLifecycleStatusValue
  proofs: readonly QualificationProof[]
}>

export type QualificationTrustBadge = Readonly<{
  kind:
    | 'employer-attested'
    | 'issuer-verified'
    | 'professional-body-verified'
    | 'licence-active'
    | 'licence-suspended'
    | 'licence-revoked'
    | 'licence-expired'
    | 'licence-status-unknown'
  status: 'current' | 'attention'
  proofId?: string
}>

function requireNonEmpty(value: string, path: string): void {
  if (value.trim().length === 0) {
    throw new TypeError(`${path} must not be empty`)
  }
}

function assertKnownValue<T extends string>(
  value: string,
  values: Readonly<Record<string, T>>,
  path: string,
): asserts value is T {
  if (!(Object.values(values) as string[]).includes(value)) {
    throw new TypeError(`Unsupported ${path}: ${value}`)
  }
}

function freezeProof(proof: QualificationProof): QualificationProof {
  requireNonEmpty(proof.id, 'proof.id')
  requireNonEmpty(proof.organizationReference, 'proof.organizationReference')
  requireNonEmpty(proof.legalIdentifier, 'proof.legalIdentifier')
  requireNonEmpty(proof.jurisdiction, 'proof.jurisdiction')
  requireNonEmpty(proof.verifiedAt, 'proof.verifiedAt')
  requireNonEmpty(proof.proofReference, 'proof.proofReference')
  assertKnownValue(proof.authorityKind, QualificationAuthorityKind, 'proof.authorityKind')
  assertKnownValue(
    proof.verificationStatus,
    QualificationVerificationStatus,
    'proof.verificationStatus',
  )
  return Object.freeze({ ...proof })
}

/**
 * Defines the claims-first qualification and its independent verification
 * proofs. Native FHIR and Schema.org objects are generated only by explicit
 * projection functions below.
 */
export function defineProfessionalQualification(
  input: ProfessionalQualification,
): ProfessionalQualification {
  requireNonEmpty(input.id, 'id')
  requireNonEmpty(input.subjectReference, 'subjectReference')
  requireNonEmpty(input.identifier.value, 'identifier.value')
  requireNonEmpty(input.code.system, 'code.system')
  requireNonEmpty(input.code.code, 'code.code')
  requireNonEmpty(input.issuer.organizationReference, 'issuer.organizationReference')
  requireNonEmpty(input.issuer.legalIdentifier, 'issuer.legalIdentifier')
  requireNonEmpty(input.issuer.jurisdiction, 'issuer.jurisdiction')
  assertKnownValue(input.type, QualificationType, 'qualification type')
  assertKnownValue(
    input.lifecycleStatus,
    QualificationLifecycleStatus,
    'qualification lifecycle status',
  )
  if (!Array.isArray(input.proofs) || input.proofs.length === 0) {
    throw new TypeError('A professional qualification requires at least one proof')
  }

  const proofs = input.proofs.map(freezeProof)
  for (const proof of proofs) {
    if (
      proof.authorityKind === QualificationAuthorityKind.QualificationIssuer
      && (
        proof.organizationReference !== input.issuer.organizationReference
        || proof.legalIdentifier !== input.issuer.legalIdentifier
        || proof.jurisdiction !== input.issuer.jurisdiction
      )
    ) {
      throw new TypeError(
        'Qualification issuer proof must match issuer organization, legal identifier and jurisdiction',
      )
    }
  }

  return Object.freeze({
    ...input,
    identifier: Object.freeze({ ...input.identifier }),
    code: Object.freeze({ ...input.code }),
    issuer: Object.freeze({ ...input.issuer }),
    ...(input.period ? { period: Object.freeze({ ...input.period }) } : {}),
    proofs: Object.freeze(proofs),
  })
}

function badgeStatus(status: QualificationVerificationStatusValue): 'current' | 'attention' {
  return status === QualificationVerificationStatus.Attested
    || status === QualificationVerificationStatus.Verified
    ? 'current'
    : 'attention'
}

export function deriveQualificationTrustBadges(
  qualification: ProfessionalQualification,
): readonly QualificationTrustBadge[] {
  const badges: QualificationTrustBadge[] = qualification.proofs.map((proof) => {
    const kind = proof.authorityKind === QualificationAuthorityKind.Employer
      ? 'employer-attested'
      : proof.authorityKind === QualificationAuthorityKind.QualificationIssuer
        ? 'issuer-verified'
        : 'professional-body-verified'
    return Object.freeze({
      kind,
      status: badgeStatus(proof.verificationStatus),
      proofId: proof.id,
    })
  })

  if (qualification.type === QualificationType.Licence) {
    const lifecycleKind = qualification.lifecycleStatus === QualificationLifecycleStatus.Active
      ? 'licence-active'
      : qualification.lifecycleStatus === QualificationLifecycleStatus.Suspended
        ? 'licence-suspended'
        : qualification.lifecycleStatus === QualificationLifecycleStatus.Revoked
          ? 'licence-revoked'
          : qualification.lifecycleStatus === QualificationLifecycleStatus.Expired
            ? 'licence-expired'
            : 'licence-status-unknown'
    badges.push(Object.freeze({
      kind: lifecycleKind,
      status: qualification.lifecycleStatus === QualificationLifecycleStatus.Active
        ? 'current'
        : 'attention',
    }))
  }

  return Object.freeze(badges)
}

/** Schema.org flat-claim names shared by forms, indexes and credential exchange. */
export const SchemaOrgQualificationClaim = Object.freeze({
  Id: 'org.schema.EducationalOccupationalCredential.id',
  IdentifierPropertyId: 'org.schema.EducationalOccupationalCredential.identifier.propertyID',
  IdentifierValue: 'org.schema.EducationalOccupationalCredential.identifier.value',
  Name: 'org.schema.EducationalOccupationalCredential.name',
  CredentialCategory: 'org.schema.EducationalOccupationalCredential.credentialCategory',
  PublisherIdentifierValue:
    'org.schema.EducationalOccupationalCredential.publisher.identifier.value',
  ValidInIdentifier: 'org.schema.EducationalOccupationalCredential.validIn.identifier',
  ValidFrom: 'org.schema.EducationalOccupationalCredential.validFrom',
  Expires: 'org.schema.EducationalOccupationalCredential.expires',
} as const)

export function toSchemaOrgQualificationFlatClaims(
  qualification: ProfessionalQualification,
): Readonly<Record<string, string>> {
  return Object.freeze({
    [SchemaOrgQualificationClaim.Id]: qualification.id,
    ...(qualification.identifier.system
      ? { [SchemaOrgQualificationClaim.IdentifierPropertyId]: qualification.identifier.system }
      : {}),
    [SchemaOrgQualificationClaim.IdentifierValue]: qualification.identifier.value,
    ...(qualification.code.display
      ? { [SchemaOrgQualificationClaim.Name]: qualification.code.display }
      : {}),
    [SchemaOrgQualificationClaim.CredentialCategory]: qualification.type,
    [SchemaOrgQualificationClaim.PublisherIdentifierValue]:
      qualification.issuer.legalIdentifier,
    [SchemaOrgQualificationClaim.ValidInIdentifier]: qualification.issuer.jurisdiction,
    ...(qualification.period?.start
      ? { [SchemaOrgQualificationClaim.ValidFrom]: qualification.period.start }
      : {}),
    ...(qualification.period?.end
      ? { [SchemaOrgQualificationClaim.Expires]: qualification.period.end }
      : {}),
  })
}

function schemaOrganization(input: QualificationOrganizationReference | QualificationProof) {
  return {
    '@type': 'Organization',
    '@id': input.organizationReference,
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'legal-identifier',
      value: input.legalIdentifier,
    },
  }
}

export function projectProfessionalQualificationToSchemaOrg(
  qualification: ProfessionalQualification,
) {
  const recognizers = qualification.proofs
    .filter((proof) =>
      proof.authorityKind !== QualificationAuthorityKind.Employer
      && proof.verificationStatus === QualificationVerificationStatus.Verified)
    .map(schemaOrganization)

  return Object.freeze({
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': qualification.subjectReference,
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      '@id': qualification.id,
      identifier: {
        '@type': 'PropertyValue',
        ...(qualification.identifier.system
          ? { propertyID: qualification.identifier.system }
          : {}),
        value: qualification.identifier.value,
      },
      ...(qualification.code.display ? { name: qualification.code.display } : {}),
      credentialCategory: qualification.type,
      publisher: schemaOrganization(qualification.issuer),
      validIn: {
        '@type': 'AdministrativeArea',
        identifier: qualification.issuer.jurisdiction,
      },
      recognizedBy: recognizers,
    },
  })
}

export type QualificationLedgerAnchor = Readonly<{
  assetType: 'qualification-evidence'
  evidenceId: string
  subjectLink: string
  issuerLink: string
  verifierLinks: readonly string[]
  contentHash: string
  lifecycleStatus: QualificationLifecycleStatusValue
  jurisdiction: string
  recordedAt: string
}>

const OPAQUE_SHA3_384_PREFIX = 'urn:sha3-384:'

function requireOpaqueLink(value: string, path: string): void {
  requireNonEmpty(value, path)
  if (!value.startsWith(OPAQUE_SHA3_384_PREFIX)) {
    throw new TypeError(`${path} must be an opaque SHA3-384 URN`)
  }
}

/**
 * Builds the only qualification projection suitable for a shared ledger.
 * Personal claims, qualification values, legal identifiers, documents,
 * credentials and signatures remain in confidential off-ledger storage.
 */
export function buildQualificationLedgerAnchor(input: Omit<
  QualificationLedgerAnchor,
  'assetType'
>): QualificationLedgerAnchor {
  requireNonEmpty(input.evidenceId, 'evidenceId')
  requireOpaqueLink(input.subjectLink, 'subjectLink')
  requireOpaqueLink(input.issuerLink, 'issuerLink')
  requireOpaqueLink(input.contentHash, 'contentHash')
  input.verifierLinks.forEach((value, index) => requireOpaqueLink(
    value,
    `verifierLinks[${index}]`,
  ))
  requireNonEmpty(input.jurisdiction, 'jurisdiction')
  requireNonEmpty(input.recordedAt, 'recordedAt')
  assertKnownValue(
    input.lifecycleStatus,
    QualificationLifecycleStatus,
    'qualification lifecycle status',
  )
  return Object.freeze({
    assetType: 'qualification-evidence',
    evidenceId: input.evidenceId,
    subjectLink: input.subjectLink,
    issuerLink: input.issuerLink,
    verifierLinks: Object.freeze([...input.verifierLinks]),
    contentHash: input.contentHash,
    lifecycleStatus: input.lifecycleStatus,
    jurisdiction: input.jurisdiction,
    recordedAt: input.recordedAt,
  })
}
// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
