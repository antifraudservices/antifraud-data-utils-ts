# Education Administrative Assistant Identity-Evidence Journey

This document defines the product-neutral Antifraud contract used when an
education organization authorizes an administrative assistant to record
identity evidence. It is an acceptance contract, not evidence that a portal,
gateway or credential issuer is deployed.

The public Antifraud controller portal is separate from sector role portals.
The controller configures departments, invitations, employee groups and their
reusable authorizations there. The administrative assistant will perform the
student evidence journey in the planned `qualification-education` role portal.
That role portal is currently a public scaffold and must not be described as
implemented.

## Authority established by the controller

The organization controller creates a workforce group for the administrative
task and gives that group only the capabilities needed for the journey. The
administrative assistant gains eligibility through an active employee
assignment, active membership in that exact group and the group's active
authorization. The employee does not receive a separate Consent merely by
joining the group.

The browser never chooses the actor, employer, assignment, controller or group
authorization. The trusted service derives them from the authenticated
session and reads them back before accepting evidence. If the use case requires
authorization from the student, parent, guardian or another lawful
representative, that authorization is a separate gate.

## What the administrative assistant may do

An authorized administrative assistant may:

1. create or update the permitted subject record;
2. record evidence examined for that subject;
3. attest a relationship, such as a lawful representative acting for a minor;
4. record a derived age-over result when access to the source birth-date claim
   and the intended purpose are authorized; and
5. submit qualification evidence reviewed by the employer without claiming
   that the employer is the awarding university.

The assistant cannot grant their own capability, select a different employer,
sign as a university, convert an employer observation into an issuer
credential or infer professional authority from a qualification scan.

## Canonical data and exchange projections

Canonical business data uses governed Schema.org flat claims. A qualification
uses `EducationalOccupationalCredential`. A scanned PDF, PNG, JPEG or TIFF is
represented as its `MediaObject` encoding with a protected `contentUrl`, media
type, size and a CIDv1(raw, SHA3-384) identifier. The exact file remains in
confidential storage.

OpenID Identity Assurance is an exchange projection describing the verified
claims, evidence and checks. EUDI Person Identification Data, education
credentials and Open Badges are separate target profiles. Each adapter maps
only the claims defined by that profile; it must report unsupported claims and
must not silently overwrite an existing assertion.

`age_over_18` is the standardized EUDI Person Identification Data element.
Thresholds such as 19, 21 or 65 remain explicit governed predicates and must
not be labelled as EUDI Person Identification Data attributes.

## Required local user-interface proof

The local automated journey must use the real portal, backend for frontend,
high-level SDK and gateway boundary. It must prove authoritative persistence by
reading the resulting statement back after submission. A component test,
fixture screen, mocked route, screenshot or successful HTTP status is not this
proof.

The positive journey is:

1. a controller creates the group and its reusable authorization;
2. the controller assigns the administrative assistant to the group;
3. the employee signs in and records subject identity evidence;
4. the employee records any permitted representative relationship;
5. the employee records an authorized age-over result without exposing the
   source birth date unnecessarily; and
6. the employee sees the authoritative readback with actor, organization,
   group authorization, evidence, time, status and proof references.

Negative journeys must cover an inactive employee, inactive or mismatched
membership, missing capability, missing required subject authorization,
cross-tenant subject access, caller-authored actor fields, invalid evidence
digest or CID, and conflicting claims.

The contract deliberately uses opaque subject references, but this document
defines only the education journey. Product-specific reuse belongs in the
documentation of the consuming product.
