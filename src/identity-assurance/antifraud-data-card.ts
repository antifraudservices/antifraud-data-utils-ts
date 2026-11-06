import { deflateRaw, inflateRaw } from 'pako'
import { Content } from '../cryptography/content.js'
import { decodeNumericQrValue, encodeNumericQrValue } from '../cryptography/numeric-qr.js'

export const AntifraudDataCardQrPrefix = 'afdc:/' as const
export const AntifraudDataCardCredentialType = 'urn:antifraudservices:credential:antifraud-data-card:v1' as const
export const AntifraudDataCardMaxSingleQrLength = 1195
export const AntifraudDataCardMaxQrChunkBodyLength = 1191

type JsonRecord = Record<string, unknown>
export type AntifraudDataCardPayload = Readonly<{
  iss: string
  nbf: number
  vc: Readonly<{
    type: readonly [typeof AntifraudDataCardCredentialType, ...string[]]
    credentialSubject: Readonly<{ jsonApiDocument: JsonRecord }>
  }>
}>

export type PreparedAntifraudDataCard = Readonly<{
  protectedHeader: Readonly<{ alg: 'ES256'; zip: 'DEF'; kid: string }>
  payload: AntifraudDataCardPayload
  payloadBytes: Uint8Array
  encodedHeader: string
  encodedPayload: string
  signingInput: string
  signingBytes: Uint8Array
}>

/** Prepares a non-health VC over one canonical JSON:API/Schema.org primary document. */
export function prepareAntifraudDataCard(input: Readonly<{
  issuer: string
  kid: string
  notBefore: number
  jsonApiDocument: unknown
  additionalTypes?: readonly string[]
}>): PreparedAntifraudDataCard {
  const issuer = required(input.issuer, 'antifraud_data_card_issuer_required')
  const issuerUrl = new URL(issuer)
  if (issuerUrl.protocol !== 'https:' || issuerUrl.username || issuerUrl.password || issuerUrl.pathname !== '/') {
    throw new TypeError('antifraud_data_card_issuer_https_origin_required')
  }
  if (!Number.isInteger(input.notBefore) || input.notBefore < 0) throw new TypeError('antifraud_data_card_not_before_seconds_required')
  const kid = required(input.kid, 'antifraud_data_card_kid_required')
  const jsonApiDocument = requireJsonApiDocument(input.jsonApiDocument)
  const payload = {
    iss: issuerUrl.origin,
    nbf: input.notBefore,
    vc: {
      type: [AntifraudDataCardCredentialType, ...(input.additionalTypes ?? []).map((value, index) => required(value, `antifraud_data_card_type_${index}_required`))],
      credentialSubject: { jsonApiDocument },
    },
  } as AntifraudDataCardPayload
  const canonicalPayload = canonicalJson(payload)
  const payloadBytes = Content.stringToBytesUTF8(canonicalPayload)
  const protectedHeader = Object.freeze({ alg: 'ES256' as const, zip: 'DEF' as const, kid })
  const encodedHeader = Content.objectToRawBase64UrlSafe(protectedHeader)
  const encodedPayload = Content.bytesToRawBase64UrlSafe(deflateRaw(payloadBytes))
  const signingInput = `${encodedHeader}.${encodedPayload}`
  return Object.freeze({
    protectedHeader,
    payload: JSON.parse(canonicalPayload) as AntifraudDataCardPayload,
    payloadBytes,
    encodedHeader,
    encodedPayload,
    signingInput,
    signingBytes: Content.stringToBytesUTF8(signingInput),
  })
}

export function assembleAntifraudDataCardJws(
  prepared: Pick<PreparedAntifraudDataCard, 'encodedHeader' | 'encodedPayload'>,
  signatureBase64Url: string,
): string {
  const signature = required(signatureBase64Url, 'antifraud_data_card_signature_required')
  if (!/^[A-Za-z0-9_-]+$/u.test(signature)) throw new TypeError('antifraud_data_card_signature_base64url_required')
  return `${prepared.encodedHeader}.${prepared.encodedPayload}.${signature}`
}

export function encodeAntifraudDataCardQr(compactJws: string): readonly string[] {
  const jws = requireCompactJws(compactJws)
  if (jws.length <= AntifraudDataCardMaxSingleQrLength) {
    return Object.freeze([`${AntifraudDataCardQrPrefix}${encodeNumericQrValue(jws, 'antifraud_data_card_jws_character_invalid')}`])
  }
  const count = Math.ceil(jws.length / AntifraudDataCardMaxQrChunkBodyLength)
  const length = Math.ceil(jws.length / count)
  return Object.freeze(Array.from({ length: count }, (_, index) => `${AntifraudDataCardQrPrefix}${index + 1}/${count}/${encodeNumericQrValue(jws.slice(index * length, (index + 1) * length), 'antifraud_data_card_jws_character_invalid')}`))
}

export function decodeAntifraudDataCardQr(values: readonly string[]): string {
  if (!Array.isArray(values) || !values.length) throw new TypeError('antifraud_data_card_qr_required')
  if (values.length === 1 && /^afdc:\/\d+$/u.test(values[0] ?? '')) {
    return requireCompactJws(decodeNumericQrValue(values[0]!.slice(AntifraudDataCardQrPrefix.length), 'antifraud_data_card_qr_numeric_invalid'))
  }
  const chunks = values.map(value => {
    const match = /^afdc:\/(\d+)\/(\d+)\/(\d+)$/u.exec(value)
    if (!match) throw new TypeError('antifraud_data_card_qr_chunk_invalid')
    return { index: Number(match[1]), count: Number(match[2]), value: decodeNumericQrValue(match[3]!, 'antifraud_data_card_qr_numeric_invalid') }
  })
  const expected = chunks[0]!.count
  if (expected !== chunks.length || chunks.some(chunk => chunk.count !== expected || chunk.index < 1 || chunk.index > expected) || new Set(chunks.map(chunk => chunk.index)).size !== expected) {
    throw new TypeError('antifraud_data_card_qr_chunk_set_invalid')
  }
  return requireCompactJws([...chunks].sort((left, right) => left.index - right.index).map(chunk => chunk.value).join(''))
}

export function decodeAntifraudDataCardPayload(compactJws: string): AntifraudDataCardPayload {
  const parts = requireCompactJws(compactJws).split('.')
  return JSON.parse(Content.bytesToStringUTF8(inflateRaw(Content.base64ToBytes(parts[1]!)))) as AntifraudDataCardPayload
}

function requireCompactJws(value: string): string {
  const normalized = required(value, 'antifraud_data_card_compact_jws_required')
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/u.test(normalized)) throw new TypeError('antifraud_data_card_compact_jws_required')
  return normalized
}

function requireJsonApiDocument(value: unknown): JsonRecord {
  const document = record(value)
  const resources = Array.isArray(document?.data) ? document.data : document?.data ? [document.data] : []
  if (!document || !resources.length || resources.some(resource => {
    const item = record(resource)
    return !item || !requiredOrFalse(item.type) || !requiredOrFalse(item.id) || !record(item.attributes)
  })) throw new TypeError('antifraud_data_card_json_api_primary_document_required')
  return JSON.parse(canonicalJson(document)) as JsonRecord
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('antifraud_data_card_json_number_invalid')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  const object = record(value)
  if (!object) throw new TypeError('antifraud_data_card_json_value_invalid')
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(',')}}`
}

function record(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : undefined
}
function requiredOrFalse(value: unknown): boolean { return typeof value === 'string' && Boolean(value.trim()) }
function required(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(code)
  return value.trim()
}
