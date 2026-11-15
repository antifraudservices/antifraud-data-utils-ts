# Public and contact exchange aliases

`antifraud-data-utils-ts/public-aliases` owns three data operations:

| Operation | Profile |
| --- | --- |
| `normalizePublicAliasList` | Trim and deduplicate opaque CSV/array aliases in their original order. Preserve bare CIDs, DIDs and URNs without hashing or reinterpreting them. |
| `normalizeControllerAlias` | Preserve opaque aliases and normalize the established multibase-URN/email exchange profile. |
| `normalizeTelephoneAlias` | Preserve already-hashed aliases or hash the formatted telephone exchange profile. |

The exchange operations retain SHA3-256 multihash bytes. They share an internal
encoder with `buildStableActorIdentifier`; their input normalization remains
separate from strict `normalizeActorContact` validation. The telephone exchange
profile does not validate E.164. The email exchange profile retains a `mailto:`
prefix in the hashed input, while strict contact normalization removes it.
Existing multibase envelope recognition is syntactic and does not verify a digest.

Unsupported non-string objects are not coerced. Array inputs use only their own
string data entries; accessors, non-string entries and inherited entries do not
become aliases. This is an ordinary data-array boundary, not a sandbox for Proxy
traps. These input checks harden unsupported JavaScript inputs while retaining
the supported string/CSV/array wire profiles.

None of these functions proves contact possession, verifies a credential or
grants authority. An opaque alias list is also not a privacy filter: callers
remain responsible for deciding which values may be published.

Read-only wire-profile reference:
[original alias utilities](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/same-as.ts).
There is no runtime dependency on that repository.
