// Copyright 2026 Antifraud Services Inc. under the Apache License, Version 2.0.
import { sha3_256 } from '@noble/hashes/sha3.js'
import { encodeBase58btc } from './encoding/base58btc.js'

export const StableActorContactKinds = Object.freeze({ Email: 'email', Phone: 'phone' } as const)
export type StableActorContactKind = typeof StableActorContactKinds[keyof typeof StableActorContactKinds]
export type ActorContactInput = Readonly<{ contactKind: StableActorContactKind; contact: string }>
export type OrganizationEmployeeIdentityInput = ActorContactInput & Readonly<{
  organizationDidWeb: string
  role: string
  deviceId?: string
}>

/** Normalization is a data operation, never proof of contact possession. */
export function normalizeActorContact(input: ActorContactInput): string {
  const raw = String(input.contact || '').trim()
  if (input.contactKind === StableActorContactKinds.Email) {
    const email = raw.replace(/^mailto:/iu, '').replace(/\s+/gu, '').toLowerCase()
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
      throw new TypeError('Actor email is invalid')
    }
    return email
  }
  if (input.contactKind === StableActorContactKinds.Phone) {
    const telephone = raw.replace(/^tel:/iu, '')
    if (/[^\d+\s().-]/u.test(telephone)) throw new TypeError('Actor telephone is invalid')
    const normalized = telephone.replace(/[^\d+]/gu, '')
    if (!/^\+[1-9]\d{1,14}$/u.test(normalized)) throw new TypeError('Actor telephone requires E.164')
    return normalized
  }
  throw new TypeError('Actor contact kind must be email or phone')
}

/** Builds the existing opaque SHA3-256 multihash actor identifier. */
export function buildStableActorIdentifier(input: ActorContactInput): string {
  const contact = normalizeActorContact(input)
  // Existing actor contract: multihash(SHA3-256), code 0x16, digest size 0x20.
  // Compatibility is checked against the published predecessor in tests only;
  // the runtime does not depend on that frozen package.
  const digest = sha3_256(new TextEncoder().encode(contact))
  return `urn:multibase:${encodeBase58btc(Uint8Array.from([0x16, 0x20, ...digest]))}`
}

/** Builds the existing organization employee DID, keeping role and actor separate. */
export function buildOrganizationEmployeeDidWeb(input: OrganizationEmployeeIdentityInput): string {
  const organizationDidWeb = String(input.organizationDidWeb || '').trim()
  const role = String(input.role || '').trim()
  if (!/^did:web:[^\s]+$/u.test(organizationDidWeb)) throw new TypeError('Organization did:web is required')
  if (!role) throw new TypeError('Organization employee role is required')
  const stableActor = buildStableActorIdentifier(input).slice('urn:multibase:'.length)
  return [organizationDidWeb, 'employee', stableActor, role, input.deviceId?.trim()]
    .filter(Boolean).join(':')
}
