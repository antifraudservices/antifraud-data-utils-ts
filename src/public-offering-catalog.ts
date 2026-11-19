/** Public exchange projection only. Admission, authorization and private evidence are never catalogue fields. */
export type PublicOfferingParty = Readonly<{id: string; name: string}>
export type PublicOfferingTerritory = Readonly<{country: string; regions: readonly string[]}>
export type PublicSubscriptionPlan = Readonly<{
  name: string
  description?: string
  features: readonly string[]
  currency: string
  monthly?: string
  annually?: string
}>
export type PublicTerritorialOffer = Readonly<{
  id: string
  seller: PublicOfferingParty
  eligibleRegions: readonly PublicOfferingTerritory[]
  deliveryCountries: readonly string[]
  operationCountries: readonly string[]
  supportCountries: readonly string[]
  url?: string
  plans?: readonly PublicSubscriptionPlan[]
}>
export type PublicOffering = Readonly<{
  id: string
  type: 'Product' | 'Service' | 'SoftwareApplication'
  category: string
  sector: string
  name: string
  description: string
  publisher: PublicOfferingParty
  manufacturer?: PublicOfferingParty
  demo: boolean
  brand?: Readonly<{name: string; logoUrl?: string}>
  images?: readonly string[]
  url?: string
  offers: readonly PublicTerritorialOffer[]
}>
export type PublicOfferingQuery = Readonly<{sector?: string; category?: string; country?: string; region?: string; query?: string}>

export function publicOfferingMediaClaimKeys(type: 'Product' | 'Service') {
  const prefix = `org.schema.${type}`
  return {images:`${prefix}.image.contentUrl`, brand:`${prefix}.brand.name`, logo:`${prefix}.brand.logo.contentUrl`,
    plans:`${prefix}.additionalProperty.subscriptionPlans`}
}

const invalid = (): never => {throw new TypeError('public_offering_catalog_invalid')}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid()
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) return invalid()
  return value.trim()
}
function array(value: unknown): readonly unknown[] {
  if (!Array.isArray(value) || value.length > 1000) return invalid()
  return value
}
function keys(value: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid()
}
function country(value: unknown): string {
  const code = text(value).toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return invalid()
  return code
}
function countryList(value: unknown): readonly string[] {
  return Object.freeze([...new Set(array(value).map(country))])
}
function url(value: unknown): string {
  const result = text(value)
  const parsed = new URL(result)
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return invalid()
  return result
}
function party(value: unknown): PublicOfferingParty {
  const item = record(value)
  keys(item, ['id', 'name'])
  return Object.freeze({id: text(item.id), name: text(item.name)})
}
function territory(value: unknown): PublicOfferingTerritory {
  const item = record(value), code = country(item.country)
  keys(item, ['country', 'regions'])
  const regions = array(item.regions).map(value => {
    const region = text(value).toUpperCase()
    if (!new RegExp(`^${code}-[A-Z0-9]{1,3}$`).test(region)) return invalid()
    return region
  })
  return Object.freeze({country: code, regions: Object.freeze([...new Set(regions)])})
}
function offer(value: unknown): PublicTerritorialOffer {
  const item = record(value)
  keys(item, ['id', 'seller', 'eligibleRegions', 'deliveryCountries', 'operationCountries', 'supportCountries', 'url', 'plans'])
  const eligibleRegions = array(item.eligibleRegions).map(territory)
  if (!eligibleRegions.length) return invalid()
  return Object.freeze({id: text(item.id), seller: party(item.seller), eligibleRegions: Object.freeze(eligibleRegions),
    deliveryCountries: countryList(item.deliveryCountries), operationCountries: countryList(item.operationCountries), supportCountries: countryList(item.supportCountries),
    ...(item.url === undefined ? {} : {url: url(item.url)}),
    ...(item.plans === undefined ? {} : {plans: readPublicSubscriptionPlans(item.plans)}),
  })
}

export function readPublicSubscriptionPlans(value: unknown): readonly PublicSubscriptionPlan[] {
  const plans = array(value)
  if (plans.length > 12) return invalid()
  return Object.freeze(plans.map(value => {
    const plan = record(value)
    keys(plan, ['name', 'description', 'features', 'currency', 'monthly', 'annually'])
    const currency = text(plan.currency)
    if (!/^[A-Z]{3}$/.test(currency)) return invalid()
    const amount = (value: unknown) => {
      const price = text(value)
      if (!/^\d{1,8}(\.\d{1,4})?$/.test(price)) return invalid()
      return price
    }
    return Object.freeze({name: text(plan.name), currency, features: Object.freeze(array(plan.features).map(text)),
      ...(plan.description === undefined ? {} : {description: text(plan.description)}),
      ...(plan.monthly === undefined ? {} : {monthly: amount(plan.monthly)}),
      ...(plan.annually === undefined ? {} : {annually: amount(plan.annually)}),
    })
  }))
}
function uniqueIds(items: readonly {id: string}[]): void {
  if (new Set(items.map(item => item.id)).size !== items.length) invalid()
}

/** Strict allowlist prevents an operator accidentally publishing signatures, emails, grants or private evidence. */
export function readPublicOfferingCatalog(value: unknown): readonly PublicOffering[] {
  const items = array(value).map(value => {
    const item = record(value)
    keys(item, ['id', 'type', 'category', 'sector', 'name', 'description', 'publisher', 'manufacturer', 'demo', 'url', 'offers', 'brand', 'images'])
    if (item.type !== 'Product' && item.type !== 'Service' && item.type !== 'SoftwareApplication') return invalid()
    if (typeof item.demo !== 'boolean') return invalid()
    if (item.manufacturer !== undefined && item.type !== 'Product') return invalid()
    const offers = array(item.offers).map(offer)
    uniqueIds(offers)
    const media = readPublicOfferingMedia(item)
    return Object.freeze({id: text(item.id), type: item.type, category: text(item.category), sector: text(item.sector), name: text(item.name),
      description: text(item.description), publisher: party(item.publisher), demo: item.demo,
      ...(item.manufacturer === undefined ? {} : {manufacturer: party(item.manufacturer)}),
      ...(item.url === undefined ? {} : {url: url(item.url)}), ...media, offers: Object.freeze(offers),
    })
  })
  uniqueIds(items)
  return Object.freeze(items)
}

export function readPublicOfferingMedia(value: unknown): Pick<PublicOffering, 'brand' | 'images'> {
  const item = record(value)
  const media: {brand?: NonNullable<PublicOffering['brand']>; images?: readonly string[]} = {}
  if (item.brand !== undefined) {
    const brand = record(item.brand)
    keys(brand, ['name', 'logoUrl'])
    media.brand = Object.freeze({name: text(brand.name), ...(brand.logoUrl === undefined ? {} : {logoUrl: url(brand.logoUrl)})})
  }
  if (item.images !== undefined) {
    const images = array(item.images)
    if (images.length > 8) return invalid()
    media.images = Object.freeze([...new Set(images.map(url))])
  }
  return Object.freeze(media)
}

/** Demo operator overrides for an explicitly selected animal product. */
export function readPublicDemoOfferingCatalog(value: string | undefined, env: Readonly<Record<string, string | undefined>>): readonly PublicOffering[] {
  const catalog = readPublicOfferingCatalogJson(value, true)
  const id = env.DEMO_CATALOG_ANIMAL_PRODUCT_ID?.trim()
  if (!id) return catalog
  return readPublicOfferingCatalog(catalog.map(item => {
    if (item.id !== id || item.sector !== 'animal-care' || item.type !== 'Product') return item
    const name = env.DEMO_CATALOG_ANIMAL_PRODUCT_NAME?.trim() || item.name
    const logoUrl = env.DEMO_CATALOG_ANIMAL_PRODUCT_LOGO?.trim() || item.brand?.logoUrl
    const images = env.DEMO_CATALOG_ANIMAL_PRODUCT_IMAGES?.split(/[,\r\n]+/).map(image => image.trim()).filter(Boolean) ?? item.images
    return {...item, name, brand: {name: env.DEMO_CATALOG_ANIMAL_PRODUCT_BRAND?.trim() || item.brand?.name || name,
      ...(logoUrl ? {logoUrl} : {})}, ...(images ? {images} : {})}
  }))
}

/** Pure configuration reader. Real companies and territorial agreements stay in private host configuration. */
export function readPublicOfferingCatalogJson(value: string | undefined, demo: boolean): readonly PublicOffering[] {
  if (value === undefined) return Object.freeze([])
  if (value.length > 1_000_000) return invalid()
  const document: unknown = JSON.parse(value)
  const entries = Array.isArray(document) ? document : array(record(document).data).map(entry => {
    const resource = record(entry)
    keys(resource, ['id', 'type', 'attributes'])
    const attributes = record(resource.attributes)
    if ('id' in attributes || 'type' in attributes) return invalid()
    return {...attributes, id:resource.id, type:resource.type}
  })
  const catalog = readPublicOfferingCatalog(entries)
  if (catalog.some(item => item.demo !== demo)) return invalid()
  return catalog
}

/** Matching means a public territorial offer exists. It never grants service access or certifies connectivity. */
export function searchPublicOfferingCatalog(catalog: readonly PublicOffering[], query: PublicOfferingQuery): readonly PublicOffering[] {
  const selectedCountry = query.country ? country(query.country) : undefined
  const selectedRegion = query.region?.trim().toUpperCase()
  if (selectedRegion && (!selectedCountry || !new RegExp(`^${selectedCountry}-[A-Z0-9]{1,3}$`).test(selectedRegion))) invalid()
  const needle = query.query?.trim().toLocaleLowerCase() ?? ''
  return catalog.flatMap(item => {
    if (query.sector && item.sector !== query.sector || query.category && item.category !== query.category) return []
    let offers = item.offers.filter(offer => !selectedCountry || offer.eligibleRegions.some(area =>
      area.country === selectedCountry && (!selectedRegion || !area.regions.length || area.regions.includes(selectedRegion))))
    if (!offers.length) return []
    const searchable = [item.name, item.brand?.name, item.description, item.publisher.name, item.manufacturer?.name].join(' ').toLocaleLowerCase()
    if (needle && !searchable.includes(needle)) offers = offers.filter(offer => offer.seller.name.toLocaleLowerCase().includes(needle))
    if (!offers.length) return []
    return [Object.freeze({...item, offers: Object.freeze(offers)})]
  })
}

/** Schema.org exchange output; the product is not misrepresented as a DCAT DataService. */
export function projectPublicOfferingJsonLd(item: PublicOffering) {
  return {
    '@context': 'https://schema.org', '@type': item.type, '@id': item.id,
    name: item.name, description: item.description, category: item.category,
    ...(item.images?.length ? {image: item.images} : {}),
    ...(item.type === 'Product' && item.manufacturer ? {manufacturer: {'@type': 'Organization',
      '@id': item.manufacturer.id, name: item.manufacturer.name}} : {}),
    ...(item.brand && item.type !== 'SoftwareApplication' ? {brand: {'@type': 'Brand', name: item.brand.name,
      ...(item.brand.logoUrl ? {logo: item.brand.logoUrl} : {})}} : {}),
    ...(item.url ? {url: item.url} : {}),
    offers: item.offers.map(offer => ({
      '@type': 'Offer', '@id': offer.id, itemOffered: {'@id': item.id},
      seller: {'@type': 'Organization', '@id': offer.seller.id, name: offer.seller.name},
      eligibleRegion: offer.eligibleRegions.flatMap(area => area.regions.length
        ? area.regions.map(identifier => ({'@type': 'AdministrativeArea', identifier}))
        : [{'@type': 'Country', identifier: area.country}]),
      ...(offer.url ? {url: offer.url} : {}),
      ...(offer.plans?.length ? {priceSpecification: offer.plans.flatMap(plan => (
        [['MON', plan.monthly], ['ANN', plan.annually]] as const
      ).flatMap(([unitCode, price]) => price === undefined ? [] : [{
        '@type': 'UnitPriceSpecification', name: plan.name, price, priceCurrency: plan.currency,
        billingIncrement: 1, unitCode,
      }]))} : {}),
    })),
  }
}
