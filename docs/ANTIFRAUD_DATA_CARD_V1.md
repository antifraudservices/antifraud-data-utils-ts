# Antifraud Data Card v1

Status: executable draft. This document defines the public contract implemented
by `antifraud-data-utils-ts`; it should move unchanged to a future
`antifraud-specifications` repository when that repository exists.

## Scope

Antifraud Data Card (ADC) is a non-health compact Verifiable Credential transport.
It is not SMART Health Cards and is not HL7 Structured Data Capture.

- QR values use the collision-resistant project prefix `afdc:/`.
- `vc.type` starts with
  `urn:antifraudservices:credential:antifraud-data-card:v1`.
- `vc.credentialSubject.jsonApiDocument` is exactly one canonical JSON:API
  primary document whose resources use Schema.org types and attributes.
- `fhirVersion` and `fhirBundle` are forbidden by the model.
- The compact JWS protected header uses `alg: ES256`, `zip: DEF` and an issuer
  key identifier. Signing is performed by an authorized KMS/SDK, not data-utils.
- The payload is canonical JSON encoded as UTF-8 and raw-DEFLATE compressed
  before base64url encoding.

## QR transport

The compact JWS uses the decimal-pair encoding familiar from SHC, but the
namespace is distinct. A single symbol is `afdc:/<digits>`. Multi-symbol values
are `afdc:/<one-based-index>/<count>/<digits>` and must reject duplicates,
missing chunks or conflicting counts.

## Post-quantum companion proof

An optional ML-DSA proof signs the exact external payload bytes as an RFC 7797
detached JWS (`b64=false`, with `b64` critical). It travels independently under
`pqc:/`; it never duplicates or changes the ADC payload. Key custody, signature
creation, verification, issuer trust, status and authorization belong to the
trusted SDK/KMS boundary.

## Security and authority

Possession or successful decoding grants no access or authority. A verifier
must validate the issuer, key purpose, signature, subject binding, audience or
purpose policy, validity/status and every governed Schema.org claim. Links and
attachments remain protected references resolved by their authoritative host.

The executable conformance vectors are
`test/antifraud-data-card.test.mjs` and
`test/post-quantum-detached-qr.test.mjs`.
