# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

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
