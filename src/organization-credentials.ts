// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
import type { JsonValue } from './identity-assurance/types.js'
import { buildStableActorIdentifier, normalizeActorContact, type ActorContactInput } from './organization-identity.js'
import { W3cCredentialContexts, W3cCredentialTypes } from './credential-contracts.js'

export const ReviewedOrganizationCredentialTypes = Object.freeze({
  VerifiableCredential: W3cCredentialTypes.VerifiableCredential,
  Admission: 'OrganizationTestNetworkCredential',
  Organization: 'OrganizationCredential',
  Person: 'PersonCredential',
  LegalRepresentative: 'LegalRepresentativeCredential',
  ServiceController: 'ServiceControllerCredential',
  TestNetwork: 'TestNetworkCredential',
} as const)
export const TestNetworkOrganizationCredentialTypes = Object.freeze([
  ReviewedOrganizationCredentialTypes.Organization,
  ReviewedOrganizationCredentialTypes.LegalRepresentative,
  ReviewedOrganizationCredentialTypes.ServiceController,
] as const)
const CONTEXTS = [W3cCredentialContexts.V2, 'https://schema.org']

export type ReviewedOrganizationCredential = Readonly<{
  '@context': readonly string[]
  id: string
  type: readonly string[]
  issuer: string
  credentialSubject: Readonly<Record<string, JsonValue>>
  validFrom: string
  validUntil: string
  evidence?: readonly JsonValue[]
  proof?: JsonValue
}>

export type OrganizationControllerContact =
  | Readonly<{ controllerEmail: string; controllerTelephone?: never }>
  | Readonly<{ controllerTelephone: string; controllerEmail?: never }>
export type OrganizationRepresentativeContact =
  | Readonly<{ legalRepresentativeEmail: string; legalRepresentativeTelephone?: never }>
  | Readonly<{ legalRepresentativeTelephone: string; legalRepresentativeEmail?: never }>

export type OrganizationTestNetworkCredentialInput = OrganizationControllerContact & Readonly<{
  issuerDid: string; subjectDid: string; credentialId: string
  validFrom: string; validUntil: string; legalName: string; organizationIdentifier: string
  controllerKeyMaterial: string; applicationId: string; accessPath: 'partner' | 'test-network'
  proof?: JsonValue
}>
export type TestNetworkOrganizationCredentialSetInput = OrganizationControllerContact & OrganizationRepresentativeContact & Readonly<{
  issuerDid: string; organizationDid: string; applicationId: string; validFrom: string; validUntil: string
  pdfSha256: string; documentVersion: string; legalName: string; organizationIdentifier: string
  identifierType: string; addressCountry: string; serviceCategory: string; legalRepresentativeFullName: string
  legalRepresentativeOccupation: string; controllerOccupation: string; controllerAuthorityRole: string
  controllerKeyMaterial: string
}>

function required(value: unknown, name: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(`Reviewed organization credentials require ${name}`)
  return normalized
}

function partyContact(email: unknown, telephone: unknown, party: string): ActorContactInput {
  if ((email !== undefined && typeof email !== 'string') || (telephone !== undefined && typeof telephone !== 'string')) {
    throw new TypeError(`${party} contact must be a string`)
  }
  const hasEmail = Boolean(String(email || '').trim())
  const hasTelephone = Boolean(String(telephone || '').trim())
  if (hasEmail === hasTelephone) throw new TypeError(`${party} requires exactly one email or telephone`)
  const contactKind = hasEmail ? 'email' : 'phone'
  return { contactKind, contact: normalizeActorContact({ contactKind, contact: String(hasEmail ? email : telephone) }) }
}

/** Creates a draft only; the host must sign and verify the exact admission evidence. */
export function buildOrganizationTestNetworkCredential(input: OrganizationTestNetworkCredentialInput): ReviewedOrganizationCredential {
  const applicationId = required(input.applicationId, 'applicationId')
  const organizationIdentifier = required(input.organizationIdentifier, 'organizationIdentifier')
  const contact = partyContact(input.controllerEmail, input.controllerTelephone, 'controller')
  return {
    '@context': [...CONTEXTS],
    id: required(input.credentialId, 'credentialId'),
    type: [ReviewedOrganizationCredentialTypes.VerifiableCredential, ReviewedOrganizationCredentialTypes.Admission],
    issuer: required(input.issuerDid, 'issuerDid'),
    credentialSubject: {
      id: required(input.subjectDid, 'subjectDid'),
      applicationId,
      accessPath: input.accessPath,
      organization: { legalName: required(input.legalName, 'legalName'), identifier: organizationIdentifier },
      controller: {
        ...(contact.contactKind === 'email' ? { email: contact.contact } : { telephone: contact.contact }),
        hasCredential: { material: required(input.controllerKeyMaterial, 'controllerKeyMaterial') },
      },
    },
    validFrom: required(input.validFrom, 'validFrom'),
    validUntil: required(input.validUntil, 'validUntil'),
    ...(input.proof ? { proof: input.proof } : {}),
  }
}

/** Projects governed parties and roles; this builder never assigns or verifies them. */
export function buildTestNetworkOrganizationCredentialSet(input: TestNetworkOrganizationCredentialSetInput): readonly [ReviewedOrganizationCredential, ReviewedOrganizationCredential, ReviewedOrganizationCredential] {
  const issuer = required(input.issuerDid, 'issuerDid')
  const organizationDid = required(input.organizationDid, 'organizationDid')
  const applicationId = required(input.applicationId, 'applicationId')
  const validFrom = required(input.validFrom, 'validFrom')
  const validUntil = required(input.validUntil, 'validUntil')
  const legalName = required(input.legalName, 'legalName')
  const organizationIdentifier = required(input.organizationIdentifier, 'organizationIdentifier')
  const identifierType = required(input.identifierType, 'identifierType')
  const addressCountry = required(input.addressCountry, 'addressCountry').toUpperCase()
  const serviceCategory = required(input.serviceCategory, 'serviceCategory')
  const representativeContact = partyContact(input.legalRepresentativeEmail, input.legalRepresentativeTelephone, 'legal representative')
  const legalRepresentativeFullName = required(input.legalRepresentativeFullName, 'legalRepresentativeFullName')
  const controllerContact = partyContact(input.controllerEmail, input.controllerTelephone, 'controller')
  const representativeActor = buildStableActorIdentifier(representativeContact)
  const controllerActor = buildStableActorIdentifier(controllerContact)
  const representativeOccupation = required(input.legalRepresentativeOccupation, 'legalRepresentativeOccupation')
  const controllerOccupation = required(input.controllerOccupation, 'controllerOccupation')
  const controllerAuthorityRole = required(input.controllerAuthorityRole, 'controllerAuthorityRole')
  const evidence = [{
    type: 'DocumentVerification',
    id: `urn:sha256:${required(input.pdfSha256, 'pdfSha256')}`,
    documentVersion: required(input.documentVersion, 'documentVersion'),
    applicationId,
  }]
  const base = { '@context': [...CONTEXTS], issuer, validFrom, validUntil, evidence }
  const organization = {
    ...base,
    id: `urn:uuid:${applicationId}:organization`,
    type: [ReviewedOrganizationCredentialTypes.VerifiableCredential, ReviewedOrganizationCredentialTypes.Organization, ReviewedOrganizationCredentialTypes.TestNetwork],
    credentialSubject: {
      id: organizationDid,
      '@type': 'Organization',
      legalName,
      identifier: { additionalType: identifierType, value: organizationIdentifier },
      ...(identifierType === 'taxID' ? { taxID: organizationIdentifier } : {}),
      address: { '@type': 'PostalAddress', addressCountry },
      makesOffer: { '@type': 'Offer', category: serviceCategory },
    },
  }
  const representative = {
    ...base,
    id: `urn:uuid:${applicationId}:legal-representative`,
    type: [ReviewedOrganizationCredentialTypes.VerifiableCredential, ReviewedOrganizationCredentialTypes.Person, ReviewedOrganizationCredentialTypes.LegalRepresentative, ReviewedOrganizationCredentialTypes.TestNetwork],
    credentialSubject: {
      id: representativeActor,
      '@type': 'Person',
      name: legalRepresentativeFullName,
      sameAs: representativeActor,
      hasOccupation: { '@type': 'Occupation', occupationalCategory: representativeOccupation },
      memberOf: {
        '@type': 'Organization', legalName,
        ...(identifierType === 'taxID' ? { taxID: organizationIdentifier } : { identifier: { additionalType: identifierType, value: organizationIdentifier } }),
      },
    },
  }
  const controller = {
    ...base,
    id: `urn:uuid:${applicationId}:service-controller`,
    type: [ReviewedOrganizationCredentialTypes.VerifiableCredential, 'ServiceCredential', ReviewedOrganizationCredentialTypes.ServiceController, ReviewedOrganizationCredentialTypes.TestNetwork],
    credentialSubject: {
      id: organizationDid,
      '@type': 'Service',
      serviceType: 'OrganizationControllerService',
      provider: {
        '@type': 'Organization', legalName,
        ...(identifierType === 'taxID' ? { taxID: organizationIdentifier } : { identifier: { additionalType: identifierType, value: organizationIdentifier } }),
      },
      owner: {
        '@type': 'Person',
        additionalType: controllerAuthorityRole,
        sameAs: controllerActor,
        hasOccupation: { '@type': 'Occupation', occupationalCategory: controllerOccupation },
        hasCredential: { material: required(input.controllerKeyMaterial, 'controllerKeyMaterial') },
      },
    },
  }
  return [organization, representative, controller]
}

/** Faithful existing proof-free JSON contract, not a new signing algorithm. */
function canonicalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== 'proof')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, nested]) => [key, canonicalizeValue(nested)]))
}

export function canonicalizeOrganizationTestNetworkCredential(credential: ReviewedOrganizationCredential): string {
  if (!credential.type.includes(ReviewedOrganizationCredentialTypes.Admission)) throw new TypeError('Credential is not an organization Test Network admission')
  return JSON.stringify(canonicalizeValue(credential))
}

export function canonicalizeTestNetworkOrganizationCredential(credential: ReviewedOrganizationCredential): string {
  if (!TestNetworkOrganizationCredentialTypes.some(type => credential.type.includes(type))) throw new TypeError('Credential is not a Test Network organization credential')
  if (!credential.type.includes(ReviewedOrganizationCredentialTypes.TestNetwork)) throw new TypeError('Test Network credential marker is required')
  return JSON.stringify(canonicalizeValue(credential))
}
