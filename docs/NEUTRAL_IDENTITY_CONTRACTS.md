# Neutral identity and registration contracts

Antifraud owns the reusable person, organization, action, place and service flat
claim vocabularies in `schema-org-claims`. These describe identity and catalog
data for education, administrative work and other sectors. They contain no
healthcare role selection, licence entitlement, clinical policy or portal code.
The flat keys are an application wire profile using Schema.org vocabulary;
they are not a declaration that Schema.org publishes these reverse-DNS keys.

`organization-service-catalog` re-exports the same organization, place and service
objects. Its existing `Organization.Identifier`, `Place.Identifier` and
`Service.Identifier` keys still address `identifier.value`. In the expanded
organization and service vocabularies, `IdentifierReference` addresses the
containing `identifier`; `IdentifierValue` is an explicit alias for the existing
value key. Consumers must select the required field explicitly. Changing an
import must not change stored claims, searches, proofs or signed payloads.

`SchemaOrgPersonClaim` retains the identity-assurance mapper's seven existing
person fields and adds the occupation, identity and organization-membership
fields already required by shared onboarding and employee consumers.
`SchemaOrgActionClaim` records the agent, participant, provider and start time of
an action. A field claiming an actor or credential material never establishes
that actor's authority. Verified sessions and proofs remain caller concerns.

## Registration and token data

The `openid-contracts` subpath exports data types only:

| Contract | Existing consumer need | Boundary |
| --- | --- | --- |
| `JwtRegisteredClaims` | Registered issuer, subject, audience, time and token identifiers | Optional registered members; no token validation |
| `ClientAccessTokenClaims` | Authorization managers require a client ID, scope, issuer, subject, single audience and issued/expiry times | A constrained application profile, not every OAuth access token |
| `OidcClientRegistrationRequest` | Device registration receives redirect URIs, application/software metadata, authentication method, grants and JWK metadata | The metadata subset currently supported by consumers, not every registered OIDC field or authentication method |
| `OidcClientRegistrationResponse` | Registration returns a client ID and optional issuance/secret/management metadata | Metadata only; issuance time remains optional in this neutral subset |
| `RegisteredDeviceInfo` | Registration distinguishes stable device identity from optional push delivery metadata | Application extension data, not standard OIDC metadata |
| `DeviceClientRegistrationRequest` | Existing device admission carries `ext_device_info` | Explicit extension of the neutral metadata subset |
| `DeviceClientRegistrationResponse` | Existing device admission always returns client issuance time | Constrained application response profile |

The existing source consumers are `DeviceRegistrationManager`,
`IAuthorizationManager`, `SmartAuthorizationManager` and `FhirController` in
<https://github.com/soschain/sos-gw-node-ts>. The flat claim consumers include
shared onboarding in <https://github.com/soschain/sos-data-utils-ts> and the
existing Antifraud public organization catalog. Original compatibility source:
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the reviewed
[flat claim catalog](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/constants/schemaorg.ts),
[device registration data](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/models/openid-device.ts)
and [access-token application profile](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/models/auth.ts).
These links identify source evidence and add no runtime dependency.

Standards references are [OpenID Connect Dynamic Client Registration](https://openid.net/specs/openid-connect-registration-1_0.html),
[OAuth client metadata](https://www.rfc-editor.org/rfc/rfc7591.html#section-2)
and [JWT registered claims](https://www.rfc-editor.org/rfc/rfc7519.html#section-4.1).
TypeScript does not enforce these protocols at runtime. JSON decoding, assigning
a type, accepting JWK import data or receiving device metadata does not verify a
signature, establish trust, enforce replay protection or grant a licence.

## Commerce data used by existing consumers

`SchemaOrgOfferClaim`, `SchemaOrgOrderClaim` and
`SchemaOrgIndividualProductClaim` contain the generic flat fields already read
by `HostingOfferOrderService`, `process-order-entry`, `payment-confirmation`,
`FamilyManager`, `license-search` and related hosting handlers in the Gateway
source linked above. These fields include offer quantity and price, accepted
offer references, order confirmation/payment references and product serials.
They preserve the exact existing indexed wire identities. Host-specific pricing,
payment verification, role entitlements, device limits and licence decisions
remain outside these neutral vocabularies. A product category or serial is data,
not authorization. No unused SoftwareApplication vocabulary is added merely to
reproduce a larger historical catalog.

## Validation

Public consumer fixtures compile the positive shapes and reject missing client
scope, missing device identity, string numeric dates, unknown claim keys and a
device extension accidentally placed in the standard metadata subset. Runtime
tests preserve the distinction between identifier references and values, the
existing public-catalog exports and identity-assurance mapping keys. Existing
catalog and cryptography tests continue to validate their own behavior. These
checks do not claim complete OpenID conformance or an education service journey.
