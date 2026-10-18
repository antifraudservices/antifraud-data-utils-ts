// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

import { Content } from './content.js'
import type { ICryptoHelper, ProtectedDataAES } from './types.js'

const AES_KEY_BYTES = 32
const AES_IV_BYTES = 12
const AES_TAG_BYTES = 16

function toWebCryptoBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(value)
}

/** Stateless AES-256-GCM primitive with JWE-compatible base64url output. */
export class AesManager {
  constructor(private readonly cryptoHelper: Pick<ICryptoHelper, 'getRandomBytes'>) {}

  async encrypt(
    plaintext: string,
    cekBytes: Uint8Array,
    aad: string,
  ): Promise<ProtectedDataAES> {
    this.assertKey(cekBytes)
    const iv = await this.cryptoHelper.getRandomBytes(AES_IV_BYTES)
    if (iv.byteLength !== AES_IV_BYTES) {
      throw new Error('The cryptographic random source returned an invalid AES-GCM IV.')
    }
    const key = await crypto.subtle.importKey(
      'raw',
      toWebCryptoBytes(cekBytes),
      'AES-GCM',
      false,
      ['encrypt'],
    )
    const combined = new Uint8Array(await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: toWebCryptoBytes(iv),
        additionalData: toWebCryptoBytes(Content.stringToBytesUTF8(aad)),
        tagLength: AES_TAG_BYTES * 8,
      },
      key,
      toWebCryptoBytes(Content.stringToBytesUTF8(plaintext)),
    ))
    return {
      ciphertext: Content.bytesToRawBase64UrlSafe(combined.subarray(0, -AES_TAG_BYTES)),
      iv: Content.bytesToRawBase64UrlSafe(iv),
      tag: Content.bytesToRawBase64UrlSafe(combined.subarray(-AES_TAG_BYTES)),
    }
  }

  async decrypt(
    encryptedData: ProtectedDataAES,
    cekBytes: Uint8Array,
    aad: string,
  ): Promise<string> {
    this.assertKey(cekBytes)
    const iv = Content.base64ToBytes(encryptedData.iv)
    const ciphertext = Content.base64ToBytes(encryptedData.ciphertext)
    const tag = Content.base64ToBytes(encryptedData.tag)
    if (iv.byteLength !== AES_IV_BYTES || tag.byteLength !== AES_TAG_BYTES) {
      throw new Error('Invalid AES-256-GCM envelope parameters.')
    }
    const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength)
    combined.set(ciphertext)
    combined.set(tag, ciphertext.byteLength)
    const key = await crypto.subtle.importKey(
      'raw',
      toWebCryptoBytes(cekBytes),
      'AES-GCM',
      false,
      ['decrypt'],
    )
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toWebCryptoBytes(iv),
        additionalData: toWebCryptoBytes(Content.stringToBytesUTF8(aad)),
        tagLength: AES_TAG_BYTES * 8,
      },
      key,
      toWebCryptoBytes(combined),
    )
    return Content.bytesToStringUTF8(new Uint8Array(plaintext))
  }

  private assertKey(key: Uint8Array): void {
    if (key.byteLength !== AES_KEY_BYTES) {
      throw new Error('Invalid key length: a 32-byte key is required.')
    }
  }
}
