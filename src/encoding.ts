import {sha3_224,sha3_256,sha3_384,sha3_512} from '@noble/hashes/sha3.js'
import {encodeBase58btc} from './encoding/base58btc.js'

/** Raw base58btc digits, without the multibase prefix. */
export const bytesToBase58 = (bytes:Uint8Array):string => encodeBase58btc(bytes).slice(1)
export const bytesToHexString = (bytes:Uint8Array):string => Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('')
export {encodeBase58btc}

export type Sha3DigestBits = 224|256|384|512
export type MultihashProfile = Readonly<{
  algorithm:`sha3-${Sha3DigestBits}`
  code:number
  digestLengthBytes:number
  digest:(value:Uint8Array)=>Uint8Array
}>
const profiles:Readonly<Record<Sha3DigestBits,MultihashProfile>> = Object.freeze({
  224:Object.freeze({algorithm:'sha3-224',code:0x17,digestLengthBytes:28,digest:sha3_224}),
  256:Object.freeze({algorithm:'sha3-256',code:0x16,digestLengthBytes:32,digest:sha3_256}),
  384:Object.freeze({algorithm:'sha3-384',code:0x15,digestLengthBytes:48,digest:sha3_384}),
  512:Object.freeze({algorithm:'sha3-512',code:0x14,digestLengthBytes:64,digest:sha3_512}),
})
export const SHA3_256_MULTIHASH_PROFILE = profiles[256]
export const SHA3_384_MULTIHASH_PROFILE = profiles[384]

function multihash(input:string|Uint8Array,profile:MultihashProfile):Uint8Array {
  const bytes=typeof input==='string'?new TextEncoder().encode(input):input
  const digest=profile.digest(bytes)
  return Uint8Array.of(profile.code,profile.digestLengthBytes,...digest)
}

/** Multibase(base58btc(multihash(SHA3-n))); this envelope is not a CID. */
export function encodeMultibaseSha3(input:string|Uint8Array,bits:Sha3DigestBits=384):string {
  const profile=profiles[bits]
  if(!profile)throw new TypeError('unsupported_sha3_digest_size')
  return encodeBase58btc(multihash(input,profile))
}

/** CIDv1 raw codec over exact UTF-8 bytes; callers own input canonicalization. */
export function buildRawCidV1FromUtf8String(value:string,profile:MultihashProfile=SHA3_384_MULTIHASH_PROFILE):string {
  return encodeBase58btc(Uint8Array.of(1,0x55,...multihash(value,profile)))
}
