# Neutral identity and signature data contracts

`did-document` describes the key-bearing JSON-LD projection used by the engine,
with DID verification relationships and explicit public-key shapes. It follows
the [W3C DID Core vocabulary](https://www.w3.org/TR/did-core/), but is not a
schema validator, resolver, proof verifier or authorization decision.

String service endpoints and string or string-array contexts are compatibility
defaults. Generic service and context parameters let an exchange adapter model
other structured representations explicitly. Extension fields remain unknown
until a consuming adapter validates its own profile.

The cryptography entry point exports the engine's JWS signing profile based on
RFC 7515. Decoded headers require explicit algorithm and key selection; encoded
General JWS signature fields remain strings. This is a supported engine profile,
not every valid JOSE serialization. Embedded JWK import types do not enforce
public-only publication: the emitting host must validate or project the key.

These contracts contain no sector, controller policy, transport, persistence or
clinical catalog. SDK runtime layers own resolution and authenticated handling.
