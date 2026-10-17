export const IdentityAttestationCapability = Object.freeze({
  VerifyClaim: 'identity.claim.verify',
  AttestSubject: 'identity.subject.attest',
  AttestRelationship: 'identity.relationship.attest',
} as const)

export type IdentityAttestationCapabilityValue =
  typeof IdentityAttestationCapability[keyof typeof IdentityAttestationCapability]

/** Canonical Schema.org flat claims currently mapped to registered OpenID claims. */
export const SchemaOrgIdentityClaim = Object.freeze({
  PersonName: 'org.schema.Person.name',
  PersonGivenName: 'org.schema.Person.givenName',
  PersonFamilyName: 'org.schema.Person.familyName',
  PersonBirthDate: 'org.schema.Person.birthDate',
  PersonGender: 'org.schema.Person.gender',
  PersonEmail: 'org.schema.Person.email',
  PersonTelephone: 'org.schema.Person.telephone',
} as const)

export type SchemaOrgIdentityClaimValue =
  typeof SchemaOrgIdentityClaim[keyof typeof SchemaOrgIdentityClaim]

/** Registered OpenID Connect claim names used by the identity-assurance projection. */
export const OidcIdentityClaim = Object.freeze({
  Name: 'name',
  GivenName: 'given_name',
  FamilyName: 'family_name',
  Birthdate: 'birthdate',
  Gender: 'gender',
  Email: 'email',
  PhoneNumber: 'phone_number',
} as const)

export type OidcIdentityClaimValue =
  typeof OidcIdentityClaim[keyof typeof OidcIdentityClaim]

export const SchemaOrgToOidcIdentityClaim = Object.freeze({
  [SchemaOrgIdentityClaim.PersonName]: OidcIdentityClaim.Name,
  [SchemaOrgIdentityClaim.PersonGivenName]: OidcIdentityClaim.GivenName,
  [SchemaOrgIdentityClaim.PersonFamilyName]: OidcIdentityClaim.FamilyName,
  [SchemaOrgIdentityClaim.PersonBirthDate]: OidcIdentityClaim.Birthdate,
  [SchemaOrgIdentityClaim.PersonGender]: OidcIdentityClaim.Gender,
  [SchemaOrgIdentityClaim.PersonEmail]: OidcIdentityClaim.Email,
  [SchemaOrgIdentityClaim.PersonTelephone]: OidcIdentityClaim.PhoneNumber,
} satisfies Readonly<Record<SchemaOrgIdentityClaimValue, OidcIdentityClaimValue>>)
