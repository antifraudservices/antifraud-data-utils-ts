// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { hkdf } from '@noble/hashes/hkdf.js'
import { sha256 } from '@noble/hashes/sha2.js'
import * as pako from 'pako'

import { AesManager } from './aes-manager.js'
import { Content } from './content.js'
import type {
  ClassicPublicJwk,
  DataCompactJWT,
  ICryptoHelper,
  JweObject,
  JwtCompactParts,
  MlKemWrappedCekV1,
  MldsaAlg,
  MldsaPublicJwk,
  MlkemCurve,
  MlkemPrivateJwk,
  MlkemPublicJwk,
  ProtectedDataAES,
  ProtectedHeadersJWE,
  PublicJwk,
} from './types.js'

const CEK_BYTES = 32
const ML_KEM_SEED_BYTES = 64
const ML_DSA_SEED_BYTES = 32
const RECIPIENT_ALGORITHM = 'ML-KEM-768+HKDF-SHA256+A256GCMKW'

/**
 * Reviewed, stateless PQC engine migrated from gdc-common-utils-ts.
 *
 * This class never persists or owns private keys. Wallet and KMS callers retain
 * custody and supply private material only for the duration of an operation.
 */
export class CryptographyService {
  private readonly aesManager: AesManager

  constructor(private readonly cryptoHelper: ICryptoHelper) {
    this.aesManager = new AesManager(cryptoHelper)
  }

  async generateKeyPairMlKem(
    seedBytes?: Uint8Array,
    crv: MlkemCurve = 'ML-KEM-768',
  ): Promise<{ publicJWKey: MlkemPublicJwk & { kid: string }; secretKeyBytes: Uint8Array }> {
    const mlKem = await import('@noble/post-quantum/ml-kem.js')
    const seed = seedBytes?.byteLength === ML_KEM_SEED_BYTES
      ? seedBytes
      : await this.cryptoHelper.getRandomBytes(ML_KEM_SEED_BYTES)
    const algorithm = crv === 'ML-KEM-512'
      ? mlKem.ml_kem512
      : crv === 'ML-KEM-1024'
        ? mlKem.ml_kem1024
        : mlKem.ml_kem768
    const { publicKey, secretKey } = algorithm.keygen(seed)
    const publicWithoutKid: MlkemPublicJwk = {
      kty: 'OKP',
      crv,
      x: Content.bytesToRawBase64UrlSafe(publicKey),
    }
    return {
      publicJWKey: {
        ...publicWithoutKid,
        kid: await this.computeJwkThumbprint(publicWithoutKid),
      },
      secretKeyBytes: secretKey,
    }
  }

  async generateKeyPairMlDsa(
    seedBytes?: Uint8Array,
    alg: MldsaAlg = 'ML-DSA-44',
  ): Promise<{ publicJWKey: MldsaPublicJwk & { kid: string }; secretKeyBytes: Uint8Array }> {
    const mlDsa = await import('@noble/post-quantum/ml-dsa.js')
    const seed = seedBytes?.byteLength === ML_DSA_SEED_BYTES
      ? seedBytes
      : await this.cryptoHelper.getRandomBytes(ML_DSA_SEED_BYTES)
    const algorithm = alg === 'ML-DSA-65'
      ? mlDsa.ml_dsa65
      : alg === 'ML-DSA-87'
        ? mlDsa.ml_dsa87
        : mlDsa.ml_dsa44
    const { publicKey, secretKey } = algorithm.keygen(seed)
    const publicWithoutKid: MldsaPublicJwk = {
      kty: 'AKP',
      alg,
      pub: Content.bytesToRawBase64UrlSafe(publicKey),
    }
    return {
      publicJWKey: {
        ...publicWithoutKid,
        kid: await this.computeJwkThumbprint(publicWithoutKid),
      },
      secretKeyBytes: secretKey,
    }
  }

  async encryptJwe(
    payload: object,
    protectedHeader: object,
    secretJWKey: MlkemPrivateJwk,
    recipientsJWKeys: MlkemPublicJwk[],
  ): Promise<JweObject> {
    if (recipientsJWKeys.length !== 1) {
      throw new Error('CryptographyService.encryptJwe currently only supports a single recipient.')
    }
    const recipient = recipientsJWKeys[0]
    this.assertRecipient(recipient)
    const cek = await this.randomBytes(CEK_BYTES)
    const kemSeed = await this.randomBytes(32)
    const { derivedCekBytes: sharedSecret, encapsulatedCekBytes } = await this.encapsulate(
      kemSeed,
      secretJWKey.dBytes,
      Content.base64ToBytes(recipient.x),
    )
    const protectedValue = Content.objectToRawBase64UrlSafe(protectedHeader)
    const payloadBytes = Content.objectToBytes(payload)
    const payloadString = (protectedHeader as ProtectedHeadersJWE).zip === 'DEF'
      ? Content.bytesToRawBase64UrlSafe(pako.deflate(payloadBytes))
      : Content.bytesToStringUTF8(payloadBytes)
    const encrypted = await this.encrypt(payloadString, cek, protectedValue)
    const wrappedCek = await this.wrapCekForRecipient(
      cek,
      sharedSecret,
      encapsulatedCekBytes,
      protectedValue,
      recipient.kid,
    )
    return {
      protected: protectedValue,
      recipients: [{
        header: { alg: RECIPIENT_ALGORITHM, kid: recipient.kid },
        encrypted_key: Content.objectToRawBase64UrlSafe(wrappedCek),
      }],
      ...encrypted,
    }
  }

  async encryptJweToCompact(
    payload: object | string,
    protectedHeader: object,
    secretJWKey: MlkemPrivateJwk,
    recipientJWKey: MlkemPublicJwk,
  ): Promise<string> {
    this.assertRecipient(recipientJWKey)
    const finalHeader = {
      ...protectedHeader,
      alg: RECIPIENT_ALGORITHM,
      kid: recipientJWKey.kid,
    }
    const protectedValue = Content.objectToRawBase64UrlSafe(finalHeader)
    const cek = await this.randomBytes(CEK_BYTES)
    const kemSeed = await this.randomBytes(32)
    const { derivedCekBytes: sharedSecret, encapsulatedCekBytes } = await this.encapsulate(
      kemSeed,
      secretJWKey.dBytes,
      Content.base64ToBytes(recipientJWKey.x),
    )
    const wrappedCek = await this.wrapCekForRecipient(
      cek,
      sharedSecret,
      encapsulatedCekBytes,
      protectedValue,
      recipientJWKey.kid,
    )
    const sourceBytes = typeof payload === 'string'
      ? Content.stringToBytesUTF8(payload)
      : Content.objectToBytes(payload)
    const plaintext = (finalHeader as ProtectedHeadersJWE).zip === 'DEF'
      ? Content.bytesToRawBase64UrlSafe(pako.deflate(sourceBytes))
      : Content.bytesToStringUTF8(sourceBytes)
    const encrypted = await this.encrypt(plaintext, cek, protectedValue)
    return [
      protectedValue,
      Content.objectToRawBase64UrlSafe(wrappedCek),
      encrypted.iv,
      encrypted.ciphertext,
      encrypted.tag,
    ].join('.')
  }

  async decryptJwe(
    jwe: JweObject | string,
    secretKeyJwk: MlkemPrivateJwk,
  ): Promise<{ decryptedBytes: Uint8Array; protectedHeader: object }> {
    if (!secretKeyJwk.kid) {
      throw new Error('The recipient private key requires a kid.')
    }
    const parsed = typeof jwe === 'string' ? this.parseCompactJwe(jwe) : jwe
    const recipient = parsed.recipients?.find(candidate => candidate.header?.kid === secretKeyJwk.kid)
    if (!recipient?.encrypted_key) {
      throw new Error(`JWE does not contain a recipient with kid=${secretKeyJwk.kid}`)
    }
    const cek = await this.unwrapRecipientCek(
      recipient.encrypted_key,
      secretKeyJwk,
      parsed.protected,
    )
    const plaintext = await this.decrypt(
      { ciphertext: parsed.ciphertext, iv: parsed.iv, tag: parsed.tag },
      cek,
      parsed.protected,
    )
    const protectedHeader = Content.base64UrlSafeToJSON(parsed.protected) as ProtectedHeadersJWE
    const decryptedBytes = protectedHeader.zip === 'DEF'
      ? pako.inflate(Content.base64ToBytes(plaintext))
      : Content.stringToBytesUTF8(plaintext)
    return { decryptedBytes, protectedHeader }
  }

  getRecipientKidsFromJwe(jwe: JweObject | string): string[] {
    const parsed = typeof jwe === 'string' ? this.parseCompactJwe(jwe) : jwe
    return (parsed.recipients ?? [])
      .map(recipient => recipient.header?.kid)
      .filter((kid): kid is string => Boolean(kid))
  }

  async signDataJws(
    payload: object,
    protectedHeader: object,
    secretKeyBytes: Uint8Array,
  ): Promise<JwtCompactParts> {
    const alg = (protectedHeader as { alg?: MldsaAlg }).alg
    if (!alg) {
      throw new Error("Protected header must contain 'alg' property for signing.")
    }
    const protectedValue = Content.objectToRawBase64UrlSafe(protectedHeader)
    const payloadValue = Content.objectToRawBase64UrlSafe(payload)
    const signature = await this.signBytes(
      Content.stringToBytesUTF8(`${protectedValue}.${payloadValue}`),
      secretKeyBytes,
      alg,
    )
    return {
      protected: protectedValue,
      payload: payloadValue,
      signature: Content.bytesToRawBase64UrlSafe(signature),
    }
  }

  async verifyJws(jws: JwtCompactParts | string, publicJwk: PublicJwk): Promise<boolean> {
    const parts = typeof jws === 'string' ? this.getCompactJwsParts(jws) : jws
    return this.verifyBytes(
      Content.base64ToBytes(parts.signature),
      Content.stringToBytesUTF8(`${parts.protected}.${parts.payload}`),
      publicJwk,
    )
  }

  async verifyDetachedJws(
    payloadBytes: Uint8Array,
    detachedJws: string,
    publicJwk: PublicJwk,
  ): Promise<boolean> {
    const parts = detachedJws.split('..')
    if (parts.length !== 2) {
      throw new Error('Invalid Detached JWS format')
    }
    const protectedHeader = Content.base64UrlSafeToJSON(parts[0]) as {
      b64?: boolean
      crit?: unknown
    }
    if (protectedHeader.b64 !== undefined && typeof protectedHeader.b64 !== 'boolean') {
      throw new Error("Detached JWS protected header 'b64' must be boolean.")
    }
    if (
      protectedHeader.b64 === false
      && (!Array.isArray(protectedHeader.crit) || !protectedHeader.crit.includes('b64'))
    ) {
      throw new Error("RFC 7797 detached JWS with 'b64=false' must mark 'b64' critical.")
    }
    let signingInput: Uint8Array
    if (protectedHeader.b64 === false) {
      const prefix = Content.stringToBytesUTF8(`${parts[0]}.`)
      signingInput = new Uint8Array(prefix.byteLength + payloadBytes.byteLength)
      signingInput.set(prefix)
      signingInput.set(payloadBytes, prefix.byteLength)
    } else {
      signingInput = Content.stringToBytesUTF8(
        `${parts[0]}.${Content.bytesToRawBase64UrlSafe(payloadBytes)}`,
      )
    }
    return this.verifyBytes(
      Content.base64ToBytes(parts[1]),
      signingInput,
      publicJwk,
    )
  }

  encrypt(plaintext: string, cekBytes: Uint8Array, aad: string): Promise<ProtectedDataAES> {
    return this.aesManager.encrypt(plaintext, cekBytes, aad)
  }

  decrypt(data: ProtectedDataAES, cekBytes: Uint8Array, aad: string): Promise<string> {
    return this.aesManager.decrypt(data, cekBytes, aad)
  }

  async encapsulate(
    seedBytes: Uint8Array,
    _secretKeyBytes: Uint8Array,
    recipientPublicKeyBytes: Uint8Array,
  ): Promise<{ encapsulatedCekBytes: Uint8Array; derivedCekBytes: Uint8Array }> {
    const mlKem = await import('@noble/post-quantum/ml-kem.js')
    const { sharedSecret, cipherText } = mlKem.ml_kem768.encapsulate(
      recipientPublicKeyBytes,
      seedBytes,
    )
    return { encapsulatedCekBytes: cipherText, derivedCekBytes: sharedSecret }
  }

  async decapsulate(encapsulatedBytes: Uint8Array, secretKeyBytes: Uint8Array): Promise<Uint8Array> {
    const mlKem = await import('@noble/post-quantum/ml-kem.js')
    return mlKem.ml_kem768.decapsulate(encapsulatedBytes, secretKeyBytes)
  }

  async signBytes(
    payloadBytes: Uint8Array,
    secretKeyBytes: Uint8Array,
    alg: MldsaAlg,
  ): Promise<Uint8Array> {
    const mlDsa = await import('@noble/post-quantum/ml-dsa.js')
    if (alg === 'ML-DSA-44') return mlDsa.ml_dsa44.sign(payloadBytes, secretKeyBytes)
    if (alg === 'ML-DSA-65') return mlDsa.ml_dsa65.sign(payloadBytes, secretKeyBytes)
    if (alg === 'ML-DSA-87') return mlDsa.ml_dsa87.sign(payloadBytes, secretKeyBytes)
    throw new Error(`Unsupported ML-DSA algorithm: ${String(alg)}`)
  }

  async verifyBytes(
    signatureBytes: Uint8Array,
    dataBytes: Uint8Array,
    publicKey: PublicJwk,
  ): Promise<boolean> {
    if (publicKey.kty !== 'AKP') {
      throw new Error('ML-DSA verification requires an AKP public key.')
    }
    const mlDsa = await import('@noble/post-quantum/ml-dsa.js')
    const publicKeyBytes = Content.base64ToBytes(publicKey.pub)
    if (publicKey.alg === 'ML-DSA-44') return mlDsa.ml_dsa44.verify(signatureBytes, dataBytes, publicKeyBytes)
    if (publicKey.alg === 'ML-DSA-65') return mlDsa.ml_dsa65.verify(signatureBytes, dataBytes, publicKeyBytes)
    if (publicKey.alg === 'ML-DSA-87') return mlDsa.ml_dsa87.verify(signatureBytes, dataBytes, publicKeyBytes)
    throw new Error(`Unsupported ML-DSA algorithm: ${String(publicKey.alg)}`)
  }

  jwsToCompact(jws: DataCompactJWT): string {
    const protectedValue = typeof jws.protected === 'string'
      ? jws.protected
      : Content.objectToRawBase64UrlSafe(jws.protected)
    const payloadValue = typeof jws.payload === 'string'
      ? jws.payload
      : Content.objectToRawBase64UrlSafe(jws.payload)
    const signatureValue = typeof jws.signature === 'string'
      ? jws.signature
      : Content.bytesToRawBase64UrlSafe(jws.signature)
    return `${protectedValue}.${payloadValue}.${signatureValue}`
  }

  parseCompactJws(value: string): DataCompactJWT {
    if (value.trimStart().startsWith('{')) {
      const parsed = JSON.parse(value) as {
        payload?: string
        signatures?: Array<{ protected?: string; signature?: string }>
      }
      const first = parsed.signatures?.[0]
      if (!parsed.payload || !first?.protected || !first.signature) {
        throw new Error('Invalid JWS JSON format')
      }
      return {
        payload: parsed.payload,
        protected: first.protected,
        signature: first.signature,
      }
    }
    const parts = this.getCompactJwsParts(value)
    return {
      payload: Content.base64UrlSafeToJSON(parts.payload),
      protected: Content.base64UrlSafeToJSON(parts.protected),
      signature: Content.base64ToBytes(parts.signature),
    }
  }

  parseCompactJwe(value: string): JweObject {
    if (value.trimStart().startsWith('{')) {
      return JSON.parse(value) as JweObject
    }
    const parts = value.split('.')
    if (parts.length !== 5) {
      throw new Error('Invalid Compact JWE format')
    }
    const header = Content.base64UrlSafeToJSON(parts[0]) as { alg?: string; kid?: string }
    return {
      protected: parts[0],
      recipients: [{
        header: { alg: header.alg ?? '', kid: header.kid ?? '' },
        encrypted_key: parts[1],
      }],
      iv: parts[2],
      ciphertext: parts[3],
      tag: parts[4],
    }
  }

  private async wrapCekForRecipient(
    cek: Uint8Array,
    sharedSecret: Uint8Array,
    kemCiphertext: Uint8Array,
    protectedHeader: string,
    recipientKid: string,
  ): Promise<MlKemWrappedCekV1> {
    const kek = this.deriveRecipientKek(sharedSecret, protectedHeader, recipientKid)
    const wrapped = await this.encrypt(
      Content.bytesToRawBase64UrlSafe(cek),
      kek,
      `${protectedHeader}.${recipientKid}.cek`,
    )
    return {
      v: 'gdc-mlkem-cek-wrap-v1',
      kem: 'ML-KEM-768',
      kdf: 'HKDF-SHA-256',
      wrap: 'A256GCM',
      kemCiphertext: Content.bytesToRawBase64UrlSafe(kemCiphertext),
      ...wrapped,
    }
  }

  private async unwrapRecipientCek(
    encryptedKey: string,
    secretKey: MlkemPrivateJwk,
    protectedHeader: string,
  ): Promise<Uint8Array> {
    let wrapped: MlKemWrappedCekV1
    try {
      wrapped = Content.base64UrlSafeToJSON(encryptedKey) as MlKemWrappedCekV1
    } catch {
      return this.decapsulate(Content.base64ToBytes(encryptedKey), secretKey.dBytes)
    }
    if (
      wrapped.v !== 'gdc-mlkem-cek-wrap-v1'
      || wrapped.kem !== 'ML-KEM-768'
      || wrapped.kdf !== 'HKDF-SHA-256'
      || wrapped.wrap !== 'A256GCM'
    ) {
      throw new Error('Unsupported ML-KEM CEK wrap profile.')
    }
    const sharedSecret = await this.decapsulate(
      Content.base64ToBytes(wrapped.kemCiphertext),
      secretKey.dBytes,
    )
    const kek = this.deriveRecipientKek(sharedSecret, protectedHeader, secretKey.kid as string)
    const encodedCek = await this.decrypt(
      { iv: wrapped.iv, ciphertext: wrapped.ciphertext, tag: wrapped.tag },
      kek,
      `${protectedHeader}.${secretKey.kid}.cek`,
    )
    const cek = Content.base64ToBytes(encodedCek)
    if (cek.byteLength !== CEK_BYTES) {
      throw new Error('Invalid wrapped AES-256-GCM CEK.')
    }
    return cek
  }

  private deriveRecipientKek(
    sharedSecret: Uint8Array,
    protectedHeader: string,
    recipientKid: string,
  ): Uint8Array {
    return hkdf(
      sha256,
      sharedSecret,
      Content.stringToBytesUTF8('gdc-confidential-pqc-v1'),
      Content.stringToBytesUTF8(`${protectedHeader}.${recipientKid}.document-at-rest`),
      CEK_BYTES,
    )
  }

  private async computeJwkThumbprint(jwk: PublicJwk): Promise<string> {
    let base: Record<string, string>
    if (jwk.kty === 'OKP') base = { crv: jwk.crv, kty: jwk.kty, x: jwk.x }
    else if (jwk.kty === 'AKP') base = { alg: jwk.alg, kty: jwk.kty, pub: jwk.pub }
    else {
      const ec = jwk as ClassicPublicJwk
      base = { crv: ec.crv, kty: ec.kty, x: ec.x, y: ec.y }
    }
    const canonical = `{${Object.keys(base).sort().map(
      key => `${JSON.stringify(key)}:${JSON.stringify(base[key])}`,
    ).join(',')}}`
    const digestHex = await this.cryptoHelper.digestString(canonical, 'SHA-256')
    if (!/^[0-9a-f]{64}$/iu.test(digestHex)) {
      throw new Error('The cryptographic digest adapter returned an invalid SHA-256 digest.')
    }
    return Content.bytesToRawBase64UrlSafe(
      Uint8Array.from(digestHex.match(/.{2}/gu) ?? [], octet => Number.parseInt(octet, 16)),
    )
  }

  private getCompactJwsParts(value: string): JwtCompactParts {
    const parts = value.split('.')
    if (parts.length !== 3 || parts.some(part => part.length === 0)) {
      throw new Error('Invalid Compact JWS format')
    }
    return { protected: parts[0], payload: parts[1], signature: parts[2] }
  }

  private assertRecipient(recipient: MlkemPublicJwk): asserts recipient is MlkemPublicJwk & { kid: string } {
    if (recipient.crv !== 'ML-KEM-768' || !recipient.kid || !recipient.x) {
      throw new Error('A keyed ML-KEM-768 recipient is required.')
    }
  }

  private async randomBytes(length: number): Promise<Uint8Array> {
    const value = await this.cryptoHelper.getRandomBytes(length)
    if (value.byteLength !== length) {
      throw new Error(`The cryptographic random source returned ${value.byteLength} bytes; expected ${length}.`)
    }
    return value
  }
}
