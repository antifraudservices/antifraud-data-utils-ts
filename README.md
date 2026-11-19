# Antifraud Data Utilities

The `did-document-test-fixtures` entry point supplies shared synthetic public
keys, `createDidDocumentTestFixture({did, keys})` and named invalid-document
vectors. Supply the consumer's reserved test DID. The public samples include
an EC point and the existing ML-KEM predecessor vector; they contain no private
keys or seeds. Transport probes cover loopback, foreign origin, userinfo,
query, fragment and encoded-separator cases. These fixtures perform no network
requests. Positive documents use `DidDocument` and `PublicJwk`; adversarial
documents remain `unknown` until the consumer validates them.

## Pinned credential verification

The `clearing-house` entry point provides pure verification primitives:

- `verifyPinnedJwt(compact, jwks, issuer, now, options)` checks a signed JWT
  against caller-pinned public keys, the expected issuer, optional audience and
  its validity period. Bearer JWTs require issued-at, expiry and a nonempty
  string identifier. Set `requireJwtTimes: false` only for a credential profile
  that does not carry bearer times. The explicit `allowMissingKid` option still
  requires one uniquely matching pinned key.
- `verifyPinnedDetachedJws(payloadBytes, jws, publicKey, cryptography?)` checks
  the exact payload bytes, including RFC 7797 unencoded detached proofs.
- ML-DSA verification requires the caller's injected `ICryptography` engine.
  Classical JOSE signatures use `jose`. Private pinned keys, unsupported
  algorithms, ambiguous keys and unsupported critical extensions are rejected.
  Embedded JWT keys and URLs never establish trust.
- `canonicalRequestDigest(value)` returns the SHA-256 hexadecimal digest of
  canonical JSON using browser-compatible primitives.
- `assertSignedReceiptBinding(verifiedPayload, expectation)` binds an already
  verified receipt to the current `nonce`, optional `requestDigest`, optional
  `acceptedAssurance`, and caller-required wire claims in `requiredClaims`.
  It does not verify a signature or decide authorization. The caller owns nonce
  generation, replay consumption and current-state policy.
- `assertTenantClearingHouseTrust(trust, tenantDid)` validates caller-owned
  tenant/verifier trust, explicit recognition of a federated source, pinned
  keys and its HTTPS endpoint. Its third boolean argument permits loopback HTTP
  only when an owning test-environment wrapper explicitly enables it. This pure
  module reads no environment variables and provides no HTTP client.

These helpers own signature and request-binding mechanics. Applications retain
identity, consent, role, ledger, transport, persistence and deployment policy.

`text-comparison` exports `normalizeComparisonText` through its leaf and the
root. It trims and folds whitespace, then uppercases text while preserving
punctuation, diacritics and Unicode normalization form. Nullish text produces
an empty key; other non-string inputs are rejected. Original text is unchanged.

`identifier-input-kinds` exports the frozen `IdentifierInputKinds` catalog and
`IdentifierInputKind` union for the nonstandard input tags `UUID`, `EMAIL` and
`PHONE`. These cross-sector tags select private identifier inputs; they do not
define normalization, hash profiles, clinical identifier codes or authority.
They remain distinct from lowercase stable-actor contact kinds.

`jwk-thumbprints` also exposes `isJwkThumbprintSha256Urn` for the existing trimmed
RFC 9278 SHA-256 URI shape. This syntax predicate does not verify a digest,
public-key material or its ownership.

`schema-org-types` exposes nine immutable canonical Schema.org Organization
class IRIs. `Dentist` is the published class; no `DentalClinic` class is
invented. `ResearchOrganization` is published in Schema.org's new area.
Consumers own presentation labels and selection policy; these classes confer
no identity, occupation or authority. Each value links to its official class
definition, for example [Dentist](https://schema.org/Dentist).

The `encoding` entry point exposes `buildDagJsonCidV1FromUtf8String` for the
fixed CIDv1 DAG-JSON (`0x129`), SHA2-256 and base58btc profile. It validates
supplied DAG-JSON and hashes its exact UTF-8 bytes without normalization or
reserialization. Callers own canonicalization and semantic field selection;
the primitive neither strips business identifiers nor verifies any claim.
The existing raw (`0x55`), SHA3-384 evidence profile remains independent.

The executable draft for the non-health
[Antifraud Data Card v1](docs/ANTIFRAUD_DATA_CARD_V1.md) defines the `afdc:/`
JSON:API/Schema.org credential transport and its separate `pqc:/` detached
ML-DSA companion proof.

Product-neutral TypeScript contracts for identity verification, evidence,
attestations and public organization-service discovery.

The `actor-kinds` entry point exports `ActorKinds`, `ActorKind` and
`isActorKind` for existing persisted identity-governance tags. A kind identifies
the record category; it does not establish an occupation or authorization.

`IdentityEvidenceReviewMethods` and `IdentityEvidenceReviewMethod` are exported
from the root and `identity-assurance` entry points. They preserve the submitted
document-review codes `pipp`, `sripp`, `eid` and `uripp`. Selecting a method does
not establish trusted verification, authorization or a credential signature.

The [organization contact identity guide](docs/ORGANIZATION_CONTACT_IDENTITY.md)
documents the `organization-identity` entry point. It accepts an explicit email
or E.164 phone channel and preserves the established actor multihash and
organization employee DID representation. These pure builders never verify a
contact, assign a role or replace an organization licence or device grant.
`stableActorIdentifierFromDidWeb` extracts the unchanged opaque employee actor
component from bare-host and tenant forms, including existing trailing paths.
It does not validate the DID's authority, role, hash material or contact ownership.
The related `organization-credentials` entry point builds compatible reviewed
admission/domain drafts with email or telephone parties and explicitly supplied
occupation/authority claims; signing and verification remain outside it.
Its canonicalizers accept the neutral credential consumer profile as well as
reviewed drafts and preserve the existing recursive proof-free transcript.
Validate the complete credential and current authority before accepting it.

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

The separate `organization-service-catalog` subpath defines a Schema.org-first
public graph for the legal Organization, department Organizations, Places and
client Services. Publication is explicit at every level. A public Service must
reference at least one public Place in its own department; private and unknown
relationships fail closed. Its DCAT descriptor supports bounded marketplace
cache refresh, withdrawal and rollback detection without becoming proof that
the publisher is trusted.

Schedules, Slots, Appointments, subjects and research studies do not belong in
that dataset. The builder emits no FHIR resources. A later sector adapter may
translate the canonical Schema.org graph when required.

It also exports the reviewed, stateless shared cryptography engine through
`antifraud-data-utils-ts/cryptography`. The engine preserves the existing
`gdc-common-utils-ts` confidential envelope: a fresh AES-256-GCM content key is
wrapped for the recipient with ML-KEM-768, HKDF-SHA-256 and AES-256-GCM key
wrap. ML-DSA-65 signs or verifies exact bytes. The engine never stores a private
key, unlock secret or plaintext key; managed wallets and KMS adapters retain
custody and authorization.

`ICryptography` describes that stateless engine boundary. `BaseJwk` contains
required public parameters for the supported profiles, while `JWK`/`JwkSet`
represent generic JOSE import data and do not filter private material for
publication. `AesGcmComponents` carries raw bytes; `ProtectedDataAES` carries
encoded envelope strings. These declarations do not validate key material.

```ts
import {
  CryptographyService,
  type ICryptoHelper,
} from 'antifraud-data-utils-ts/cryptography'

const cryptography = new CryptographyService(runtimeCryptoHelper)
```

`defineManagedSignatureRequest` creates only a pending request. It binds the
immutable manifest digest to the trusted authenticated user, registered device,
operation, signer, relying party, purpose and ML-DSA-65 actor-signing key.
Login, review, delivery, read state and a successful local user-presence
ceremony are deliberately not represented as signatures. SDK orchestration
owns authorization, one-use session consumption and proof creation.

`buildSocialPublicationManifestDigest` and
`defineSocialPublicationDemoRecord` close the bounded synthetic publication
flow. The latter accepts only public content matching the immutable SHA3-384
manifest, an already verified ML-DSA-65 managed-wallet proof, and an explicit
in-memory Fabric Demo receipt. It never represents the simulated ledger as a
real Fabric transaction or turns login and review into signatures.

## Current API

```ts
import {
  buildPublicOrganizationServiceCatalog,
  evaluateOrganizationCatalogCache,
} from 'antifraud-data-utils-ts/organization-service-catalog'
```

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
  buildDidCommInlineBinaryAttachment,
  buildDidCommLinkedBinaryAttachment,
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

The document graph and the binary transport are deliberately separate.
Antifraud documents are always Schema.org `DigitalDocument` resources whose
concrete encodings are Schema.org `MediaObject` resources; they are never FHIR
`DocumentReference` resources. `buildDidCommInlineBinaryAttachment` carries a
bounded file as DIDComm `attachments[].data.base64`, while
`buildDidCommLinkedBinaryAttachment` carries the same governed `MediaObject`
through `attachments[].data.links` plus its multibase multihash. Both forms
preserve the Internet media type and exact byte count and work for PDF,
spreadsheet, word-processing, image, video or another governed media type.
DIDComm is the delivery transport and does not replace the Schema.org business
record or become the persistence model. See
[`docs/DIDCOMM_SCHEMA_ORG_ATTACHMENTS.md`](docs/DIDCOMM_SCHEMA_ORG_ATTACHMENTS.md)
and [GitHub issue #2](https://github.com/antifraudservices/antifraud-data-utils-ts/issues/2).

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
validators, synthetic fixtures and stateless cryptographic primitives. It
contains no user interface, role policy, HTTP client, persistence adapter,
private-key custody, credential issuer, ledger connection or deployment
configuration.

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

Node.js 26.13.0 is required. See [public and contact exchange aliases](docs/PUBLIC_ALIASES.md)
for the distinction between opaque alias lists and strict contact validation.
See [public JWK thumbprints](docs/JWK_THUMBPRINTS.md) for exact public-member
hashing and URI framing without a key-possession or authority claim.

```bash
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

## License

Apache-2.0.

## Credential descriptions and wire contracts

`gaia-x` contains the credential and media-type contracts. `gaia-x-projection`
builds legal-person and service-description drafts from canonical Schema.org
claims, without Node-specific encoding. Callers retain signing, issuer trust,
status and external rules-engine verification.

`verification-contracts` defines the typed Gateway/SDK request and result shapes
for credential presentations and standard-compliance checks. These are data
contracts; only the runtime verifier can authenticate a request or return a
positive current-state decision.

### Public registry search

The `public-registry-search` leaf defines public-source projections and combined
address, municipality, postal-code, text and optional exact-identifier filters.
Identifier indexes are injected separately and never returned. Radius search
accepts reviewed latitude/longitude only, sorts by straight-line distance
before limiting and explicitly rejects sources with no reviewed coordinates.
These contracts are product-neutral and do not establish membership or an
available service.
