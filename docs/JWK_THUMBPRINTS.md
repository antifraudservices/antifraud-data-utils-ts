# Public JWK thumbprints

`antifraud-data-utils-ts/jwk-thumbprints` exports a synchronous SHA-256
public-member thumbprint and its RFC9278 URI representation. EC uses
`crv,kty,x,y`; RSA uses `e,kty,n`; OKP uses `crv,kty,x`. The existing AKP profile
uses `alg,kty,pub`; this is an explicit extension, not a claim that the original
RFC7638 standardized post-quantum keys.

The exact selected fields are JSON encoded in lexicographic order. Extra
metadata, including `kid`, is ignored. Required fields must be nonempty strings;
the operation does not validate curve points, verify key possession, authorize
an actor, or make arbitrary input safe to publish. It returns only an identifier
and does not return the input key or any private fields.

The existing cryptography service's generated-key identifiers remain unchanged.

Read-only historical wire reference:
[original thumbprint helper](https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/jwk-thumbprint.ts).
This package has no runtime dependency on that source.
