// Flow contract: public discovery groups one item with territorial offers; geography never establishes authority or device operation.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readPublicOfferingCatalog, readPublicOfferingCatalogJson, searchPublicOfferingCatalog, projectPublicOfferingJsonLd} from '../dist/public-offering-catalog.js'

const offer = (id, country, regions = []) => ({id, seller: {id: `seller-${id}`, name: `Distributor ${id}`}, eligibleRegions: [{country, regions}], deliveryCountries: [country], operationCountries: [], supportCountries: []})
const item = {id: 'tracker', type: 'Product', category: 'devices', sector: 'animal-care', name: 'Example tracker', description: 'Animal monitoring device', publisher: {id: 'publisher', name: 'Example manufacturer'}, demo: true, offers: [offer('one', 'ES'), offer('two', 'CA', ['CA-BC'])]}

test('finds one product with matching distributor offers, independently of publisher location', () => {
  const catalog = readPublicOfferingCatalog([item])
  assert.equal(searchPublicOfferingCatalog(catalog, {}).length, 1)
  assert.equal(searchPublicOfferingCatalog(catalog, {country: 'CA'})[0].offers[0].seller.name, 'Distributor two')
  assert.equal(searchPublicOfferingCatalog(catalog, {country: 'CA', region: 'CA-ON'}).length, 0)
  assert.equal(searchPublicOfferingCatalog(catalog, {country: 'ES', region: 'ES-MD'})[0].offers.length, 1)
  assert.equal(searchPublicOfferingCatalog(catalog, {query: 'Distributor two'}).length, 1)
  assert.equal(searchPublicOfferingCatalog(catalog, {query: 'Distributor two'})[0].offers.length, 1)
  assert.equal(searchPublicOfferingCatalog(catalog, {category: 'insurance'}).length, 0)
  assert.equal(searchPublicOfferingCatalog(catalog, {sector: 'health-care'}).length, 0)
})

test('requires a country for subdivisions and rejects ambiguous or conflicting catalogue data', () => {
  assert.throws(() => searchPublicOfferingCatalog([item], {region: 'CA-BC'}))
  assert.throws(() => readPublicOfferingCatalog([item, item]))
  assert.throws(() => readPublicOfferingCatalog([{...item, offers: [offer('one', 'CA', ['ES-MD'])]}]))
  assert.throws(() => readPublicOfferingCatalog([{...item, url: 'javascript:alert(1)'}]))
  assert.throws(() => readPublicOfferingCatalog([{...item, offers: [offer('one', 'CA'), offer('one', 'ES')]}]))
  assert.throws(() => readPublicOfferingCatalog([{...item, verified: true}]))
})

test('projects product and seller offers without declaring an API or clinical certification', () => {
  const json = projectPublicOfferingJsonLd(readPublicOfferingCatalog([item])[0])
  assert.equal(json['@type'], 'Product')
  assert.equal(json.offers.length, 2)
  assert.equal(json.offers[1].seller['@type'], 'Organization')
  assert.equal(json.offers[1].eligibleRegion[0].identifier, 'CA-BC')
  assert.equal(json.offers[0].itemOffered['@id'], 'tracker')
  assert.equal('areaServed' in json, false)
})

test('keeps the manufacturer, publisher and territorial sellers independent', () => {
  const manufacturer = {id:'manufacturer', name:'Example device maker'}
  const [product] = readPublicOfferingCatalog([{...item, manufacturer}])
  assert.equal(searchPublicOfferingCatalog([product], {query:manufacturer.name})[0].offers.length, 2)
  const json = projectPublicOfferingJsonLd(product)
  assert.equal(json.manufacturer.name, manufacturer.name)
  assert.equal(json.offers[1].seller.name, 'Distributor two')
  assert.throws(() => readPublicOfferingCatalog([{...item, type:'Service', manufacturer}]))
})

test('configured public feeds keep Demo entries out of Network and bound configuration size', () => {
  assert.deepEqual(readPublicOfferingCatalogJson(undefined, false), [])
  assert.throws(() => readPublicOfferingCatalogJson(JSON.stringify([item]), false))
  assert.equal(readPublicOfferingCatalogJson(JSON.stringify([item]), true)[0].demo, true)
  assert.throws(() => readPublicOfferingCatalogJson(' '.repeat(1_000_001), true))
})

test('accepts a JSON:API Demo resource and projects ordered photos, brand and explicit billing prices', () => {
  const {id, type, ...attributes} = item
  const cover = new URL('/cover.png', 'https://example.invalid').href
  const alternate = new URL('/alternate.png', cover).href
  const offer = {...attributes.offers[0], plans:[{name:'Basic', currency:'EUR', monthly:'3.95', features:['Monitoring']}]}
  const data = [{id, type, attributes:{...attributes, brand:{name:'Tracker',logoUrl:alternate},images:[cover,alternate],offers:[offer]}}]
  const [result] = readPublicOfferingCatalogJson(JSON.stringify({data}), true)
  const projection = projectPublicOfferingJsonLd(result)
  assert.deepEqual(projection.image, [cover,alternate])
  assert.equal(projection.brand['@type'], 'Brand')
  assert.deepEqual(projection.offers[0].priceSpecification.map(value => [value.price,value.unitCode]), [['3.95','MON']])
  assert.throws(() => readPublicOfferingCatalog([{...item,images:['javascript:alert(1)']}]))
})
