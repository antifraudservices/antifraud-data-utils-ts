# Identity Verification and Attestation Contract

## Purpose

This document defines a product-neutral foundation for verifying identity data
and issuing attestations about subjects, individual claims and relationships.
It is the normative companion to implementation prompts: a prompt states that
this contract must be reused, while this document owns the precise data and
acceptance rules.

## Required semantic separation

An asserted claim, its verification and an attestation are different records.

- An asserted claim is the value supplied by or for a subject.
- Verification describes how evidence was assessed.
- An attestation is the signed, versioned result issued by an authorized actor.

Verification must never replace the original author or silently overwrite an
asserted value. A correction creates a new version and preserves the previous
statement and audit history.

Subject identity, a relationship to the subject and authority over the subject
are also separate facts. Attesting a relationship does not appoint a
controller and does not grant access to unrelated data.

## Capabilities

The neutral capability vocabulary is:

```text
identity.claim.verify
identity.subject.attest
identity.relationship.attest
```

Capabilities are authorization inputs, not occupations, roles or flat claims.
A downstream policy maps its governed workforce credentials to one of these
capabilities and constrains it by subject, target claim or relationship,
purpose, jurisdiction, organization, evidence class, audience and expiry.

Authentication alone never grants a capability. A complete decision can
require authenticated actor identity, active organization delegation, subject
authorization and current policy at the same time.

## Canonical data and exchange projection

Canonical business values use governed Schema.org flat claims. The initial
person mapping is:

```text
org.schema.Person.name        <-> name
org.schema.Person.givenName   <-> given_name
org.schema.Person.familyName  <-> family_name
org.schema.Person.birthDate   <-> birthdate
org.schema.Person.gender      <-> gender
org.schema.Person.email       <-> email
org.schema.Person.telephone   <-> phone_number
```

The right-hand values are registered OpenID Connect claim names used inside
`verified_claims.claims`. `verified_claims.verification` remains separate and
contains the assurance and evidence metadata.

Relationship claims require an explicit governed mapping before exchange.
The converter must not invent a lossy OpenID name or flatten an identifier in a
way that removes the subject, related party or relationship type. Until such a
mapping is registered, export fails closed.

## Conversion rules

`projectSchemaOrgFlatClaimsToOidc4Ida`:

- accepts only governed mappings;
- emits both `claims` and `verification`;
- rejects unknown flat claims;
- does not mutate its input;
- does not introduce evidence or assurance values.

`importOidc4IdaToSchemaOrgFlatClaims`:

- imports only governed mappings;
- returns unknown OpenID claims in `unmappedClaims`;
- returns contradictions in `conflicts`;
- never overwrites an existing flat claim;
- returns verification metadata separately from canonical claims.

Conversion is therefore intentionally not a blind serialization round trip.
The caller must resolve contradictions and decide whether to create a new
assertion, correction or attestation.

## Claim proof bindings and selective disclosure

A canonical claim value and the cryptographic material that supports it are
different records. `ClaimProofBinding` links either one governed claim path or
one derived predicate to one or more `ClaimProofReference` objects. This is how
the same claim can be supported by several credentials, registers or signed
evidence sources without duplicating or overwriting the canonical value.

The reference records the proof format, issuer, credential reference,
cryptographic binding, status and optional verification method, validity and
disclosure digest. It never embeds a raw wallet presentation, SD-JWT
Disclosure, identity document or signing key in the flat claim.

For an SD-JWT Verifiable Credential, “proof for a claim” does not mean a
separate digital signature for every field. The issuer signs an SD-JWT whose
payload commits to selectively disclosable claims through digests. A
Disclosure reveals a selected claim and is validated against the signed
digest. A presentation may additionally use a Key Binding JWT to prove holder
control. One proof reference therefore points to the signed credential and may
identify the applicable disclosure digest; it does not copy the Disclosure.

ISO/IEC 18013-5 mdoc issuer-signed data elements, W3C Verifiable Credential
proofs, OpenID Identity Assurance verification results and separately signed
evidence use different cryptographic bindings. They must retain distinct
formats instead of being labelled generically as SD-JWT.

Age checks are derived predicates, not aliases for date of birth. To prove
that a person is over a threshold, use a predicate target with:

```text
predicate: age-over
sourceClaimPath: org.schema.Person.birthDate
threshold: 18
result: true
```

The EUDI PID transport name is then `age_over_18`. The proof binding contains
no birth-date value. A verifier that needs only majority status requests that
predicate rather than `birth_date`, preserving data minimization. Other
thresholds use `age_over_NN` only when the credential type and issuer policy
support them.

Normative references:

- [SD-JWT-based Verifiable Digital Credentials](https://datatracker.ietf.org/doc/draft-ietf-oauth-sd-jwt-vc/)
- [OpenID for Verifiable Presentations 1.0](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html)
- [EUDI PID Rulebook](https://eu-digital-identity-wallet.github.io/eudi-doc-architecture-and-reference-framework/latest/annexes/annex-06-pid-rulebook/)

## JSON Schema and forms

The package exports the JSON Schema 2020-12 object
`verifiedClaimsJsonSchema`. It requires `claims` and `verification`, and
requires at least one evidence object.

The schema validates data; it does not authorize an operation. A form renderer
may consume it, but browser state must never decide that evidence is verified.
The host submits the governed request and displays only authoritative readback.

## Signing, persistence and ledger boundary

This data package performs none of these operations. A downstream runtime:

1. authenticates the actor and evaluates the exact capability;
2. verifies evidence through a trusted verifier;
3. creates and signs the attestation;
4. persists confidential claims and evidence references;
5. optionally anchors a privacy-minimized projection on a ledger;
6. returns authoritative status through the public boundary.

The ledger projection may contain an attestation or credential identifier,
content hash, issuer, protected subject reference, type, status, timestamps and
evidence hashes or references. It must not contain raw documents, names,
contacts, exact identity values or private demographics.

## Completion criteria for a downstream implementation

A downstream implementation is not complete until automated tests prove:

1. An actor without the exact capability is rejected.
2. Scope mismatches for subject, claim, relationship, purpose or jurisdiction
   are rejected.
3. The source claim remains unchanged after verification.
4. The signed attestation preserves creator, submitter, verifier, organization,
   subject and related party as distinct identities.
5. Conflicting imported values are not silently accepted.
6. Suspension, expiry and revocation fail closed.
7. Replaying the same operation identity is idempotent.
8. The result is read back through the public boundary.
9. When ledger anchoring is claimed, a real local-network transaction ID and
   status readback are retained before Test Network promotion.

Unit tests, mocked adapters, interface components and successful HTTP responses
do not by themselves prove this journey.
