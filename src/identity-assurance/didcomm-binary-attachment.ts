import {
  assertSha3_384EvidenceContentIdMatchesDigest,
} from './identity-evidence.js'
import {
  projectEvidenceAttachmentToSchemaOrgMediaObject,
  type SchemaOrgEvidenceMediaAttachment,
} from './schema-org-evidence.js'

export type DidCommInlineBinaryAttachment = Readonly<{
  id: string
  media_type: string
  byte_count: number
  data: Readonly<{
    base64: string
  }>
}>

export type DidCommLinkedBinaryAttachment = Readonly<{
  id: string
  media_type: string
  byte_count: number
  data: Readonly<{
    links: readonly [string]
    hash: string
  }>
}>

export type DidCommBinaryAttachment =
  | DidCommInlineBinaryAttachment
  | DidCommLinkedBinaryAttachment

export type DidCommInlineBinaryAttachmentInput = Readonly<{
  id: string
  mediaType: string
  bytes: Uint8Array
}>

const BASE58BTC_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(`${field} must not be empty`)
  return normalized
}

function requireMediaType(value: string): string {
  const mediaType = requireNonEmpty(value, 'DIDComm attachment mediaType')
  if (!/^[^\s/]+\/[^\s/]+$/u.test(mediaType)) {
    throw new TypeError('DIDComm attachment mediaType must be an Internet media type')
  }
  return mediaType
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}

function decodeBase64(value: string): Uint8Array {
  try {
    return Uint8Array.from(atob(value), character => character.charCodeAt(0))
  } catch {
    throw new TypeError('Schema.org MediaObject digest must be base64 encoded')
  }
}

function encodeBase58btc(bytes: Uint8Array): string {
  let value = 0n
  for (const byte of bytes) value = (value << 8n) | BigInt(byte)

  let encoded = ''
  while (value > 0n) {
    const remainder = Number(value % 58n)
    encoded = BASE58BTC_ALPHABET[remainder] + encoded
    value /= 58n
  }
  for (const byte of bytes) {
    if (byte !== 0) break
    encoded = `1${encoded}`
  }
  return `z${encoded}`
}

/**
 * Carries binary bytes inline in the DIDComm attachment transport layer.
 * The Schema.org DigitalDocument/MediaObject graph remains the business model.
 */
export function buildDidCommInlineBinaryAttachment(
  input: DidCommInlineBinaryAttachmentInput,
): DidCommInlineBinaryAttachment {
  const id = requireNonEmpty(input.id, 'DIDComm attachment id')
  const mediaType = requireMediaType(input.mediaType)
  if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength === 0) {
    throw new TypeError('DIDComm attachment bytes must not be empty')
  }

  return Object.freeze({
    id,
    media_type: mediaType,
    byte_count: input.bytes.byteLength,
    data: Object.freeze({
      base64: encodeBase64Url(input.bytes),
    }),
  })
}

/**
 * Projects one canonical Schema.org MediaObject encoding into a DIDComm
 * attachment by reference. DIDComm carries the file; it does not replace the
 * Schema.org business record or become its persistence model.
 */
export function buildDidCommLinkedBinaryAttachment(
  mediaObject: SchemaOrgEvidenceMediaAttachment,
): DidCommLinkedBinaryAttachment {
  projectEvidenceAttachmentToSchemaOrgMediaObject(mediaObject)
  assertSha3_384EvidenceContentIdMatchesDigest(mediaObject.contentId, mediaObject.digest)

  const digestBytes = decodeBase64(mediaObject.digest)
  if (digestBytes.byteLength !== 48) {
    throw new TypeError('Schema.org MediaObject SHA3-384 digest must contain 48 bytes')
  }
  const multihash = Uint8Array.from([0x15, 0x30, ...digestBytes])

  return Object.freeze({
    id: requireNonEmpty(mediaObject.id, 'DIDComm attachment id'),
    media_type: requireMediaType(mediaObject.mediaType),
    byte_count: mediaObject.contentSize,
    data: Object.freeze({
      links: Object.freeze([
        requireNonEmpty(mediaObject.contentUrl, 'DIDComm attachment contentUrl'),
      ]) as readonly [string],
      hash: encodeBase58btc(multihash),
    }),
  })
}
