# Antifraud Data Utilities

Product-neutral TypeScript contracts for identity verification, evidence and
attestations.

The central trust rule is provenance without authority substitution: every
identity or qualification claim keeps who asserted it, under which authority
and jurisdiction, from which evidence, at what time, with which proof and
current status. Employer, university, licensing authority, verifier and subject
are separate actors even when they support the same claim.

The package keeps three concerns separate:

1. Canonical business data uses governed Schema.org flat claims.
2. OpenID Identity Assurance `verified_claims` is an exchange projection.
3. An attestation records that an authorized actor assessed a subject, claim
   or relationship; it never silently rewrites the assessed source data.

## Current API

```ts
import {
  ClearingHouseTenantCapability,
  ClaimProofFormat,
  EudiPidClaim,
  IdentityAttestationCapability,
  IdentityEvidenceType,
  QualificationAuthorityKind,
  QualificationVerificationStatus,
  SchemaOrgIdentityClaim,
  SchemaOrgContentIdentifierProfile,
  SchemaOrgDocumentResourceType,
  SchemaOrgQualificationClaim,
  buildSchemaOrgConfidentialDocumentGraph,
  buildQualificationLedgerAnchor,
  defineProfessionalQualification,
  defineAuthorizedWorkforceIdentityEvidenceStatement,
  defineClaimProofBinding,
  importOidc4IdaToSchemaOrgFlatClaims,
  projectSchemaOrgFlatClaimsToOidc4Ida,
  selectAuthoritativeTenantEndpoint,
  toSchemaOrgQualificationFlatClaims,
  verifiedClaimsJsonSchema,
  workforceIdentityEvidenceStatementJsonSchema,
} from 'antifraud-data-utils-ts/identity-assurance'
```

`ClaimProofBinding` connects one canonical claim or derived predicate to one or
more credential-level proof references. For example, an `age-over` predicate
can disclose `age_over_18=true` without disclosing the source birth date. An
SD-JWT VC signs disclosure digests at credential level; the package does not
misrepresent that mechanism as an independent signature embedded in every
flat claim.

The initial governed projection covers the registered OpenID identity claims
that have direct Schema.org equivalents. An unknown mapping fails on export.
Import reports unsupported claims and conflicting existing values instead of
discarding or overwriting them.

An authorized workforce member may record identity evidence only when trusted
server context supplies the active employee assignment, active membership in a
controller-governed work group, that group's reusable authorization and
`identity.evidence.record`. The employee has no separate Consent. A subject or
lawful representative authorization remains a distinct optional gate when the
use case requires it. The form collects the evidence observation; it does not
select the actor, grant permission or sign a credential. Raw identity documents
are excluded from the statement. Attachments are referenced by digest.
Schema.org `MediaObject` flat claims describe a scanned artifact and bind its
protected URL, media type and size to a CIDv1(raw, SHA3-384) identifier encoded
with multibase base58btc. OpenID Identity Assurance attachment metadata is a
projection of that same artifact; it is not the canonical store.

`buildSchemaOrgConfidentialDocumentGraph` produces a strict JSON:API 1.1
primary document whose `data[]` contains direct Schema.org
`DigitalDocument` and `MediaObject` resource objects. A manifest relates its
documents through `hasPart`; each document relates its concrete file through
`encoding`. The `MediaObject.identifier` is a `PropertyValue`: `propertyID` is
`cidv1-raw-sha3-384` and `value` is the complete multibase base58btc CID. The
builder verifies that the CID embeds a SHA3-384 digest matching the supplied
digest, requires exact byte size, protected URL and media type, rejects
duplicate resource identifiers and never accepts raw document bytes.

Historical inputs may have used `identifier.additionalType` to name an
identifier scheme. `normalizeSchemaOrgContentIdentifier` reads that legacy
shape for migration, but canonical output uses `PropertyValue.propertyID`.
Conflicting legacy and canonical values fail closed. Established external
organization, person or animal identifier contracts are not silently renamed
by this attachment-specific compatibility rule.

A controller or authorized human-resources employee may use the same governed
flow to record evidence about an employee's identity or qualifications. When a
qualification refers to a university or another awarding organization, that
organization must be resolved by its legal identifier and jurisdiction, not by
display name alone. If no credential from the awarding organization exists,
the result is an employer attestation about evidence the employer reviewed; it
must not be represented as a university-issued credential. The employer's
signature is its own proof. A later university credential or confirmation is
added as a separate proof for the same claim instead of replacing the employer
proof.

This separation is essential in health and other regulated sectors. Evidence
of a qualification is not by itself an active professional licence, an active
employment assignment, or authority to perform an operation. A downstream
policy evaluates each applicable status independently and fails closed on
suspension, revocation, expiry, or an authority mismatch.

An invitation may propose an optional department and zero or more groups. The
proposal grants nothing before employee activation. Invitation acceptance and
later department or group changes require a Communication notice, while the
shared group authorization remains unchanged for the other active members.

The home tenant is the initial trust root. An employer or index-provider tenant
publishes its own authoritative endpoint. A different source tenant is usable
only after the home tenant explicitly trusts it and the source advertises the
required capability. The source tenant reads its stored record before issuing
an attestation; caller-authored claims are never signed as authoritative data.

Professional qualifications use product-neutral Schema.org
`EducationalOccupationalCredential` flat claims. Employer, awarding body and
professional-body proofs remain independent. The package does not expose a
health-specific model or a native FHIR projection. Health applications may
project this neutral contract to their FHIR version in their own data-utility
layer. `buildQualificationLedgerAnchor` deliberately excludes personal claims,
qualification values, legal identifiers, credentials, documents and
signatures; a shared ledger receives only opaque links, a content hash and
lifecycle metadata.

EUDI Person Identification Data and OpenID Identity Assurance are related but
different contracts. For example, EUDI PID defines `birth_date` and
`age_over_18`, while the OpenID `verified_claims.claims` projection uses the
registered `birthdate` claim. OpenID4VP presents credentials and OpenID4VCI
issues them; OpenID Identity Assurance describes verified claims and evidence.

## Repository boundary

This package contains pure types, vocabulary, JSON Schemas, converters,
validators and synthetic fixtures. It contains no user interface, role policy,
HTTP client, persistence adapter, signing key, credential issuer, ledger
connection or deployment configuration.

See [Identity verification and attestation contract](docs/IDENTITY_VERIFICATION_AND_ATTESTATION.md)
for the normative model and downstream acceptance requirements.

See [DC4EU education and medical credential reference](docs/DC4EU_EDUCATION_AND_MEDICAL_CREDENTIALS.md)
for the upstream European Higher Education Diploma, Doctor ID, professional
suitability and medical-training credential boundaries and their current draft
status.

See [Education administrative assistant identity-evidence journey](docs/EDUCATION_ADMINISTRATIVE_ASSISTANT_IDENTITY_EVIDENCE.md)
for the controller-governed employee flow, age predicates and the local
user-interface acceptance boundary.

## Standards

- [OpenID Identity Assurance Schema Definition 1.0](https://openid.net/specs/openid-ida-verified-claims-1_0-final.html)
- [OpenID Connect for Identity Assurance 1.0](https://openid.net/specs/openid-connect-4-identity-assurance-1_0-final.html)
- [Schema.org Person](https://schema.org/Person)
- [Schema.org Action](https://schema.org/Action)
- [Schema.org AssessAction](https://schema.org/AssessAction)
- [Schema.org EducationalOccupationalCredential](https://schema.org/EducationalOccupationalCredential)
- [DC4EU EUDI Wallet large-scale pilot](https://ec.europa.eu/digital-building-blocks/sites/spaces/EUDIGITALIDENTITYWALLET/pages/920064520/LSP-DC4EU)

## Development

Node.js 24 is required.

```bash
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

## License

Apache-2.0.
