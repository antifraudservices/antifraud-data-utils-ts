// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })

function bytesToBinary(bytes: Uint8Array): string {
  const chunkSize = 0x8000
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }
  return binary
}

/** Binary and JSON conversions shared by the reviewed cryptography profile. */
export class Content {
  static stringToBytesUTF8(value: string): Uint8Array {
    return encoder.encode(value)
  }

  static bytesToStringUTF8(value: Uint8Array): string {
    return decoder.decode(value)
  }

  static bytesToRawBase64UrlSafe(value: Uint8Array): string {
    return btoa(bytesToBinary(value))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/u, '')
  }

  static base64ToBytes(value: string): Uint8Array {
    if (!/^[A-Za-z0-9_-]*={0,2}$/u.test(value)) {
      throw new Error('Invalid base64url value.')
    }
    const standard = value.replaceAll('-', '+').replaceAll('_', '/')
    const padded = standard.padEnd(Math.ceil(standard.length / 4) * 4, '=')
    const binary = atob(padded)
    return Uint8Array.from(binary, character => character.charCodeAt(0))
  }

  static objectToBytes(value: object): Uint8Array {
    return Content.stringToBytesUTF8(JSON.stringify(value))
  }

  static objectToRawBase64UrlSafe(value: object): string {
    return Content.bytesToRawBase64UrlSafe(Content.objectToBytes(value))
  }

  static base64UrlSafeToJSON(value: string): any {
    return JSON.parse(Content.bytesToStringUTF8(Content.base64ToBytes(value)))
  }
}
