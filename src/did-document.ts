import type { PublicJwk, PublicAgreementJwk } from './cryptography/types.js'

export const DidCoreContext = 'https://www.w3.org/ns/did/v1' as const

/** Key-bearing projection supported by the crypto engine; hosts validate publication and proof separately. */
export interface VerificationMethod<Key extends PublicJwk | PublicAgreementJwk = PublicJwk> {
  id: string
  type: string
  controller: string
  publicKeyJwk: Key
  nbf?: number
  exp?: number
}
/** String endpoints are the compatibility default; callers can model structured DID service endpoints explicitly. */
export interface DidService<Endpoint = string> {
  id: string
  type: string
  serviceEndpoint: Endpoint
  [extension: string]: unknown
}
export type DidVerificationRelationship<Key extends PublicJwk | PublicAgreementJwk = PublicJwk> = Array<string | VerificationMethod<Key>>

/** JSON-LD DID document projection, not a resolver or an authority validator. */
export interface DidDocument<Service = DidService, Context = string | string[], Key extends PublicJwk | PublicAgreementJwk = PublicJwk> {
  '@context': Context
  id: string
  controller?: string | string[]
  alsoKnownAs?: string[]
  verificationMethod?: VerificationMethod<Key>[]
  assertionMethod?: DidVerificationRelationship<Key>
  authentication?: DidVerificationRelationship<Key>
  keyAgreement?: DidVerificationRelationship<Key>
  capabilityInvocation?: DidVerificationRelationship<Key>
  capabilityDelegation?: DidVerificationRelationship<Key>
  service?: Service[]
  [extension: string]: unknown
}
