import {decodeUnverifiedJsonOrJwtObject} from './credential-decoding.js';
// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { SchemaOrgOrganizationClaim, SchemaOrgServiceClaim } from './schema-org-claims.js';
type ClaimsRecord = Record<string, unknown>;
import {
  GaiaXCredentialAttachmentFormat,
  GaiaXCredentialAttachmentRole,
  GaiaXCredentialMediaType,
  type GaiaXCredentialAttachmentRoleValue,
  type GaiaXCredentialDraft,
  type GaiaXLegalPersonCredentialSubject,
  type GaiaXServiceOfferingCredentialSubject,
  type GaiaXVcJwtAttachment,
  type IcaMemberDiscoveryData,
} from './gaia-x.js';
import type { DidDocument } from './did-document.js';

const W3C_VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2' as const;

function requiredClaim(claims: ClaimsRecord, key: string, label: string): string {
  const value = String(claims[key] ?? '').trim();
  if (!value) throw new Error(`Missing ${label} required for Gaia-X projection.`);
  return value;
}

function optionalClaim(claims: ClaimsRecord, key: string): string | undefined {
  const value = String(claims[key] ?? '').trim();
  return value || undefined;
}

function requiredInput(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Missing ${label} required for Gaia-X projection.`);
  return normalized;
}

function asObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export interface SchemaOrgOrganizationRegistrationIdentifier {
  additionalType: string;
  value: string;
}

/**
 * Reads the canonical schema.org `PropertyValue` organization identifier.
 * During migration it also accepts the historical nested
 * `identifier.identifier` form. When the structure is absent, `taxID` becomes
 * a VAT/TAX fallback, matching ICA's OrganizationCredential issuance rule.
 */
export function resolveSchemaOrgOrganizationRegistrationIdentifier(
  credentialSubject: Record<string, unknown>,
): SchemaOrgOrganizationRegistrationIdentifier {
  const outerIdentifier = asObject(credentialSubject.identifier);
  const identifier = asObject(outerIdentifier?.identifier) || outerIdentifier;
  const taxId = asString(credentialSubject.taxID || credentialSubject.taxId);
  const value = asString(identifier?.value) || taxId;
  if (!value) throw new Error('Missing OrganizationCredential credentialSubject.identifier.value or taxID.');
  const explicitType = asString(identifier?.additionalType || outerIdentifier?.additionalType);
  return {
    additionalType: explicitType || (/^VAT[A-Z]{2}-/i.test(value) ? 'VAT' : 'TAX'),
    value,
  };
}

/**
 * Converts canonical schema.org organization claims into an unsigned Gaia-X
 * ICAM 25.11 LegalPerson VC draft.
 *
 * Semantic boundary:
 * - Gaia-X `LegalPerson` is the juridical organization/legal entity. It is not
 *   GDC's natural-person `LegalRepresentativeCredential`.
 * - representative claims are intentionally never projected by this function.
 * - VAT/tax remains in the source schema.org OrganizationCredential. Gaia-X's
 *   `gx:legalRegistrationNumber` is a resolvable reference to the separate
 *   registration/notary credential, not an assertion synthesized from VAT.
 * - this function is deterministic and does not sign. The authoritative GW
 *   signs the returned draft as VC-JWT; ICA caches and verifies that exact JWT.
 *
 * This projection targets the credential structure and semantic model described
 * by Gaia-X ICAM 25.11. Passing the resulting shape tests neither Gaia-X policy
 * compliance nor GXDCH/TCK conformance.
 *
 * @see https://docs.gaia-x.eu/technical-committee/identity-credential-access-management/25.11/gaia-x_credentials/
 * @see https://docs.gaia-x.eu/technical-committee/identity-credential-access-management/25.11/semantic_model/
 */
export function buildGaiaXLegalPersonCredentialDraft(input: Readonly<{
  claims: ClaimsRecord;
  credentialId: string;
  subjectId: string;
  issuerId: string;
  legalRegistrationNumberCredentialId: string;
  validFrom: string;
}>): GaiaXCredentialDraft<GaiaXLegalPersonCredentialSubject> {
  const country = requiredClaim(
    input.claims,
    SchemaOrgOrganizationClaim.AddressCountry,
    'organization ISO 3166-1 country code',
  ).toUpperCase();
  const gaiaXAddress = { 'gx:countryCode': country };
  const website = optionalClaim(input.claims, SchemaOrgOrganizationClaim.Url);

  return {
    '@context': [W3C_VC_V2_CONTEXT],
    type: ['VerifiableCredential', 'LegalPerson'],
    id: requiredInput(input.credentialId, 'credentialId'),
    issuer: requiredInput(input.issuerId, 'issuerId'),
    validFrom: requiredInput(input.validFrom, 'validFrom'),
    credentialSubject: {
      id: requiredInput(input.subjectId, 'subjectId'),
      type: 'gx:LegalPerson',
      'gx:legalName': requiredClaim(input.claims, SchemaOrgOrganizationClaim.LegalName, 'organization legal name'),
      'gx:legalRegistrationNumber': {
        id: requiredInput(input.legalRegistrationNumberCredentialId, 'legal registration number credential id'),
      },
      'gx:headquarterAddress': gaiaXAddress,
      'gx:legalAddress': gaiaXAddress,
      ...(website ? { 'gx:website': website } : {}),
    },
  };
}

/**
 * Projects an ICA-issued schema.org OrganizationCredential into a Gaia-X
 * LegalPerson draft while preserving the organization `credentialSubject.id`.
 *
 * The source VC and Gaia-X VC are different signed statements, so their
 * credential IDs must not silently collide. By default the Gaia-X credential
 * receives `<source credential id>#gaia-x-legal-person`; callers may provide a
 * separately resolvable ID. `registrationIdentifier` is returned for the
 * notary/GXDCH registration step, while `gx:legalRegistrationNumber` remains a
 * reference to the resulting registration credential.
 */
export function buildGaiaXLegalPersonProjectionFromOrganizationCredential(input: Readonly<{
  organizationCredential: Record<string, unknown>;
  credentialId?: string;
  issuerId: string;
  legalRegistrationNumberCredentialId: string;
  addressCountryCode?: string;
  validFrom: string;
}>): Readonly<{
  sourceCredentialId: string;
  registrationIdentifier: SchemaOrgOrganizationRegistrationIdentifier;
  credential: GaiaXCredentialDraft<GaiaXLegalPersonCredentialSubject>;
}> {
  const sourceCredentialId = requiredInput(asString(input.organizationCredential.id), 'source credential id');
  const subject = asObject(input.organizationCredential.credentialSubject);
  if (!subject) throw new Error('OrganizationCredential requires one object credentialSubject.');
  const subjectId = requiredInput(asString(subject.id || subject['@id']), 'organization credentialSubject.id');
  const registrationIdentifier = resolveSchemaOrgOrganizationRegistrationIdentifier(subject);
  const address = asObject(subject.address);
  const claims: ClaimsRecord = {
    [SchemaOrgOrganizationClaim.LegalName]: asString(subject.legalName || subject.name),
    [SchemaOrgOrganizationClaim.Url]: asString(subject.url),
    [SchemaOrgOrganizationClaim.AddressCountry]: input.addressCountryCode || asString(address?.addressCountry),
    [SchemaOrgOrganizationClaim.IdentifierType]: registrationIdentifier.additionalType,
    [SchemaOrgOrganizationClaim.IdentifierValue]: registrationIdentifier.value,
  };
  return {
    sourceCredentialId,
    registrationIdentifier,
    credential: buildGaiaXLegalPersonCredentialDraft({
      claims,
      credentialId: input.credentialId || `${sourceCredentialId}#gaia-x-legal-person`,
      subjectId,
      issuerId: input.issuerId,
      legalRegistrationNumberCredentialId: input.legalRegistrationNumberCredentialId,
      validFrom: input.validFrom,
    }),
  };
}

/**
 * Converts schema.org service claims into an unsigned Gaia-X ServiceOffering
 * VC draft. A service offering is independent from the participant credential:
 * it references the LegalPerson credential through `gx:providedBy` and carries
 * its own mandatory terms reference.
 *
 * The GW must sign this draft as a separate VC-JWT. A DCAT DataService is useful
 * catalog metadata but is not a substitute for this credential.
 */
export function buildGaiaXServiceOfferingCredentialDraft(input: Readonly<{
  claims: ClaimsRecord;
  credentialId: string;
  subjectId: string;
  issuerId: string;
  providedByCredentialId: string;
  termsAndConditionsUrl: string;
  termsAndConditionsHash: string;
  validFrom: string;
}>): GaiaXCredentialDraft<GaiaXServiceOfferingCredentialSubject> {
  const name = optionalClaim(input.claims, SchemaOrgServiceClaim.Name);
  const description = optionalClaim(input.claims, SchemaOrgServiceClaim.Description);
  const endpointUrl = optionalClaim(input.claims, SchemaOrgServiceClaim.Url);

  const termsHash = requiredInput(input.termsAndConditionsHash, 'terms and conditions SHA-256 hash');
  if (!/^[a-f0-9]{64}$/i.test(termsHash)) {
    throw new Error('Gaia-X terms and conditions hash must be a 64-character SHA-256 hexadecimal digest of the published document bytes.');
  }

  return {
    '@context': [W3C_VC_V2_CONTEXT],
    type: ['VerifiableCredential', 'ServiceOffering'],
    id: requiredInput(input.credentialId, 'credentialId'),
    issuer: requiredInput(input.issuerId, 'issuerId'),
    validFrom: requiredInput(input.validFrom, 'validFrom'),
    credentialSubject: {
      id: requiredInput(input.subjectId, 'subjectId'),
      type: 'gx:ServiceOffering',
      'gx:providedBy': { id: requiredInput(input.providedByCredentialId, 'providedBy credential id') },
      'gx:serviceOfferingTermsAndConditions': [{
        'gx:url': requiredInput(input.termsAndConditionsUrl, 'terms and conditions URL'),
        'gx:hash': termsHash.toLowerCase(),
      }],
      ...(name ? { 'gx:name': name } : {}),
      ...(description ? { 'gx:description': description } : {}),
      ...(endpointUrl ? { 'gx:endpoint': [{ 'gx:endpointURL': endpointUrl }] } : {}),
    },
  };
}

/** Builds the mandatory first Gaia-X participant attachment for ICA discovery. */
export function buildGaiaXParticipantAttachment(input: Readonly<{
  id: string;
  jwt: string;
}>): GaiaXVcJwtAttachment {
  return buildGaiaXVcJwtAttachment({
    ...input,
    role: GaiaXCredentialAttachmentRole.Participant,
  });
}

/** Wraps an exact signed Gaia-X VC-JWT without decoding or re-signing it. */
export function buildGaiaXVcJwtAttachment(input: Readonly<{
  id: string;
  jwt: string;
  role: GaiaXVcJwtAttachment['role'];
}>): GaiaXVcJwtAttachment {
  const jwt = requiredInput(input.jwt, 'VC-JWT');
  assertGaiaXDiscoveryAttachmentSemantics(jwt, input.role);
  return {
    id: requiredInput(input.id, 'attachment id'),
    format: GaiaXCredentialAttachmentFormat,
    role: input.role,
    media_type: GaiaXCredentialMediaType.VcJwt,
    data: { json: { jwt } },
  };
}

function decodeVcJwtCredential(jwt: string): Record<string, unknown> {
  const parts = jwt.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new Error('Gaia-X attachment must contain one compact three-part VC-JWT.');
  }
  let payload: Record<string, unknown>;
  try {
    const decoded = decodeUnverifiedJsonOrJwtObject(jwt);
    if (!decoded) throw new Error('Unsupported unverified credential payload.');
    payload = decoded;
  } catch {
    throw new Error('Gaia-X attachment VC-JWT payload is not valid base64url JSON.');
  }
  return asObject(payload.vc) || payload;
}

function gaiaXCredentialSubject(document: Record<string, unknown>): Record<string, unknown> | undefined {
  const raw = document.credentialSubject;
  if (Array.isArray(raw)) {
    return raw.map(asObject).find((value): value is Record<string, unknown> => Boolean(value));
  }
  return asObject(raw);
}

function requireGaiaXProperties(
  subject: Record<string, unknown>,
  names: string[],
  role: string,
): void {
  const missing = names.filter((name) => !(name in subject));
  if (missing.length) {
    throw new Error(`Gaia-X ${role} VC-JWT is missing required semantic properties: ${missing.join(', ')}.`);
  }
}

/**
 * Enforces the semantic contract of a signed Gaia-X discovery VC-JWT.
 *
 * This assertion deliberately does not verify the cryptographic signature.
 * Signature, issuer, status and trust-chain verification remain the verifier's
 * responsibility. It prevents a validly shaped schema.org
 * OrganizationCredential from being merely serialized as JWT and mislabeled
 * as the distinct Gaia-X participant credential.
 *
 * Participant attachments require `gx:LegalPerson` with the ICAM 25.11 legal
 * properties. Service-offering attachments require `gx:ServiceOffering`,
 * `gx:providedBy` and `gx:serviceOfferingTermsAndConditions`.
 *
 * This validates member-level `data[].attachments[]`; it does not describe
 * `_retrieve?format=vc+jwt` or credential-internal
 * `credential.evidence[].attachments`.
 *
 * @see https://docs.gaia-x.eu/technical-committee/identity-credential-access-management/25.11/gaia-x_credentials/
 * @see https://docs.gaia-x.eu/technical-committee/identity-credential-access-management/25.11/semantic_model/
 */
export function assertGaiaXDiscoveryAttachmentSemantics(
  jwt: string,
  role: GaiaXCredentialAttachmentRoleValue,
): void {
  const document = decodeVcJwtCredential(jwt);
  const subject = gaiaXCredentialSubject(document);
  if (!subject) throw new Error(`Gaia-X ${role} VC-JWT requires one credentialSubject object.`);
  const subjectType = asString(subject.type);

  if (role === GaiaXCredentialAttachmentRole.Participant) {
    if (subjectType !== 'gx:LegalPerson') {
      throw new Error('Gaia-X participant VC-JWT credentialSubject.type must be gx:LegalPerson.');
    }
    requireGaiaXProperties(subject, [
      'gx:legalName',
      'gx:legalRegistrationNumber',
      'gx:headquarterAddress',
      'gx:legalAddress',
    ], 'participant');
  }

  if (role === GaiaXCredentialAttachmentRole.ServiceOffering) {
    if (subjectType !== 'gx:ServiceOffering') {
      throw new Error('Gaia-X service-offering VC-JWT credentialSubject.type must be gx:ServiceOffering.');
    }
    requireGaiaXProperties(subject, [
      'gx:providedBy',
      'gx:serviceOfferingTermsAndConditions',
    ], 'service-offering');
  }
}

/**
 * Assembles one ICA member discovery entry and enforces the interoperable
 * ordering contract: schema.org OrganizationCredential first in `vc[]`, and
 * Gaia-X participant VC-JWT first in `attachments[]`.
 *
 * The caller owns signature verification and cache freshness. This helper does
 * not derive or duplicate VAT outside `vc[]` and does not mutate signed data.
 */
export function buildIcaMemberDiscoveryData(input: Readonly<{
  id: string;
  vc: IcaMemberDiscoveryData['vc'];
  did: {
    document: DidDocument;
    meta: IcaMemberDiscoveryData['did']['meta'];
  };
  attachments: GaiaXVcJwtAttachment[];
  dcat?: IcaMemberDiscoveryData['dcat'];
  meta?: IcaMemberDiscoveryData['meta'];
}>): IcaMemberDiscoveryData {
  if (!input.vc.length) {
    throw new Error('ICA member discovery requires vc[0] OrganizationCredential.');
  }
  if (input.attachments[0]?.role !== GaiaXCredentialAttachmentRole.Participant) {
    throw new Error('ICA member discovery requires the Gaia-X participant VC-JWT as attachments[0].');
  }
  return {
    id: requiredInput(input.id, 'member id'),
    vc: [...input.vc],
    did: { document: input.did.document, meta: { ...input.did.meta } },
    attachments: [...input.attachments],
    ...(input.dcat ? { dcat: input.dcat } : {}),
    ...(input.meta ? { meta: input.meta } : {}),
  };
}
