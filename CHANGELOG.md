# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

## 0.1.10 - 2026-10-21

- Add the Schema.org-first public organization service catalog: explicit
  Organization, department, Place and Service publication; flat claims; a DCAT
  discovery descriptor; and fail-closed cache refresh, withdrawal and rollback
  decisions. FHIR projection and scheduling remain outside this contract.

## 0.1.9 - 2026-10-19

- Add the governed qualification-classification reference so portals and BFFs
  preserve canonical system, version, concept URI and code independently from
  localized presentation labels.

## 0.1.8 - 2026-10-18

- Add the canonical synthetic social-publication manifest digest and Demo
  record. Public content must reproduce the signed SHA3-384 manifest, the
  managed-wallet proof must already be verified with ML-DSA-65, and the
  receipt remains explicitly bound to the simulated in-memory Fabric adapter.
- Add the browser-neutral CIDv1 raw SHA3-384 builder for an already-computed
  48-byte evidence digest so BFFs and services do not duplicate multicodec or
  base58btc construction.

## 0.1.7 - 2026-10-18

- Add the canonical verified managed-signature proof projection. Manifest,
  operation, signer, relying party, purpose, algorithm and verification method
  are copied from the immutable request rather than accepted from wallet output.
- Reject unverified, malformed, out-of-lifetime or authority-overriding proof
  material and harden the ciphertext-tampering test so it always changes a
  decoded byte rather than optional base64 padding bits.

## 0.1.6 - 2026-10-18

- Add the canonical managed-signature request state, local user-presence method,
  ML-DSA-65 actor-signing key and immutable manifest-binding contracts.
- Build pending requests from a browser-controlled manifest draft and separate
  trusted backend context for user, registered device, relying party, purpose,
  signer and verification method; reject browser-authored authority.
- Export one reusable synthetic signing-request fixture for SDK, gateway and
  portal journey tests.

## 0.1.5 - 2026-10-18

- Migrate the reviewed stateless `gdc-common-utils-ts` cryptography profile so
  Antifraud SDKs can share ML-KEM-768 key generation, random AES-256-GCM
  content keys, HKDF-derived per-recipient key encryption keys and the
  `gdc-mlkem-cek-wrap-v1` JWE envelope without duplicating algorithms.
- Export ML-DSA-44/65/87 byte and JWS signing/verification primitives while
  leaving all private-key custody, persistence and user-presence authorization
  to the calling managed wallet or KMS.
- Prove bidirectional JWE compatibility with `gdc-common-utils-ts@2.9.30`, PDF
  byte confidentiality, authenticated tamper rejection and ML-DSA-65 changed-
  payload rejection.

## 0.1.4 - 2026-10-18

- Add product-neutral DIDComm binary-attachment contracts for inline base64 and
  protected `links + multihash` delivery without changing the canonical
  Schema.org `DigitalDocument`/`MediaObject` business graph.
- Prove exact byte round-trip for a minimal synthetic PDF and reject empty or
  incomplete attachments. No FHIR `DocumentReference` is introduced.

## 0.1.3 - 2026-10-17

- Export one product-neutral confidential-document fixture so gateways, SDKs
  and portals reuse the same valid CIDv1 raw SHA3-384 attachment instead of
  duplicating governed wire examples.

## 0.1.2 - 2026-10-17

- Add the canonical strict JSON:API graph for Schema.org `DigitalDocument`
  manifests, component documents and their encoded `MediaObject` resources.
- Require complete CIDv1 raw SHA3-384 content identifiers under
  `PropertyValue.propertyID` and `value`, with digest matching, unique resource
  identifiers and no embedded document bytes.
- Normalize the historical `identifier.additionalType` input convention while
  emitting only canonical `identifier.propertyID`, and reject conflicting
  legacy and canonical profiles.
- Export reusable CID-to-digest validation for downstream confidential-document
  boundaries.

## 0.1.1 - 2026-10-17

- Add the canonical credential-issuance request, lifecycle, receipt wire
  conversion and synthetic fixture shared by SDK Core, SDK Node and ICA.
- Add a validated, product-neutral flat-claim projection for subject identity,
  subject relationships and age-over evidence targets.
- Publish the canonical flat-claim name that binds an evidence target to its
  verification check, so consumers do not invent product-local claim names.

### Added

- Product-neutral identity verification and attestation capabilities.
- Governed Schema.org-to-OpenID identity claim mappings.
- Conflict-safe conversion between flat claims and OIDC4IDA verified claims.
- JSON Schema 2020-12 contract for verified claims and evidence.
- Normative identity verification and attestation contract.
- Claim-to-proof bindings with multiple proof references and privacy-preserving
  age-over predicates.
- Controller-governed workforce evidence statements requiring an authenticated
  assignment, active group membership, reusable group authorization and exact
  capability, without employee-specific Consent.
- Non-authorizing invitation proposals for optional department and groups, plus
  Communication-required assignment-change notices.
- Employer attestations for employee identity and qualifications, organization
  resolution by legal identifier and jurisdiction, and multiple issuer proofs
  for one claim.
- Form-ready JSON Schema that excludes raw evidence documents and marks
  server-derived actor and authorization fields read-only.
- Home-tenant-first Clearing House selection with explicit federation trust
  for employer and index-provider sources.
- Explicit separation between EUDI PID data elements and OpenID Identity
  Assurance claim names.
- Neutral professional-qualification contracts using Schema.org flat claims,
  independent employer, issuer and professional-body proofs, derived trust
  badges and privacy-minimized ledger anchors.
- Document the DC4EU education and medical credential catalogue, including
  EUHED, Doctor ID, professional suitability, medical training, authority
  separation and draft-schema interoperability risks.
- Extend digest-bound OpenID Identity Assurance attachment references with
  negotiated SHA3-384 and validated CIDv1 raw multibase identifiers.
- Add product-neutral subject, relationship and configurable age-over evidence
  targets while reserving `age_over_18` as the EUDI PID projection.
- Add canonical Schema.org `MediaObject` flat claims and projection for
  protected evidence artifacts identified by CIDv1(raw, SHA3-384).
- Document the education administrative-assistant journey and its real local
  user-interface acceptance requirements.
