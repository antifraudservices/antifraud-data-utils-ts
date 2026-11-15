import {computeRfc7638JwkThumbprint, toJwkThumbprintSha256Urn} from 'antifraud-data-utils-ts/jwk-thumbprints'
import type {PublicJwk} from 'antifraud-data-utils-ts/cryptography'
export function identify(publicJwk: PublicJwk): readonly [string, string] {
  return [computeRfc7638JwkThumbprint(publicJwk), toJwkThumbprintSha256Urn(publicJwk)]
}
// @ts-expect-error A thumbprint is an encoded string, not raw bytes.
const bytes: Uint8Array = computeRfc7638JwkThumbprint({kty: 'EC', crv: 'P-384', x: 'x', y: 'y'})
void bytes
