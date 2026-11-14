// Flow contract: education and other sector consumers share neutral wire contracts while endpoint validation and authorization remain outside these data types.
import type {
  SchemaOrgPersonClaimKey, SchemaOrgOrganizationClaimKey, SchemaOrgActionClaimKey,
  OidcClientRegistrationRequest, OidcClientRegistrationResponse,
  RegisteredDeviceInfo, DeviceClientRegistrationRequest, JwtRegisteredClaims, ClientAccessTokenClaims,
} from 'antifraud-data-utils-ts'
import { SchemaOrgPersonClaim, SchemaOrgOrganizationClaim, SchemaOrgActionClaim } from 'antifraud-data-utils-ts'
const personKey: SchemaOrgPersonClaimKey = SchemaOrgPersonClaim.OccupationIdentifierValue
const organizationKey: SchemaOrgOrganizationClaimKey = SchemaOrgOrganizationClaim.LegalName
const actionKey: SchemaOrgActionClaimKey = SchemaOrgActionClaim.AgentIdentifier
const registration: OidcClientRegistrationRequest = { redirect_uris: [], application_type: 'web', token_endpoint_auth_method: 'private_key_jwt', software_id: 'org.example.application', software_version: '1', jwks: { keys: [] } }
const device: RegisteredDeviceInfo = { device_id: 'device-example', device_name: 'Example browser', push_provider: 'web' }
const deviceRegistration: DeviceClientRegistrationRequest = { ...registration, ext_device_info: device }
const result: OidcClientRegistrationResponse = { client_id: 'client-example', client_id_issued_at: 1 }
const registered: JwtRegisteredClaims = { aud: ['audience-one', 'audience-two'], nbf: 1, jti: 'token-example' }
const access: ClientAccessTokenClaims = { iss: 'did:example:issuer', sub: 'did:example:subject', aud: 'audience-one', exp: 2, iat: 1, scope: 'profile', client_id: result.client_id }
// @ts-expect-error the standard metadata subset does not silently include a device extension
const wrongStandard: OidcClientRegistrationRequest = { redirect_uris: [], ext_device_info: device }
// @ts-expect-error the application profile requires a scope and client identity
const incompleteAccess: ClientAccessTokenClaims = { iss: access.iss, sub: access.sub, aud: access.aud, exp: 2, iat: 1 }
// @ts-expect-error registered numeric dates are numbers, not strings
const wrongDate: JwtRegisteredClaims = { exp: '2' }
// @ts-expect-error device metadata requires a stable device identifier independently of push delivery
const pushOnlyDevice: RegisteredDeviceInfo = { device_name: 'Example browser', push_token: 'delivery-example' }
// @ts-expect-error flat claim identity remains a finite governed vocabulary
const wrongClaim: SchemaOrgPersonClaimKey = 'unregistered-field'
void [personKey, organizationKey, actionKey, deviceRegistration, registered, access, wrongStandard, incompleteAccess, wrongDate, pushOnlyDevice, wrongClaim]
