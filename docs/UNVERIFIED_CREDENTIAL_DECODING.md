# Unverified credential and presentation parsing

The `credential-decoding` subpath provides two product-neutral parsing
helpers: `decodeUnverifiedJsonOrJwtObject(input)` and
`extractUnverifiedPresentationCredentials(input)`. They read data, not trust.
Neither helper verifies JOSE headers, signatures, issuers, recipients, validity
periods, nonces, role types or any authorization policy. They do not replace the
cryptography engine's JWS/JWE processing or an application's token verifier.

## Supported input and raw-object boundary

The object decoder accepts a raw JSON object string, a three-part compact input
with a nonempty base64url JSON object payload, or an already decoded plain data
object. Compact inputs preserve the current parser's payload-only behavior:
their header and signature segments are not validated. Payload bytes use the
existing `Content` strict base64url decoding and fatal UTF-8 conversion.

Already decoded containers must have the ordinary object prototype or a null
prototype and only own string-keyed data properties. Own accessors, inherited
containers, arrays and class instances are excluded. The parser reads property
descriptors rather than calling conversion functions or property getters. It
returns a shallow copy of enumerable own data fields; nested values remain
opaque, unvalidated values. This is deliberately not a recursive JSON validator
or arbitrary JavaScript-object sandbox. Hostile Proxy reflection traps cannot
be guaranteed inert by a portable JavaScript helper; reflection errors are
handled as invalid input. Input strings and bytes are the preferred boundary.

The presentation collector reads only an own `vp` data container and an own
`verifiableCredential` array. It reads own array data entries through descriptors,
without using a caller-provided iterator or invoking array-entry getters.
Candidates can be plain decoded objects, raw JSON object strings or compact
credential payloads. Malformed candidates are omitted in their existing order.
There is no credential-type selection or profile admission policy in this layer.

Malformed input returns `undefined` from the object decoder or an empty array
from the collector. A valid empty JSON object can be parsed as data; it does not
become a valid credential or a successful authentication result. Public return
types retain unknown field values so callers must validate a selected schema.

## Compatibility and hardening

Current source consumers include `individual-controller-smart` and duplicated
activation parsing helpers in <https://github.com/soschain/sos-gw-node-ts>.
Original compatibility source:
<https://github.com/Global-DataCare/gdc-common-utils-ts>, specifically the reviewed
[presentation parsing helpers](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/utils/vp-token.ts).
Existing consumer wrappers may retain their old public spelling while importing
the explicitly unverified neutral implementation. Controller/representative
credential selection and activation policy remain in their owning product or
service; they do not become generic cryptographic verification.

Valid serialized object payloads preserve their data and order. The new boundary
explicitly rejects non-object JSON, invalid base64url/UTF-8, inherited fields,
nonplain containers and accessor/coercion-dependent objects that the older
permissive helpers could accept. It does not mutate a source object or assign
prototype keys through a prototype setter. Its own-container checks do not
validate nested subject values; callers must not infer recursive safety.

Tests cover exact Unicode data, supported input forms, mixed credential arrays,
malformed/scalar encodings, object/prototype/accessor boundaries, own array entries,
prototype-key preservation and unchanged unverified results under altered header
or signature segments. Those last cases prove the limit of parsing, not a
cryptographic success result.
