const catalogueResourceTypes = ['Dataset', 'DataService', 'Product', 'Service'] as const

/** A resource in the public catalogue exchange document. */
export type CatalogueEntry = Readonly<{
  type: typeof catalogueResourceTypes[number]
  id: string
  attributes: Readonly<Record<string, unknown>>
  relationships?: Readonly<{
    servesDataset: Readonly<{ data: Readonly<{ type: 'Dataset'; id: string }> }>
  }>
}>

export type CataloguePrimaryDocument = Readonly<{
  jsonapi: Readonly<{ version: '1.1' }>
  data: readonly CatalogueEntry[]
}>

type JsonObject = Record<string, unknown>

function object(value: unknown, field: string): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Expected an object for ${field}`)
  }
  return value as JsonObject
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`Expected text for ${field}`)
  return value.trim()
}

function localizedText(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'string') return text(value, field)
  const values = Array.isArray(value) ? value : [value]
  const translations = values.map(item => object(item, field))
  const selected = translations.find(item => item['@language'] === 'en') ?? translations[0]
  return text(selected?.['@value'], field)
}

function publicUrl(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined
  const parsed = new URL(text(value, field))
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new TypeError(`Expected a public HTTPS URL without embedded credentials for ${field}`)
  }
  return parsed.href
}

/** Projects an Ocean DDO v4 or v5 dataset to JSON:API entries with DCAT-aligned fields. Use a resolved
 * DDO from the trusted publisher; projection does not establish credential authenticity.
 */
export function projectOceanDatasetEntries(input: Readonly<{ ddo: unknown; landingPage?: string }>): readonly CatalogueEntry[] {
  const ddo = object(input.ddo, 'DDO')
  const version = text(ddo.version, 'DDO version')
  if (!/^[45]\.\d+\.\d+$/u.test(version)) throw new TypeError('Unsupported Ocean DDO version')
  const asset = version.startsWith('5.') ? object(ddo.credentialSubject, 'credentialSubject') : ddo
  const id = text(ddo.id, 'DDO id')
  if (!/^did:(?:op|ope):[A-Za-z0-9._-]+$/u.test(id) || (asset !== ddo && asset.id !== id)) {
    throw new TypeError('Invalid or mismatched Ocean asset identity')
  }
  const metadata = object(asset.metadata, 'metadata')
  if (metadata.type !== 'dataset') throw new TypeError('Ocean asset is not a dataset')
  const title = localizedText(metadata.displayTitle ?? metadata.name, 'dataset title')
  if (!title) throw new TypeError('Dataset title is required')
  const description = localizedText(metadata.description, 'dataset description')
  const licenseInput = metadata.license
  const license = licenseInput === undefined ? undefined
    : typeof licenseInput === 'string' ? text(licenseInput, 'license')
      : text(object(licenseInput, 'license').name, 'license name')
  const landingPage = publicUrl(input.landingPage, 'landing page')
  const dataset = {
    type: 'Dataset' as const, id,
    attributes: {
      identifier: id,
      title,
      ...(description === undefined ? {} : { description }),
      ...(license === undefined ? {} : { license }),
      ...(landingPage === undefined ? {} : { landingPage }),
    },
  }
  if (!Array.isArray(asset.services)) throw new TypeError('Ocean services must be an array')
  const serviceIds = new Set<string>()
  const services = asset.services.map((value): CatalogueEntry => {
    const service = object(value, 'service')
    const serviceId = text(service.id, 'service id')
    if (serviceIds.has(serviceId)) throw new TypeError('Duplicate Ocean service')
    serviceIds.add(serviceId)
    if (service.type !== 'access' && service.type !== 'compute') throw new TypeError('Unsupported Ocean service type')
    const endpoint = publicUrl(service.serviceEndpoint, 'service endpoint')
    if (endpoint === undefined) throw new TypeError('Ocean service endpoint is required')
    const name = localizedText(service.name, 'service title')
    const detail = localizedText(service.description, 'service description')
    return {
      type: 'DataService',
      id: `${id}#${encodeURIComponent(serviceId)}`,
      attributes: {
        serviceType: service.type,
        endpointURL: endpoint,
        ...(name === undefined ? {} : { title: name }),
        ...(detail === undefined ? {} : { description: detail }),
      },
      relationships: { servesDataset: { data: { type: dataset.type, id } } },
    }
  })
  return [dataset, ...services]
}

/** Builds a direct JSON:API catalogue document. Send each commercial offering type in its own batch. */
export function buildCataloguePrimaryDocument(entries: readonly CatalogueEntry[]): CataloguePrimaryDocument {
  if (entries.length === 0) throw new TypeError('Catalogue entries are required')
  const types = new Set(entries.map(entry => entry.type))
  if (types.size > 1 && (types.has('Product') || types.has('Service'))) {
    throw new TypeError('Mixed commercial catalogue batches are not supported')
  }
  const identities = new Set<string>()
  for (const entry of entries) {
    if (!catalogueResourceTypes.includes(entry.type)) throw new TypeError('Unsupported catalogue entry type')
    object(entry.attributes, 'catalogue entry attributes')
    const id = text(entry.id, 'catalogue entry id')
    if (id !== entry.id) throw new TypeError('Catalogue entry IDs must not contain surrounding whitespace')
    const key = JSON.stringify([entry.type, id])
    if (identities.has(key)) throw new TypeError('Duplicate catalogue entry')
    identities.add(key)
  }
  return { jsonapi: { version: '1.1' }, data: [...entries] }
}

/** Uses the primary document itself as the body of the caller's DIDComm envelope. */
export function withCatalogueBody<Envelope extends object>(
  envelope: Envelope & { readonly body?: never }, document: CataloguePrimaryDocument,
): Envelope & { body: CataloguePrimaryDocument } {
  return { ...envelope, body: document }
}
