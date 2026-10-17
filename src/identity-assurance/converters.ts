import type {
  FlatClaims,
  ImportedIdentityAssurance,
  JsonValue,
  Oidc4IdaVerification,
  Oidc4IdaVerifiedClaims,
} from './types.js'
import {
  SchemaOrgToOidcIdentityClaim,
  type OidcIdentityClaimValue,
  type SchemaOrgIdentityClaimValue,
} from './vocabulary.js'

const OidcToSchemaOrgIdentityClaim = Object.freeze(Object.fromEntries(
  Object.entries(SchemaOrgToOidcIdentityClaim).map(([schemaOrgClaim, oidcClaim]) => [oidcClaim, schemaOrgClaim]),
) as Readonly<Record<OidcIdentityClaimValue, SchemaOrgIdentityClaimValue>>)

function valuesEqual(left: JsonValue, right: JsonValue): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

export function projectSchemaOrgFlatClaimsToOidc4Ida(input: Readonly<{
  claims: FlatClaims
  verification: Oidc4IdaVerification
}>): Oidc4IdaVerifiedClaims {
  const claims: Record<string, JsonValue> = {}
  for (const [claim, value] of Object.entries(input.claims)) {
    const oidcClaim = SchemaOrgToOidcIdentityClaim[claim as SchemaOrgIdentityClaimValue]
    if (!oidcClaim) {
      throw new TypeError(`No governed OIDC4IDA mapping exists for Schema.org flat claim: ${claim}`)
    }
    claims[oidcClaim] = value
  }
  return Object.freeze({
    claims: Object.freeze(claims),
    verification: input.verification,
  })
}

export function importOidc4IdaToSchemaOrgFlatClaims(input: Readonly<{
  verifiedClaims: Oidc4IdaVerifiedClaims
  existingClaims?: FlatClaims
}>): ImportedIdentityAssurance {
  const existingClaims = input.existingClaims ?? {}
  const claims: Record<string, JsonValue> = {}
  const conflicts: ImportedIdentityAssurance['conflicts'][number][] = []
  const unmappedClaims: string[] = []

  for (const [oidcClaim, importedValue] of Object.entries(input.verifiedClaims.claims)) {
    const schemaOrgClaim = OidcToSchemaOrgIdentityClaim[oidcClaim as OidcIdentityClaimValue]
    if (!schemaOrgClaim) {
      unmappedClaims.push(oidcClaim)
      continue
    }
    const existingValue = existingClaims[schemaOrgClaim]
    if (existingValue !== undefined) {
      if (!valuesEqual(existingValue, importedValue)) {
        conflicts.push({ claim: schemaOrgClaim, existingValue, importedValue })
      }
      continue
    }
    claims[schemaOrgClaim] = importedValue
  }

  return Object.freeze({
    claims: Object.freeze(claims),
    verification: input.verifiedClaims.verification,
    conflicts: Object.freeze(conflicts),
    unmappedClaims: Object.freeze(unmappedClaims),
  })
}
