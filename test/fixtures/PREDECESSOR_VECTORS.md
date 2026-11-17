# Recorded predecessor vectors

`predecessor-vectors.json` contains non-operational synthetic inputs and actual
outputs recorded outside this package from the predecessor's installed 2.9.30
modules. Each module records its full immutable GitHub source URL, source SHA-256
and the emitted JavaScript SHA-256 that was executed. No predecessor module is
imported by this package's tests.

The cryptography fixture records the actual key-generation/CEK/KEM randomness
and AES IVs. The predecessor uses Node AES IV generation directly; those IVs
were recovered from its actual public envelope fields, not simulated. Tests
replay these non-operational bytes through the real owned implementation.

During capture, each implementation decrypted the other's actual envelope.
Changed ciphertext and changed owner-binding AAD were rejected by both. The
protected header, IV, ciphertext, tag and decoded wrapped key agree. The two
existing serializers order wrapped-key JSON members differently, so their
complete compact strings differ. The fixture preserves both strings and does
not claim full compact serialization equality.

Retain the original synthetic round-trip, ML-DSA changed-message, invalid-key,
single-recipient, wrong-contact and credential-marker tests. Recorded outputs
preserve historical compatibility; they do not establish deployment authority,
contact ownership or credential verification.
