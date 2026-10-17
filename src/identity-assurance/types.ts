import type { SchemaOrgIdentityClaimValue } from './vocabulary.js'

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue }
export type FlatClaims = Readonly<Record<string, JsonValue>>

export type Oidc4IdaEvidence = Readonly<{
  type: string
  [key: string]: JsonValue
}>

export type Oidc4IdaVerification = Readonly<{
  trust_framework?: string | null
  assurance_level?: string | null
  assurance_process?: string | null
  verification_process?: string | null
  time?: string | null
  evidence: readonly Oidc4IdaEvidence[]
  [key: string]: JsonValue | undefined
}>

export type Oidc4IdaVerifiedClaims = Readonly<{
  claims: Readonly<Record<string, JsonValue>>
  verification: Oidc4IdaVerification
}>

export type IdentityClaimConflict = Readonly<{
  claim: SchemaOrgIdentityClaimValue
  existingValue: JsonValue
  importedValue: JsonValue
}>

export type ImportedIdentityAssurance = Readonly<{
  claims: FlatClaims
  verification: Oidc4IdaVerification
  conflicts: readonly IdentityClaimConflict[]
  unmappedClaims: readonly string[]
}>
