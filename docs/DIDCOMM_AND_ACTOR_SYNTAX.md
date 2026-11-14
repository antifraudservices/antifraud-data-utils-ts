# Plaintext DIDComm data and actor identifier syntax

`didcomm-contracts` exports the supported `DidCommPayload<Body>` plaintext
projection and `DidCommAttachment` attachment profile. These are neutral data
contracts for education and other sectors, independent of a business resource
type, SDK transport, persistence model, professional role or clinical policy.

The envelope retains the current consumer requirement for `id`, protocol `type`
and an object `body`; optional fields cover sender/recipients, parent/thread
identifiers, created/expiry times and attachments. A typed object interface can
serve as the body without adding an index signature. Arrays and primitive types
are rejected by the supported body profile. These compile-time checks do not
replace runtime JSON validation. A protocol `type` is not a business resource's
type or a FHIR `resourceType`.

The attachment profile requires `id`, `media_type` and `data`, preserving existing
consumers. Requiring those metadata members is a consumer constraint, not a
claim that every DIDComm attachment must have them. It accepts the existing
immutable inline/linked binary attachment builders directly, including readonly
link arrays, byte counts and linked hashes. Optional inline JSON uses the owned
`JsonValue` shape. The projection does not enforce every standard attachment
combination, content encoding or hash rule. Callers validate their selected
transport and content profile before processing attachments.

`DIDCOMM_PLAINTEXT_JSON_MEDIA_TYPE` identifies plaintext data. It grants no
confidentiality, authenticity or authorization. Default HTTP Accept negotiation
is caller policy and is not defined here. Reading or assigning a plaintext
envelope does not verify a signer, sender, recipient, replay binding or issuer.

Original compatibility source:
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the reviewed
[communication data](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/models/comm.ts).
The [DIDComm specification](https://identity.foundation/didcomm-messaging/spec/v2.1/)
describes a broader protocol. This implementation is the explicitly supported
consumer projection, not a claim to implement or validate every feature.

## Stable actor syntax

`isStableActorIdentifier(value)` returns a boolean for a primitive string whose
trimmed value has the existing `urn:multibase:z` prefix followed by one or more
base58btc alphabet characters. Short strings such as `urn:multibase:z1` retain
their historical syntactic result. The helper does not decode a multihash,
validate its digest algorithm or length, prove contact possession or establish
actor identity. Use the actual authenticated identity and proof checks for that.

Objects are rejected without reading conversion hooks, including inherited
`toString` and `Symbol.toPrimitive` getters. This deliberately hardens the old
coercion behavior while preserving primitive string compatibility. The result
is boolean rather than a type predicate, so an invalid known string does not
become an impossible type in its false branch. Original source evidence is the
reviewed [actor identifier helper](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/utils/actor-identifier.ts).
