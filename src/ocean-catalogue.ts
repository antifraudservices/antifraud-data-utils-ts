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

/** Original publisher JSON for private storage. Keep it outside catalogue documents and messages. */
export type OceanDatasetSource = Readonly<{ json: string; landingPage?: string }>

/** Imports a DDO and retains its original JSON, including fields absent from the public catalogue. */
export function captureOceanDataset(source: OceanDatasetSource): Readonly<{
  entries: readonly CatalogueEntry[]
  source: OceanDatasetSource
}> {
  const { json, landingPage } = source
  const entries = projectOceanDatasetEntries({ ddo: JSON.parse(json), landingPage })
  return { entries, source: { json, landingPage } }
}

function canonicalEntry(entry: CatalogueEntry): string {
  return JSON.stringify(entry, (_key, value: unknown) => {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
    const record = value as JsonObject
    return Object.fromEntries(Object.keys(record).sort().map(key => [key, record[key]]))
  })
}

/** Recovers the exact original JSON when the dataset's public entries still match the imported DDO. */
export function restoreOceanDataset(entries: readonly CatalogueEntry[], source: OceanDatasetSource): string {
  const { entries: expected } = captureOceanDataset(source)
  const expectedEntries = new Set(expected.map(canonicalEntry))
  if (entries.length !== expectedEntries.size || entries.some(entry => !expectedEntries.delete(canonicalEntry(entry)))) {
    throw new TypeError('Catalogue no longer matches the original Ocean dataset')
  }
  return source.json
}

/** Portable Schema.org dataset metadata. Access and compute services travel in the catalogue separately. */
export type SchemaOrgOceanDataset = Readonly<{
  '@context'?: 'https://schema.org'
  '@type': 'Dataset'
  identifier: string
  name: string
  description?: string
  license?: string
  url?: string
}>

/** Reads the Schema.org metadata of the selected dataset from a catalogue projection. */
export function toSchemaOrgDataset(entries: readonly CatalogueEntry[], datasetId: string): SchemaOrgOceanDataset {
  const dataset = entries.find(entry => entry.type === 'Dataset' && entry.id === datasetId)
  if (!dataset) throw new TypeError('Catalogue dataset was not found')
  const { title, description, license, landingPage } = dataset.attributes
  const url = publicUrl(landingPage, 'landing page')
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    identifier: dataset.id,
    name: text(title, 'dataset title'),
    ...(description === undefined ? {} : { description: text(description, 'dataset description') }),
    ...(license === undefined ? {} : { license: text(license, 'dataset license') }),
    ...(url === undefined ? {} : { url }),
  }
}

/** Public service metadata passed to the publisher to combine with its access and pricing configuration. */
export type OceanPublicationService = Readonly<{
  id: string
  type: 'access' | 'compute'
  serviceEndpoint: string
  name?: string
  description?: string
}>

type OceanAssetBuilder<Service, Asset> = {
  setType(type: 'dataset'): unknown
  setName(name: string): unknown
  setDescription(description: string): unknown
  setLicense(license: string): unknown
  setAuthor(author: string): unknown
  setProvidedBy?(provider: string): unknown
  addService(service: Service): unknown
  build(): Asset
}

/** Builds the input to the caller's Ocean SDK using a fresh asset builder and its configured service factory.
 * The SDK assigns the new DID and signs/publishes the resulting asset. Source IDs only link catalogue records.
 */
export function buildOceanDatasetPublication<Service, Asset>(
  dataset: SchemaOrgOceanDataset,
  entries: readonly CatalogueEntry[],
  settings: Readonly<{ version: string; author: string; providedBy?: string }>,
  builders: Readonly<{
    asset: OceanAssetBuilder<Service, Asset>
    createService(service: OceanPublicationService): Service
  }>,
): Asset {
  if (dataset['@type'] !== 'Dataset') throw new TypeError('Expected a Schema.org Dataset')
  if (!/^[45]\.\d+\.\d+$/u.test(settings.version)) throw new TypeError('Unsupported Ocean DDO version')
  const id = text(dataset.identifier, 'dataset identifier')
  const name = text(dataset.name, 'dataset name')
  const description = text(dataset.description, 'dataset description')
  const license = text(dataset.license, 'dataset license')
  const author = text(settings.author, 'asset author')
  const { asset, createService } = builders
  const provider = settings.version.startsWith('5.') ? text(settings.providedBy, 'asset provider') : undefined
  if (provider !== undefined && !asset.setProvidedBy) throw new TypeError('DDO v5 requires an asset builder with provider support')
  const selected = entries.filter(entry => entry.type === 'DataService' && entry.relationships?.servesDataset.data.id === id)
  if (selected.length === 0) throw new TypeError('Publishing requires at least one data service')
  const { data } = buildCataloguePrimaryDocument(selected)
  const services = data.map((entry): OceanPublicationService => {
    const { serviceType, endpointURL, title, description: detail } = entry.attributes
    if (serviceType !== 'access' && serviceType !== 'compute') throw new TypeError('Unsupported Ocean service type')
    const serviceEndpoint = publicUrl(endpointURL, 'service endpoint')
    if (!serviceEndpoint) throw new TypeError('Ocean service endpoint is required')
    return {
      id: entry.id,
      type: serviceType,
      serviceEndpoint,
      ...(title === undefined ? {} : { name: text(title, 'service title') }),
      ...(detail === undefined ? {} : { description: text(detail, 'service description') }),
    }
  }).map(createService)
  asset.setType('dataset')
  asset.setName(name)
  asset.setDescription(description)
  asset.setLicense(license)
  asset.setAuthor(author)
  if (provider !== undefined) asset.setProvidedBy?.(provider)
  for (const service of services) asset.addService(service)
  return asset.build()
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
