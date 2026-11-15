import { sha3_256 } from '@noble/hashes/sha3.js'
import { encodeBase58btc } from './base58btc.js'

/** Internal wire encoder; each caller owns its distinct contact/alias normalization profile. */
export function hashCanonicalActorContact(value: string): string {
  const digest = sha3_256(new TextEncoder().encode(value))
  return `urn:multibase:${encodeBase58btc(Uint8Array.from([0x16, 0x20, ...digest]))}`
}
