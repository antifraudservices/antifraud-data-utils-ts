export const SchemaOrgOrganizationClaim = Object.freeze({
  Identifier: 'org.schema.Organization.identifier.value',
  Name: 'org.schema.Organization.name',
  ParentOrganization: 'org.schema.Organization.parentOrganization.identifier',
} as const)

export const SchemaOrgPlaceClaim = Object.freeze({
  Identifier: 'org.schema.Place.identifier.value',
  Name: 'org.schema.Place.name',
  Department: 'org.schema.Place.department.identifier',
  ContainedInPlace: 'org.schema.Place.containedInPlace.identifier',
  Latitude: 'org.schema.Place.geo.latitude',
  Longitude: 'org.schema.Place.geo.longitude',
  Elevation: 'org.schema.Place.geo.elevation',
  AddressCountry: 'org.schema.Place.address.addressCountry',
  AddressRegion: 'org.schema.Place.address.addressRegion',
  AddressLocality: 'org.schema.Place.address.addressLocality',
  PostalCode: 'org.schema.Place.address.postalCode',
  StreetAddress: 'org.schema.Place.address.streetAddress',
} as const)

export const SchemaOrgServiceClaim = Object.freeze({
  Identifier: 'org.schema.Service.identifier.value',
  Name: 'org.schema.Service.name',
  Description: 'org.schema.Service.description',
  ServiceType: 'org.schema.Service.serviceType',
  Provider: 'org.schema.Service.provider.identifier',
  Department: 'org.schema.Service.department.identifier',
  AvailableAtOrFrom: 'org.schema.Service.availableAtOrFrom.identifier',
} as const)

export const DcatDatasetClaim = Object.freeze({
  Identifier: 'org.w3.dcat.Dataset.identifier',
  Version: 'org.w3.dcat.Dataset.version',
  Issued: 'org.w3.dcat.Dataset.issued',
  Modified: 'org.w3.dcat.Dataset.modified',
  Publisher: 'org.w3.dcat.Dataset.publisher.identifier',
  Jurisdiction: 'org.w3.dcat.Dataset.spatial.jurisdiction',
  Sector: 'org.w3.dcat.Dataset.theme.sector',
  AccessUrl: 'org.w3.dcat.Distribution.accessURL',
  MediaType: 'org.w3.dcat.Distribution.mediaType',
} as const)

export type PublicCatalogClaims = Readonly<Record<string, string | readonly string[]>>
export type PublicCatalogResource = Readonly<{
  resourceType: 'Organization' | 'Place' | 'Service'
  id: string
  meta: Readonly<{ claims: PublicCatalogClaims }>
}>
export type OrganizationCatalogDescriptor = Readonly<{
  id: string
  version: number
  publisherId: string
  jurisdiction: string
  sector: string
  accessUrl: string
  mediaType: 'application/vnd.api+json' | 'application/ld+json'
  modifiedAt: string
  status: 'active' | 'withdrawn'
}>
export type PublicOrganizationServiceCatalogInput = Readonly<{
  datasetId: string
  version: number
  issuedAt: string
  modifiedAt: string
  jurisdiction: string
  sector: string
  publisher: Readonly<{ id: string; name: string; publishInCatalog: boolean }>
  departments: readonly Readonly<{ id: string; name: string; publishInCatalog: boolean }>[]
  places: readonly Readonly<{
    id: string
    departmentId: string
    name: string
    publishInCatalog: boolean
    containedInPlaceId?: string
    geo?: Readonly<{ latitude: number; longitude: number; elevation?: number }>
    address?: Readonly<{ addressCountry?: string; addressRegion?: string; addressLocality?: string; postalCode?: string; streetAddress?: string }>
  }>[]
  services: readonly Readonly<{
    id: string
    departmentId: string
    name: string
    description?: string
    serviceType: string
    placeIds: readonly string[]
    publishInCatalog: boolean
  }>[]
  distribution: Readonly<{ accessUrl: string; mediaType: 'application/vnd.api+json' | 'application/ld+json' }>
}>
export type PublicOrganizationServiceCatalog = Readonly<{
  descriptor: OrganizationCatalogDescriptor
  dataset: Readonly<{ resourceType: 'Dataset'; id: string; meta: Readonly<{ claims: PublicCatalogClaims }> }>
  resources: readonly PublicCatalogResource[]
}>

export function buildPublicOrganizationServiceCatalog(input: PublicOrganizationServiceCatalogInput): PublicOrganizationServiceCatalog {
  const datasetId = identifier(input.datasetId, 'public_catalog_dataset_id_invalid')
  const version = positiveInteger(input.version, 'public_catalog_version_invalid')
  const issuedAt = instant(input.issuedAt, 'public_catalog_issued_at_invalid')
  const modifiedAt = instant(input.modifiedAt, 'public_catalog_modified_at_invalid')
  if (Date.parse(modifiedAt) < Date.parse(issuedAt)) throw new TypeError('public_catalog_modified_at_invalid')
  const jurisdiction = token(input.jurisdiction, 'public_catalog_jurisdiction_invalid').toUpperCase()
  const sector = token(input.sector, 'public_catalog_sector_invalid').toLowerCase()
  const publisherId = identifier(input.publisher.id, 'public_catalog_publisher_id_invalid')
  if (!input.publisher.publishInCatalog) throw new TypeError('public_catalog_publisher_not_public')
  assertUnique(input.departments.map(item => item.id), 'public_catalog_department_duplicate')
  assertUnique(input.places.map(item => item.id), 'public_catalog_place_duplicate')
  assertUnique(input.services.map(item => item.id), 'public_catalog_service_duplicate')

  const allDepartments = new Map(input.departments.map(item => [item.id, item]))
  const allPlaces = new Map(input.places.map(item => [item.id, item]))
  const departments = input.departments.filter(item => item.publishInCatalog)
  const places = input.places.filter(item => item.publishInCatalog)
  const publicDepartmentIds = new Set(departments.map(item => item.id))
  const publicPlaceIds = new Set(places.map(item => item.id))
  for (const place of places) {
    if (!allDepartments.has(place.departmentId)) throw new TypeError('public_place_department_not_found')
    if (!publicDepartmentIds.has(place.departmentId)) throw new TypeError('public_place_department_not_public')
    if (place.containedInPlaceId && !allPlaces.has(place.containedInPlaceId)) throw new TypeError('public_place_parent_not_found')
    if (place.containedInPlaceId && !publicPlaceIds.has(place.containedInPlaceId)) throw new TypeError('public_place_parent_not_public')
  }
  const services = input.services.filter(item => item.publishInCatalog)
  for (const service of services) {
    if (!allDepartments.has(service.departmentId)) throw new TypeError('public_service_department_not_found')
    if (!publicDepartmentIds.has(service.departmentId)) throw new TypeError('public_service_department_not_public')
    if (!service.placeIds.length) throw new TypeError('public_service_place_required')
    for (const placeId of service.placeIds) {
      const place = allPlaces.get(placeId)
      if (!place) throw new TypeError('public_service_place_not_found')
      if (!publicPlaceIds.has(placeId)) throw new TypeError('public_service_place_not_public')
      if (place.departmentId !== service.departmentId) throw new TypeError('public_service_place_department_mismatch')
    }
  }

  const descriptor: OrganizationCatalogDescriptor = Object.freeze({
    id: datasetId,
    version,
    publisherId,
    jurisdiction,
    sector,
    accessUrl: url(input.distribution.accessUrl, 'public_catalog_access_url_invalid'),
    mediaType: input.distribution.mediaType,
    modifiedAt,
    status: 'active',
  })
  const resources: PublicCatalogResource[] = [
    resource('Organization', publisherId, { [SchemaOrgOrganizationClaim.Identifier]: publisherId, [SchemaOrgOrganizationClaim.Name]: text(input.publisher.name, 'public_catalog_publisher_name_invalid') }),
    ...departments.map(item => resource('Organization', item.id, { [SchemaOrgOrganizationClaim.Identifier]: identifier(item.id, 'public_catalog_department_id_invalid'), [SchemaOrgOrganizationClaim.Name]: text(item.name, 'public_catalog_department_name_invalid'), [SchemaOrgOrganizationClaim.ParentOrganization]: publisherId })),
    ...places.map(placeResource),
    ...services.map(item => serviceResource(item, publisherId)),
  ]
  return Object.freeze({
    descriptor,
    dataset: Object.freeze({ resourceType: 'Dataset', id: datasetId, meta: Object.freeze({ claims: Object.freeze({
      [DcatDatasetClaim.Identifier]: datasetId,
      [DcatDatasetClaim.Version]: String(version),
      [DcatDatasetClaim.Issued]: issuedAt,
      [DcatDatasetClaim.Modified]: modifiedAt,
      [DcatDatasetClaim.Publisher]: publisherId,
      [DcatDatasetClaim.Jurisdiction]: jurisdiction,
      [DcatDatasetClaim.Sector]: sector,
      [DcatDatasetClaim.AccessUrl]: descriptor.accessUrl,
      [DcatDatasetClaim.MediaType]: descriptor.mediaType,
    }) }) }),
    resources: Object.freeze(resources),
  })
}

export type OrganizationCatalogCacheEntry = OrganizationCatalogDescriptor & Readonly<{ checkedAt: string }>
export type OrganizationCatalogCacheDecision = Readonly<{
  action: 'use-cache' | 'fetch' | 'revalidate' | 'evict' | 'reject'
  reason: 'fresh' | 'not-cached' | 'new-version' | 'stale' | 'withdrawn' | 'rollback-detected' | 'descriptor-mismatch'
}>

export function evaluateOrganizationCatalogCache(input: Readonly<{ cached?: OrganizationCatalogCacheEntry; discovered: OrganizationCatalogDescriptor; checkedAt: string; maxAgeSeconds: number }>): OrganizationCatalogCacheDecision {
  const checkedAt = instant(input.checkedAt, 'organization_catalog_cache_checked_at_invalid')
  if (!Number.isFinite(input.maxAgeSeconds) || input.maxAgeSeconds <= 0) throw new TypeError('organization_catalog_cache_max_age_invalid')
  if (input.discovered.status === 'withdrawn') return Object.freeze({ action: 'evict', reason: 'withdrawn' })
  if (!input.cached) return Object.freeze({ action: 'fetch', reason: 'not-cached' })
  if (input.cached.id !== input.discovered.id || input.cached.publisherId !== input.discovered.publisherId) return Object.freeze({ action: 'reject', reason: 'descriptor-mismatch' })
  if (input.discovered.version < input.cached.version) return Object.freeze({ action: 'reject', reason: 'rollback-detected' })
  if (input.discovered.version > input.cached.version || input.discovered.modifiedAt !== input.cached.modifiedAt || input.discovered.accessUrl !== input.cached.accessUrl) return Object.freeze({ action: 'fetch', reason: 'new-version' })
  const age = (Date.parse(checkedAt) - Date.parse(instant(input.cached.checkedAt, 'organization_catalog_cache_checked_at_invalid'))) / 1000
  if (age < 0) throw new TypeError('organization_catalog_cache_checked_at_invalid')
  return age <= input.maxAgeSeconds ? Object.freeze({ action: 'use-cache', reason: 'fresh' }) : Object.freeze({ action: 'revalidate', reason: 'stale' })
}

function placeResource(place: PublicOrganizationServiceCatalogInput['places'][number]): PublicCatalogResource {
  const claims: Record<string, string> = {
    [SchemaOrgPlaceClaim.Identifier]: identifier(place.id, 'public_catalog_place_id_invalid'),
    [SchemaOrgPlaceClaim.Name]: text(place.name, 'public_catalog_place_name_invalid'),
    [SchemaOrgPlaceClaim.Department]: identifier(place.departmentId, 'public_catalog_place_department_invalid'),
  }
  if (place.containedInPlaceId) claims[SchemaOrgPlaceClaim.ContainedInPlace] = identifier(place.containedInPlaceId, 'public_catalog_place_parent_invalid')
  if (place.geo) {
    claims[SchemaOrgPlaceClaim.Latitude] = coordinate(place.geo.latitude, -90, 90, 'public_catalog_place_latitude_invalid')
    claims[SchemaOrgPlaceClaim.Longitude] = coordinate(place.geo.longitude, -180, 180, 'public_catalog_place_longitude_invalid')
    if (place.geo.elevation !== undefined) claims[SchemaOrgPlaceClaim.Elevation] = finite(place.geo.elevation, 'public_catalog_place_elevation_invalid')
  }
  if (place.address) {
    optionalClaim(claims, SchemaOrgPlaceClaim.AddressCountry, place.address.addressCountry)
    optionalClaim(claims, SchemaOrgPlaceClaim.AddressRegion, place.address.addressRegion)
    optionalClaim(claims, SchemaOrgPlaceClaim.AddressLocality, place.address.addressLocality)
    optionalClaim(claims, SchemaOrgPlaceClaim.PostalCode, place.address.postalCode)
    optionalClaim(claims, SchemaOrgPlaceClaim.StreetAddress, place.address.streetAddress)
  }
  return resource('Place', place.id, claims)
}

function serviceResource(service: PublicOrganizationServiceCatalogInput['services'][number], publisherId: string): PublicCatalogResource {
  return resource('Service', service.id, {
    [SchemaOrgServiceClaim.Identifier]: identifier(service.id, 'public_catalog_service_id_invalid'),
    [SchemaOrgServiceClaim.Name]: text(service.name, 'public_catalog_service_name_invalid'),
    ...(service.description ? { [SchemaOrgServiceClaim.Description]: text(service.description, 'public_catalog_service_description_invalid') } : {}),
    [SchemaOrgServiceClaim.ServiceType]: token(service.serviceType, 'public_catalog_service_type_invalid'),
    [SchemaOrgServiceClaim.Provider]: publisherId,
    [SchemaOrgServiceClaim.Department]: identifier(service.departmentId, 'public_catalog_service_department_invalid'),
    [SchemaOrgServiceClaim.AvailableAtOrFrom]: Object.freeze([...new Set(service.placeIds.map(id => identifier(id, 'public_catalog_service_place_invalid')))]),
  })
}

function resource(resourceType: PublicCatalogResource['resourceType'], id: string, claims: Record<string, string | readonly string[]>): PublicCatalogResource {
  return Object.freeze({ resourceType, id: identifier(id, 'public_catalog_resource_id_invalid'), meta: Object.freeze({ claims: Object.freeze(claims) }) })
}
function optionalClaim(claims: Record<string, string>, claim: string, value?: string): void { if (value !== undefined) claims[claim] = text(value, 'public_catalog_place_address_invalid') }
function text(value: string, error: string): string { const normalized = value?.trim(); if (!normalized) throw new TypeError(error); return normalized }
function identifier(value: string, error: string): string { const normalized = text(value, error); if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(normalized)) throw new TypeError(error); return normalized }
function token(value: string, error: string): string { const normalized = text(value, error); if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u.test(normalized)) throw new TypeError(error); return normalized }
function instant(value: string, error: string): string { const normalized = text(value, error); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u.test(normalized) || Number.isNaN(Date.parse(normalized))) throw new TypeError(error); return normalized }
function positiveInteger(value: number, error: string): number { if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(error); return value }
function finite(value: number, error: string): string { if (!Number.isFinite(value)) throw new TypeError(error); return String(value) }
function coordinate(value: number, minimum: number, maximum: number, error: string): string { if (!Number.isFinite(value) || value < minimum || value > maximum) throw new TypeError(error); return String(value) }
function url(value: string, error: string): string { try { const parsed = new URL(value); if (parsed.protocol !== 'https:') throw new Error(); return parsed.toString() } catch { throw new TypeError(error) } }
function assertUnique(values: readonly string[], error: string): void { const normalized = values.map(value => identifier(value, error)); if (new Set(normalized).size !== normalized.length) throw new TypeError(error) }
