# Identity Verification and Attestation Contract

This is a core Antifraud trust contract. A system can rely on an identity or
qualification only when it can preserve who asserted it, the actor's authority
and jurisdiction, the evidence examined, the time, the proof, and the current
status without substituting one issuer for another.

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

The organization controller creates the operational group, governs which
employee assignments belong to it and configures one reusable authorization
for the group. That group authorization restricts the permitted operation,
purpose, organization, jurisdiction and validity period. It may be represented
by a Consent where that standard and profile apply, or by another governed
policy record. It is not duplicated for every employee.

All of the following are required before the member can create or update a
subject record or record identity evidence:

1. authenticated workforce actor;
2. active employee assignment;
3. membership in the controller-governed group;
4. active authorization for that exact group;
5. the exact `identity.subject.create`, `identity.subject.update` or
   `identity.evidence.record` capability.

The browser submits the subject and evidence fields. It never supplies the
authoritative actor, employee assignment, group membership, group authorization
or issuer identity. Those values come from trusted server state.

The employee has no individual Consent merely because they joined a group.
Removing the employee deactivates or removes only their group membership; the
group authorization remains usable by the other active members. A subject,
student, patient, beneficiary or lawful representative may have a separate
authorization governing operations on that subject. That authorization is
evaluated independently and must never be confused with workforce membership.

### Invitation, department and group changes

When a controller creates and invites an employee, the invitation may propose
an optional department and zero or more professional groups. These are pending
assignments and grant no capability until the employee accepts the invitation,
activates the professional assignment and the authoritative backend persists
the memberships.

The invitation identifies the proposed organization, role, department and
groups in understandable language. Acceptance produces a Communication notice.
Later additions or removals of groups, department transfers, suspensions and
reactivations also produce a Communication containing the change, controller
reference and effective time. A notification records the change; it is not an
authorization and does not create a Consent.

Recording evidence and issuing an attestation are separate actions. The
workforce member creates an unsigned, auditable evidence statement. The
authoritative tenant later reads the stored statement and subject record,
evaluates policy and signs the credential. The member cannot cause the tenant
to sign caller-authored claims merely by possessing form access.

Education occupations do not determine authority inside this shared package.
The controller-governed assignment and exact capabilities do; authentication
or a job title alone grants none of them.

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
authenticated assignment, active group membership and reusable group
authorization. An optional subject-authorization reference is separate. The
form may capture evidence observations and digest-bound attachment references;
it cannot embed a raw identity document.

The supported OpenID Identity Assurance evidence categories are `document`,
`electronic_record`, `vouch` and `electronic_signature`. A workforce member who
personally reviews evidence normally records the check and, where applicable,
a `vouch`; this does not make their statement an issuer-signed credential.

Scanned PDF, PNG, JPEG and TIFF evidence is represented canonically as a
Schema.org `MediaObject`. Its flat claims retain the protected `contentUrl`,
`encodingFormat`, `contentSize`, and a CIDv1(raw, SHA3-384) identifier in
multibase base58btc form. An OpenID Identity Assurance export projects the same
artifact into its external-attachment structure with a protected URL and a
negotiated base64 digest. The CID is an integrity and retrieval reference; it
is not proof that the claimed qualification issuer created or validated the
document.

### Employee identity and qualification evidence

A controller or human-resources employee may record evidence about an
employee's identity or qualifications only through an active group whose
authorization contains the exact evidence capability. The actor records what
was examined and may add a separately signed `vouch` or
`electronic_signature`.

An awarding university, licensing body or other organization is identified by
the exact pair of legal identifier and jurisdiction. A display name is not an
authority key. A trusted backend resolves that pair through the configured
authoritative organization directory and retains the resolved organization
reference in the evidence trail.

When no credential issued by the awarding organization is available, the
employer may attest only that it reviewed specified evidence and reached a
stated conclusion. The issuer and signature remain those of the employer; the
attestation must not claim that the university signed or confirmed it. If the
awarding organization later supplies its own credential or confirmation, add
that issuer proof to the claim's proof binding. Do not delete the employer
proof. `ClaimProofBinding` supports several credential-level proof references
for one claim, so provenance remains distinguishable.

In health and other regulated sectors, keep identity evidence, qualification
evidence, professional licence status, employment assignment, group
authorization, and subject authorization as independent gates. A signed
employer attestation about a diploma does not prove that the university issued
it and does not prove that a professional licence is active. Suspension,
revocation, expiry, jurisdiction mismatch, or issuer mismatch must fail closed
for the operation that depends on that fact.

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
3. Missing or inactive employee assignment, group membership or reusable group
   authorization is rejected before evidence persistence.
4. An external source tenant is rejected unless the home tenant explicitly
   trusts it for the required advertised capability.
5. Adding or removing one employee never creates, replaces or disables the
   shared authorization for the other group members.
6. A required subject authorization is evaluated separately from group
   membership.
7. The source claim remains unchanged after verification.
8. The signed attestation preserves creator, submitter, verifier, organization,
   subject and related party as distinct identities.
9. Conflicting imported values are not silently accepted.
10. Suspension, expiry and revocation fail closed.
11. Replaying the same operation identity is idempotent.
12. Invitation acceptance and later assignment changes produce Communication
    notices without creating employee-specific Consents.
13. An organization mentioned as the source of a qualification is resolved by
    legal identifier and jurisdiction, and an employer-only attestation is not
    mislabeled as a source-issued credential.
14. Employer and later source-issuer proofs can coexist without overwriting
    each other.
15. The result is read back through the public boundary.
16. When ledger anchoring is claimed, a real local-network transaction ID and
   status readback are retained before Test Network promotion.

Unit tests, mocked adapters, interface components and successful HTTP responses
do not by themselves prove this journey.
