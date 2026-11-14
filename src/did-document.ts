import type { PublicJwk } from './cryptography/types.js'

export const DidCoreContext = 'https://www.w3.org/ns/did/v1' as const

/** Key-bearing projection supported by the crypto engine; hosts validate publication and proof separately. */
export interface VerificationMethod {
  id: string
  type: string
  controller: string
  publicKeyJwk: PublicJwk
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
export type DidVerificationRelationship = Array<string | VerificationMethod>

/** JSON-LD DID document projection, not a resolver or an authority validator. */
export interface DidDocument<Service = DidService, Context = string | string[]> {
  '@context': Context
  id: string
  controller?: string | string[]
  alsoKnownAs?: string[]
  verificationMethod?: VerificationMethod[]
  assertionMethod?: DidVerificationRelationship
  authentication?: DidVerificationRelationship
  keyAgreement?: DidVerificationRelationship
  capabilityInvocation?: DidVerificationRelationship
  capabilityDelegation?: DidVerificationRelationship
  service?: Service[]
  [extension: string]: unknown
}
