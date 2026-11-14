import type { JwkSet } from './cryptography/types.js'

/** Registered JWT members only; no signature, issuer, audience or time validation is implied. */
export interface JwtRegisteredClaims {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
}

/** Existing client-bound access-token application profile, not the universe of OAuth access tokens. */
export interface ClientAccessTokenClaims extends JwtRegisteredClaims {
  iss: string
  sub: string
  aud: string
  exp: number
  iat: number
  scope: string
  client_id: string
}

/** OIDC client metadata subset used by current registration consumers. Endpoint validation is separate. */
export interface OidcClientRegistrationRequest {
  redirect_uris: string[]
  application_type?: 'native' | 'web'
  software_id?: string
  software_version?: string
  client_name?: string
  client_uri?: string
  token_endpoint_auth_method?: 'none' | 'private_key_jwt'
  grant_types?: ('authorization_code' | 'implicit' | 'refresh_token' | 'client_credentials')[]
  jwks_uri?: string
  jwks?: JwkSet
}

/** Registration response subset; neither accepting this shape nor decoding it authenticates a client. */
export interface OidcClientRegistrationResponse {
  client_id: string
  client_id_issued_at?: number
  client_secret?: string
  client_secret_expires_at?: number
  registration_access_token?: string
  registration_client_uri?: string
}

/** Application device extension; push delivery metadata does not establish client identity or a licence. */
export interface RegisteredDeviceInfo {
  device_id: string
  device_name: string
  push_token?: string
  push_provider?: string
}

/** Explicit extension boundary: ext_device_info is not standard OIDC client metadata. */
export interface DeviceClientRegistrationRequest extends OidcClientRegistrationRequest {
  ext_device_info?: RegisteredDeviceInfo
}

/** Existing device-registration profile always returns the client issuance time. */
export interface DeviceClientRegistrationResponse extends OidcClientRegistrationResponse {
  client_id_issued_at: number
}
