/** Capabilities that an authoritative tenant may publish at its endpoint. */
export const ClearingHouseTenantCapability = Object.freeze({
  Employer: 'employer',
  IndexProvider: 'index-provider',
  Verifier: 'verifier',
} as const)

export type ClearingHouseTenantCapabilityValue =
  typeof ClearingHouseTenantCapability[keyof typeof ClearingHouseTenantCapability]

export type ClearingHouseTenantDescriptor = Readonly<{
  tenantReference: string
  endpoint: string
  capabilities: readonly ClearingHouseTenantCapabilityValue[]
}>

export type AuthoritativeTenantEndpointSelection = Readonly<{
  trust: 'home-tenant' | 'federated-tenant'
  tenantReference: string
  endpoint: string
}>

/**
 * Selects one tenant-published authoritative endpoint. The home tenant is the
 * only implicit trust root; every external source requires an explicit
 * federation-trust entry and the advertised source capability.
 */
export function selectAuthoritativeTenantEndpoint(input: Readonly<{
  homeTenantReference: string
  sourceTenant: ClearingHouseTenantDescriptor
  requiredCapability: ClearingHouseTenantCapabilityValue
  trustedFederatedTenantReferences: readonly string[]
}>): AuthoritativeTenantEndpointSelection {
  if (!input.sourceTenant.capabilities.includes(input.requiredCapability)) {
    throw new TypeError(`Source tenant does not advertise capability: ${input.requiredCapability}`)
  }
  let endpoint: URL
  try {
    endpoint = new URL(input.sourceTenant.endpoint)
  } catch {
    throw new TypeError('Authoritative tenant endpoint must be an absolute HTTPS URL')
  }
  if (endpoint.protocol !== 'https:') {
    throw new TypeError('Authoritative tenant endpoint must be an absolute HTTPS URL')
  }

  const isHomeTenant = input.sourceTenant.tenantReference === input.homeTenantReference
  if (!isHomeTenant
    && !input.trustedFederatedTenantReferences.includes(input.sourceTenant.tenantReference)) {
    throw new TypeError('Source tenant is not trusted by the home tenant')
  }

  return Object.freeze({
    trust: isHomeTenant ? 'home-tenant' : 'federated-tenant',
    tenantReference: input.sourceTenant.tenantReference,
    endpoint: endpoint.toString().replace(/\/$/, ''),
  })
}
