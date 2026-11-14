import type {
  DataCompactJWT, JweObject, JwtCompactParts, MldsaAlg, MldsaPublicJwk,
  MlkemCurve, MlkemPrivateJwk, MlkemPublicJwk, ProtectedDataAES, PublicJwk,
} from './types.js'

/** Stateless engine contract. Callers retain key custody; no transport or persistence is implied. */
export interface ICryptography {
  generateKeyPairMlKem(seedBytes?: Uint8Array, crv?: MlkemCurve): Promise<{ publicJWKey: MlkemPublicJwk & { kid: string }; secretKeyBytes: Uint8Array }>
  generateKeyPairMlDsa(seedBytes?: Uint8Array, alg?: MldsaAlg): Promise<{ publicJWKey: MldsaPublicJwk & { kid: string }; secretKeyBytes: Uint8Array }>
  encrypt(plaintext: string, cekBytes: Uint8Array, aad: string): Promise<ProtectedDataAES>
  decrypt(data: ProtectedDataAES, cekBytes: Uint8Array, aad: string): Promise<string>
  encapsulate(cekSeedBytes: Uint8Array, secretKeyBytes: Uint8Array, recipientPublicKeyBytes: Uint8Array): Promise<{ encapsulatedCekBytes: Uint8Array; derivedCekBytes: Uint8Array }>
  decapsulate(encapsulatedBytes: Uint8Array, secretKeyBytes: Uint8Array): Promise<Uint8Array>
  signBytes(payloadBytes: Uint8Array, secretKeyBytes: Uint8Array, alg: MldsaAlg): Promise<Uint8Array>
  verifyBytes(signatureBytes: Uint8Array, dataBytes: Uint8Array, publicKey: PublicJwk): Promise<boolean>
  encryptJwe(payload: object, protectedHeader: object, secretKey: MlkemPrivateJwk, recipients: MlkemPublicJwk[]): Promise<JweObject>
  encryptJweToCompact(payload: object | string, protectedHeader: object, secretKey: MlkemPrivateJwk, recipient: MlkemPublicJwk): Promise<string>
  decryptJwe(jwe: JweObject | string, secretKey: MlkemPrivateJwk): Promise<{ decryptedBytes: Uint8Array; protectedHeader: object }>
  getRecipientKidsFromJwe(jwe: JweObject | string): string[]
  signDataJws(payload: object, protectedHeader: object, secretKeyBytes: Uint8Array): Promise<JwtCompactParts>
  verifyJws(jws: JwtCompactParts | string, publicKey: PublicJwk): Promise<boolean>
  verifyDetachedJws(payloadBytes: Uint8Array, detachedJws: string, publicKey: PublicJwk): Promise<boolean>
  jwsToCompact(jws: DataCompactJWT): string
  parseCompactJws(value: string): DataCompactJWT
  parseCompactJwe(value: string): JweObject
}
