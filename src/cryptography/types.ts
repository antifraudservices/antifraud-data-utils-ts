// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

/** Platform adapter used by the stateless cryptography engine. */
export interface ICryptoHelper {
  getRandomBytes(byteCount: number): Promise<Uint8Array>
  digestString(data: string, algorithm: string): Promise<string>
  randomUUID(): string
}

export type MlkemCurve = 'ML-KEM-512' | 'ML-KEM-768' | 'ML-KEM-1024'
export type MldsaAlg = 'ML-DSA-44' | 'ML-DSA-65' | 'ML-DSA-87'

export interface MlkemPublicJwk {
  kty: 'OKP'
  crv: MlkemCurve
  x: string
  kid?: string
}

export interface MldsaPublicJwk {
  kty: 'AKP'
  alg: MldsaAlg
  pub: string
  kid?: string
}

export interface ClassicPublicJwk {
  kty: 'EC'
  crv: string
  x: string
  y: string
  kid?: string
  alg?: 'ES256' | 'ES384' | 'ES256K'
  use?: string
}

export type PublicJwk = MlkemPublicJwk | MldsaPublicJwk | ClassicPublicJwk

/** RFC 7518 section 4.6 and RFC 8037 section 3.2 agreement algorithm identifiers. */
export const JoseEcdhAlgorithms = Object.freeze({
  Direct: 'ECDH-ES',
  A128KeyWrap: 'ECDH-ES+A128KW',
  A192KeyWrap: 'ECDH-ES+A192KW',
  A256KeyWrap: 'ECDH-ES+A256KW',
})
export type JoseEcdhAlgorithm = typeof JoseEcdhAlgorithms[keyof typeof JoseEcdhAlgorithms]
export const JoseKeyOperations = Object.freeze({
  Sign: 'sign', Verify: 'verify', Encrypt: 'encrypt', Decrypt: 'decrypt',
  WrapKey: 'wrapKey', UnwrapKey: 'unwrapKey', DeriveKey: 'deriveKey', DeriveBits: 'deriveBits',
})
export const JoseAgreementCurves = Object.freeze({
  P256: 'P-256', P384: 'P-384', Secp256k1: 'secp256k1', X25519: 'X25519',
})
export const X25519_PUBLIC_KEY_BYTES = 32
export type PublicAgreementOperation = typeof JoseKeyOperations.Encrypt | typeof JoseKeyOperations.WrapKey
  | typeof JoseKeyOperations.DeriveKey | typeof JoseKeyOperations.DeriveBits
export interface PublicAgreementMetadata {
  kid?: string
  use?: 'enc'
  key_ops?: PublicAgreementOperation[]
  d?: never
  k?: never
}
/** Existing resolver EC profile, including retained ES algorithm metadata. */
export type LegacyEcAgreementPublicJwk = Omit<ClassicPublicJwk, 'crv' | 'use'> & PublicAgreementMetadata & {
  crv: typeof JoseAgreementCurves.P256 | typeof JoseAgreementCurves.P384 | typeof JoseAgreementCurves.Secp256k1
}
/** Supported JOSE ECDH EC publication profile; it does not grant signing-engine support. */
export type EcAgreementPublicJwk = Omit<ClassicPublicJwk, 'crv' | 'alg' | 'use'> & PublicAgreementMetadata & {
  crv: typeof JoseAgreementCurves.P256 | typeof JoseAgreementCurves.P384
  alg?: JoseEcdhAlgorithm
}
/** RFC 8037 public octet-key-pair projection. No private scalar is admitted. */
export interface X25519PublicJwk extends PublicAgreementMetadata {
  kty: 'OKP'
  crv: typeof JoseAgreementCurves.X25519
  x: string
  alg?: JoseEcdhAlgorithm
}
export type MlkemAgreementPublicJwk = MlkemPublicJwk & PublicAgreementMetadata & { alg?: string }
/** Eligible agreement families only; runtime validation still establishes encoding and bindings. */
export type PublicAgreementJwk = LegacyEcAgreementPublicJwk | EcAgreementPublicJwk | X25519PublicJwk | MlkemAgreementPublicJwk

/** Required public parameters used by the existing key/thumbprint profiles. */
export type MlkemBaseJwk = Pick<MlkemPublicJwk, 'kty' | 'crv' | 'x'>
export type MldsaBaseJwk = Pick<MldsaPublicJwk, 'kty' | 'alg' | 'pub'>
export type EcBaseJwk = Pick<ClassicPublicJwk, 'kty' | 'crv' | 'x' | 'y'>
export type BaseJwk = MlkemBaseJwk | MldsaBaseJwk | EcBaseJwk

/** Generic JOSE import data; this shape is not a public-key publication filter. */
export interface JWK {
  alg?: string
  key_ops?: string[]
  kid?: string
  kty?: string
  use?: string
  crv?: string
  d?: string
  x?: string
  y?: string
  pub?: string
  priv?: string
  k?: string
  [name: string]: unknown
}

export interface JwkSet {
  keys: JWK[]
}

/** Raw in-memory bytes, distinct from the encoded ProtectedDataAES envelope. */
export interface AesGcmComponents {
  ciphertext: Uint8Array
  iv: Uint8Array
  authTag: Uint8Array
}

export interface MlkemPrivateJwk extends MlkemPublicJwk {
  /** Private material. It must remain in the caller-owned wallet or KMS. */
  dBytes: Uint8Array
}

export interface MldsaPrivateJwk extends MldsaPublicJwk {
  /** Private material remains in the caller-owned wallet or KMS. */
  privBytes: Uint8Array
}

export interface ProtectedDataAES {
  ciphertext: string
  tag: string
  iv: string
}

export interface ProtectedHeadersJWE {
  alg?: string
  enc?: string
  cty?: string
  /** Registered JWE embedded-key parameter (RFC 7516 section 4.1.5); import shape is not publication validation. */
  jwk?: JWK
  typ?: string
  kid?: string
  skid?: string
  zip?: string
  gdc_pq_profile?: 'confidential-pqc-v1'
  gdc_key_purpose?: 'document-at-rest'
  gdc_owner_binding?: string
}

export interface RecipientDataJWE {
  encrypted_key?: string
  header: {
    alg: string
    kid: string
  }
}

export interface JweObject {
  protected: string
  recipients: RecipientDataJWE[]
  iv: string
  ciphertext: string
  tag: string
}

export interface MlKemWrappedCekV1 {
  v: 'gdc-mlkem-cek-wrap-v1'
  kem: 'ML-KEM-768'
  kdf: 'HKDF-SHA-256'
  wrap: 'A256GCM'
  kemCiphertext: string
  iv: string
  ciphertext: string
  tag: string
}

export interface JwtCompactParts {
  protected: string
  payload: string
  signature: string
}

export interface DataCompactJWT {
  protected: object | string
  payload: object | string
  signature: Uint8Array | string
}
