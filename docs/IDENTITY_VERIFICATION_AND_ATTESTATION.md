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
identity.subject.create
identity.subject.update
identity.evidence.record
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

## Authorized workforce maintenance

The normal Antifraud actor is an authorized workforce member, not a hard-coded
occupation. An administrative employee of an education institution is one
example. Sector applications may apply the same contract to staff maintaining
an insured beneficiary, a patient or another governed subject.

The organization controller creates the operational group and governs which
employee assignments belong to it. An active Consent or equivalent governed
authorization then restricts the subject set, permitted operation, purpose,
organization, jurisdiction and validity period. All of the following are
required before the member can create or update a subject record or record
identity evidence:

1. authenticated workforce actor;
2. active employee assignment;
3. membership in the controller-governed group;
4. active applicable Consent;
5. the exact `identity.subject.create`, `identity.subject.update` or
   `identity.evidence.record` capability.

The browser submits the subject and evidence fields. It never supplies the
authoritative actor, employee assignment, group membership, Consent decision
or issuer identity. Those values come from trusted server state.

Recording evidence and issuing an attestation are separate actions. The
workforce member creates an unsigned, auditable evidence statement. The
authoritative tenant later reads the stored statement and subject record,
evaluates policy and signs the credential. The member cannot cause the tenant
to sign caller-authored claims merely by possessing form access.

Medical, nursing or veterinary staff may be granted the same neutral
capabilities by a health or animal-care product policy. Those occupations do
not belong in this shared package and authentication alone grants none of the
capabilities.

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

EUDI Person Identification Data attributes are not simply another name for
the OpenID Identity Assurance claim set. EUDI PID credentials define data
elements such as `birth_date` and the data-minimizing `age_over_18`. The OpenID
Identity Assurance projection uses registered OpenID claims such as
`birthdate` inside `verified_claims.claims`, together with separate
verification and evidence information. A governed converter may map between
them when their semantics match, but it must retain the source profile and
must not treat the two vocabularies as interchangeable.

OpenID4VCI is the issuance protocol and OpenID4VP is the presentation protocol.
Neither protocol by itself defines the meaning of every PID or Identity
Assurance claim.

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

The EUDI PID data-element name is then `age_over_18`. The proof binding contains
no birth-date value. A verifier that needs only majority status requests that
predicate rather than `birth_date`, preserving data minimization. The current
EUDI PID profile standardizes the 18-year predicate; another threshold requires
a separately governed credential profile and must not be labelled EUDI PID
merely because it follows an `age_over_NN` spelling.

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

The package also exports
`workforceIdentityEvidenceStatementJsonSchema`. Its `createdBy`, capability and
authorization fields are read-only because the server derives them from the
authenticated assignment, controller-governed group and active Consent. The
form may capture evidence observations and digest-bound attachment references;
it cannot embed a raw identity document.

The supported OpenID Identity Assurance evidence categories are `document`,
`electronic_record`, `vouch` and `electronic_signature`. A workforce member who
personally reviews evidence normally records the check and, where applicable,
a `vouch`; this does not make their statement an issuer-signed credential.

## Tenant Clearing House and source authority

A Clearing House is a capability published by a tenant, not necessarily one
central service. A tenant may act as an employer, an index provider, a verifier
or more than one of these. Its endpoint advertises the capabilities it actually
provides.

An internal application initially trusts only its home tenant. The home tenant
may select another employer or index-provider tenant only when that exact
source is present in its explicit federation trust and advertises the required
capability. Resolving an index provider identifies the authoritative source;
it does not grant access and does not authorize issuance.

The authoritative source tenant performs readback from its own record before
signing. An employer therefore attests employment data from the employer's
record; an index provider attests subject or relationship data from its index.
A verifier may validate presented evidence, but it must not impersonate the
source issuer. A separate Clearing House verification attestation has its own
issuer identity.

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
3. Missing or inactive employee assignment, workforce group or Consent is
   rejected before evidence persistence.
4. An external source tenant is rejected unless the home tenant explicitly
   trusts it for the required advertised capability.
5. The source claim remains unchanged after verification.
6. The signed attestation preserves creator, submitter, verifier, organization,
   subject and related party as distinct identities.
7. Conflicting imported values are not silently accepted.
8. Suspension, expiry and revocation fail closed.
9. Replaying the same operation identity is idempotent.
10. The result is read back through the public boundary.
11. When ledger anchoring is claimed, a real local-network transaction ID and
   status readback are retained before Test Network promotion.

Unit tests, mocked adapters, interface components and successful HTTP responses
do not by themselves prove this journey.
