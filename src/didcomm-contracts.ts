import type { JsonValue } from './identity-assurance/types.js'

export const DIDCOMM_PLAINTEXT_JSON_MEDIA_TYPE = 'application/didcomm-plain+json' as const

/** Supported attachment projection. Requiring id and media_type is the consumer profile, not every DIDComm attachment. */
export interface DidCommAttachment {
  id: string
  media_type: string
  byte_count?: number
  data: {
    links?: readonly string[]
    base64?: string
    json?: JsonValue
    hash?: string
  }
}

/**
 * Supported plaintext envelope, not an authenticated message or full protocol validator.
 * The required object body preserves the existing consumer profile, including typed
 * interfaces without an index signature. Business entries and authorization stay outside.
 */
export interface DidCommPayload<Body extends object = Record<string, unknown>> {
  id: string
  type: string
  from?: string
  to?: string[]
  thid?: string
  pthid?: string
  created_time?: number
  expires_time?: number
  body: Body extends readonly unknown[] ? never : Body
  attachments?: readonly DidCommAttachment[]
}
