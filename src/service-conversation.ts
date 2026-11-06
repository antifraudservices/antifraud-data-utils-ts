export const AuthoritativeServiceSystem = Object.freeze({
  Ehr: 'ehr',
  Cms: 'cms',
  DocumentManagementSystem: 'document-management-system',
  Other: 'other',
} as const)

export type AuthoritativeServiceSystem = typeof AuthoritativeServiceSystem[keyof typeof AuthoritativeServiceSystem]

export type ServiceSubjectIndexReference = Readonly<{
  label: string
  href: string
  mediaType?: string
}>

export type ServiceSubjectIndexUpdate = Readonly<{
  id: string
  createdAt: string
  content: Readonly<{
    kind: 'subject-index-update'
    organizationReference: string
    serviceReference: string
    serviceName: string
    authoritativeSystem: AuthoritativeServiceSystem
    references: readonly ServiceSubjectIndexReference[]
  }>
}>

/**
 * Builds the presentation-neutral event emitted into the subject's
 * application conversation after an authorized service updates its index.
 * It carries links and labels only; authority, access and the indexed data
 * remain owned by the service host.
 */
export function buildServiceSubjectIndexUpdate(input: Readonly<{
  id: string
  createdAt: string
  organizationReference: string
  serviceReference: string
  serviceName: string
  authoritativeSystem: AuthoritativeServiceSystem
  references: readonly ServiceSubjectIndexReference[]
}>): ServiceSubjectIndexUpdate {
  const id = required(input.id, 'id')
  const createdAt = required(input.createdAt, 'createdAt')
  if (!Number.isFinite(Date.parse(createdAt))) throw new TypeError('createdAt must be an ISO date-time')
  const organizationReference = required(input.organizationReference, 'organizationReference')
  const serviceReference = required(input.serviceReference, 'serviceReference')
  const serviceName = required(input.serviceName, 'serviceName')
  if (!Object.values(AuthoritativeServiceSystem).includes(input.authoritativeSystem)) {
    throw new TypeError('authoritativeSystem is invalid')
  }
  if (!input.references.length) throw new TypeError('references must contain at least one governed link')
  const references = Object.freeze(input.references.map((reference, index) => {
    const href = required(reference.href, `references[${index}].href`)
    const url = new URL(href)
    if (url.protocol !== 'https:') throw new TypeError(`references[${index}].href must use https`)
    if (url.username || url.password) throw new TypeError(`references[${index}].href must not contain credentials`)
    return Object.freeze({
      label: required(reference.label, `references[${index}].label`),
      href: url.href,
      ...(reference.mediaType ? { mediaType: required(reference.mediaType, `references[${index}].mediaType`) } : {}),
    })
  }))
  return Object.freeze({
    id,
    createdAt: new Date(createdAt).toISOString(),
    content: Object.freeze({
      kind: 'subject-index-update' as const,
      organizationReference,
      serviceReference,
      serviceName,
      authoritativeSystem: input.authoritativeSystem,
      references,
    }),
  })
}

function required(value: string, field: string): string {
  const normalized = String(value || '').trim()
  if (!normalized) throw new TypeError(`${field} is required`)
  return normalized
}
