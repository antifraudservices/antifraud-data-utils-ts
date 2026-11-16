// Flow contract: consumers use the neutral verification entry and owned crypto contract without importing a gateway, transport or domain authorization type.
import {
  assertSignedReceiptBinding, assertTenantClearingHouseTrust, canonicalRequestDigest,
  verifyPinnedDetachedJws, verifyPinnedJwt,
  type PinnedJwtOptions, type SignedReceiptExpectation, type TenantClearingHouseTrust,
} from 'antifraud-data-utils-ts/clearing-house'
import type { ICryptography } from 'antifraud-data-utils-ts/cryptography'

declare const cryptography: ICryptography
declare const trust: TenantClearingHouseTrust
declare const token: string
const options: PinnedJwtOptions = { audience: trust.audience, cryptography }
const verified = verifyPinnedJwt(token, trust.jwks, trust.issuer, 1_800_000_000, options)
const requestDigest: string = canonicalRequestDigest({ nonce: 'current' })
const expected: SignedReceiptExpectation = { nonce: 'current', requestDigest, acceptedAssurance: ['verified'], requiredClaims: { request_kind: 'verification' } }
void verified.then(payload => assertSignedReceiptBinding(payload, expected))
const endpoint: URL = assertTenantClearingHouseTrust(trust, trust.homeTenantReference)
const detached: Promise<void> = verifyPinnedDetachedJws(new Uint8Array(), token, trust.jwks.keys[0], cryptography)
// @ts-expect-error Verification is asynchronous and does not return an authorization decision.
const authorized: true = verifyPinnedJwt(token, trust.jwks, trust.issuer, 1_800_000_000)
// @ts-expect-error Signed receipt binding is validation, not a boolean permission grant.
const permission: boolean = assertSignedReceiptBinding({}, expected)
void [endpoint, detached, authorized, permission]

void cryptography.generateKeyPairMlDsa().then(pair => {
  void verifyPinnedJwt(token, { keys: [pair.publicJWKey] }, trust.issuer, 1_800_000_000, { cryptography })
  void verifyPinnedDetachedJws(new Uint8Array(), token, pair.publicJWKey, cryptography)
})
