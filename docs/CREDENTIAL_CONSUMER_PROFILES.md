# Neutral credential and presentation consumer profiles

The `credential-contracts` subpath supplies data contracts shared by current
credential, registration and presentation consumers across sectors. It does not
issue, decode, authenticate or verify a credential. A populated `issuer`, `proof`
or presentation field does not establish a signature, trusted issuer, replay
binding, recipient or authorization decision.

`W3cCredentialContexts` contains the existing V1 and V2 context identities.
`W3cCredentialTypes` contains the base credential and presentation type names.
`VC_CONTEXT_V2` aliases the V2 context. Existing organization credential builders
reuse these constants without changing their serialized values.

`VerifiableCredentialV2<Subject, Evidence>` preserves the current supported
consumer profile: an array of context strings, an array of type strings, one
object subject, a string issuer and required `validFrom`. ID, expiry, proof and
evidence remain optional. These are application constraints; the type is not a
claim to cover every W3C credential form. A consumer with a known education or
other sector subject can supply that object interface directly. Default subject
and evidence values remain unvalidated `unknown` data that callers must narrow.

`CredentialProof` projects the current required proof type and optional created,
JWS, purpose and verification-method fields, with unknown extension members.
The Gateway may retain its historical `ProofEBSIv2` spelling as a local type
alias; this does not claim EBSI compliance or a verified proof. The existing
`ReviewedOrganizationCredential` remains a separate readonly organization
projection with required ID and expiry and JSON-shaped proof/evidence. Its
different constraints are preserved rather than forced into an incompatible
universal alias.

`VpCredentialInput` represents a credential string or an unvalidated decoded
object. `VpTokenPayload` is the supported decoded JWT presentation profile: a
required issuer and a `vp` object containing credential inputs, plus supported
optional token/holder metadata. It is distinct from both an encoded JWT string
and the complete native W3C presentation data model. `VpTokenHeader` reuses the
compatible JOSE header field types while keeping key ID optional. A declared
algorithm string is not cryptographic algorithm validation.

## Existing consumers and validation boundary

Current consumers are the Gateway credential manager, tenant/organization
configuration, host activation/reconciliation and credential data fixtures in
<https://github.com/soschain/sos-gw-node-ts>. The original compatibility source is
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the reviewed
[credential data profile](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/models/verifiable-credential.ts)
and [JWT-presentation data](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/utils/vp-token.ts).
Those links identify source evidence, not runtime dependencies. The broader
standard is the official [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model-2.0/).

Public fixtures exercise typed sector subjects and reject missing required
profile fields, a subject array, missing proof type, unknown typed subject fields
and assigning decoded presentation data to an encoded token string. This is
compile-time contract evidence. Existing cryptography and identity tests verify
their own behavior; complete credential verification, service policy and real
sector journeys require their separate owning-service tests.
