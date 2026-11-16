// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import type { DidCommAttachment } from './didcomm-contracts.js';
import type { DidDocument } from './did-document.js';

export type JsonObject = Record<string, unknown>;

/** Versioned Gaia-X profile targeted by the schema.org semantic projection. */
export const GaiaXProfile = Object.freeze({
  Icam2511: 'icam-25.11',
} as const);

/** Media types used to transport signed Gaia-X credentials without decoding them. */
export const GaiaXCredentialMediaType = Object.freeze({
  VcJwt: 'application/vc+jwt',
  VpJwt: 'application/vp+jwt',
} as const);

/** DIDComm attachment format identifier used by the existing ICA contract. */
export const GaiaXCredentialAttachmentFormat = 'vc+jwt' as const;

/**
 * Semantic roles for Gaia-X VC-JWT attachments in an ICA member aggregate.
 *
 * `Participant` is deliberately first in a member's `attachments[]`. It is the
 * Gaia-X legal-entity projection corresponding to the same organization
 * represented by the first schema.org `OrganizationCredential` in `vc[]`.
 * They are different signed credentials and MUST NOT be treated as bytewise or
 * schema-equivalent copies.
 */
export const GaiaXCredentialAttachmentRole = Object.freeze({
  Participant: 'gaia-x-participant-vc-jwt',
  LegalRegistrationNumber: 'gaia-x-legal-registration-number-vc-jwt',
  TermsAndConditions: 'gaia-x-terms-and-conditions-vc-jwt',
  ServiceOffering: 'gaia-x-service-offering-vc-jwt',
} as const);

export type GaiaXCredentialAttachmentRoleValue =
  typeof GaiaXCredentialAttachmentRole[keyof typeof GaiaXCredentialAttachmentRole];

/** DIDComm attachment containing the compact, already-signed Gaia-X VC-JWT. */
export interface GaiaXVcJwtAttachment extends DidCommAttachment {
  media_type: typeof GaiaXCredentialMediaType.VcJwt;
  format: typeof GaiaXCredentialAttachmentFormat;
  role: GaiaXCredentialAttachmentRoleValue;
  data: { json: { jwt: string } };
}

/** Cache metadata kept next to a resolved artifact, never inside that artifact. */
export interface IcaDiscoveryArtifactMeta {
  sourceUrl?: string;
  fetchedAt: string;
  sourceUpdatedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  etag?: string;
  contentHash?: string;
}

/** Resolved DID document plus cache provenance, following the old document/meta split. */
export interface IcaDiscoveredDid {
  document: DidDocument;
  meta: IcaDiscoveryArtifactMeta;
}

/** Resolved DCAT document plus cache provenance. */
export interface IcaDiscoveredDcat {
  document: JsonObject;
  meta: IcaDiscoveryArtifactMeta;
}

/**
 * One authorized ICA member's complete discovery record.
 *
 * The VAT is intentionally not repeated at this level. Consumers obtain legal
 * identifiers from the authoritative schema.org OrganizationCredential in
 * `vc[0].credentialSubject.taxID` (or the versioned equivalent). `attachments`
 * contains exact Gaia-X VC-JWT artifacts, while `did.document` and
 * `dcat.document` make discovery possible without a second host request.
 */
export interface IcaMemberDiscoveryData {
  id: string;
  vc: JsonObject[];
  did: IcaDiscoveredDid;
  attachments: GaiaXVcJwtAttachment[];
  dcat?: IcaDiscoveredDcat;
  meta?: {
    assembledAt: string;
    refreshAfter?: string;
  };
}

/** DIDComm/JSON:API-compatible body returned by ICA member autodiscovery. */
export interface IcaMemberDiscoveryBody {
  data: IcaMemberDiscoveryData[];
  meta: {
    generatedAt: string;
    maxAgeSeconds?: number;
  };
}

export interface GaiaXLegalPersonCredentialSubject extends JsonObject {
  id: string;
  type: 'gx:LegalPerson';
  'gx:legalName': string;
  'gx:legalRegistrationNumber': { id: string };
  'gx:headquarterAddress': { 'gx:countryCode': string };
  'gx:legalAddress': { 'gx:countryCode': string };
  'gx:website'?: string;
}

export interface GaiaXServiceOfferingCredentialSubject extends JsonObject {
  id: string;
  type: 'gx:ServiceOffering';
  'gx:providedBy': { id: string };
  'gx:serviceOfferingTermsAndConditions': Array<{
    'gx:url': string;
    'gx:hash': string;
  }>;
  'gx:name'?: string;
  'gx:description'?: string;
  'gx:endpoint'?: Array<{ 'gx:endpointURL': string }>;
}

/** Unsigned VC Data Model 2.0 draft. Signing and VC-JWT encoding belong to the GW. */
export interface GaiaXCredentialDraft<TSubject extends JsonObject> extends JsonObject {
  '@context': ['https://www.w3.org/ns/credentials/v2'];
  type: ['VerifiableCredential', 'LegalPerson' | 'ServiceOffering'];
  id: string;
  issuer: string;
  validFrom: string;
  credentialSubject: TSubject;
}
