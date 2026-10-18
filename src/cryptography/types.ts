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

export interface MlkemPrivateJwk extends MlkemPublicJwk {
  /** Private material. It must remain in the caller-owned wallet or KMS. */
  dBytes: Uint8Array
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
