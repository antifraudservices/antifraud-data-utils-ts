---
name: preserve-authoritative-identity-evidence
description: Preserve product-neutral workforce authorization, tenant source trust, identity evidence, EUDI PID and OpenID Identity Assurance boundaries. Use when implementing subject maintenance, evidence recording, claim verification, attestation issuance or Clearing House federation.
---

# Preserve Authoritative Identity Evidence

## Required boundaries

- Treat the tenant as the Clearing House service boundary. A tenant may
  advertise employer, index-provider or verifier capabilities.
- Trust the application's home tenant by default. Contact another source only
  after explicit home-tenant federation trust and capability matching.
- The source tenant reads its authoritative record before signing. Never sign
  claims supplied by a browser, backend for frontend or requesting tenant.
- Keep evidence recording, verification and signed issuance as separate
  operations and audit identities.

## Workforce authorization

An employee may create or update a governed subject or record identity evidence
only when trusted runtime state proves all of these:

1. authenticated actor and active employee assignment;
2. membership in a controller-created operational group;
3. active applicable Consent;
4. the exact capability and matching subject, operation, purpose,
   organization, jurisdiction and time scope.

Use `identity.subject.create`, `identity.subject.update` and
`identity.evidence.record`. Do not infer them from an occupation or login.
Education administrators, insurance staff and health staff are downstream
policy examples, not shared vocabulary. Medical, nursing and veterinary
products may map governed roles to the same capabilities.

The client form supplies evidence observations only. Derive actor, assignment,
organization, group, Consent and issuer from trusted server state. Store raw
identity documents outside the statement; include only governed references and
digests.

## Claims and evidence

- Reuse Schema.org flat claims as canonical business values.
- Keep OpenID Identity Assurance `verified_claims.claims`, `verification` and
  `evidence` separate.
- Use its registered evidence categories: `document`, `electronic_record`,
  `vouch` and `electronic_signature`.
- Keep EUDI PID elements distinct from OpenID Identity Assurance names:
  `birth_date` and `age_over_18` are PID elements; `birthdate` is the registered
  OpenID claim used by the current projection.
- Model `age_over_18` as a derived claim backed by proof without disclosing the
  source birth date.
- OpenID4VCI issues credentials and OpenID4VP presents them; neither protocol
  replaces the semantic claim profile.

## Owning contract

Before changing consumers, read
[`docs/IDENTITY_VERIFICATION_AND_ATTESTATION.md`](../../../docs/IDENTITY_VERIFICATION_AND_ATTESTATION.md)
and reuse the exports from `src/identity-assurance`. Add missing neutral types
and executable tests here first. Consumers must wait for an immutable package
release instead of copying constants or using a local dependency.

Tests must prove fail-closed behavior for missing capability, group, Consent,
source capability and federation trust. Mock-only proof does not establish an
issued credential or ledger anchor.
