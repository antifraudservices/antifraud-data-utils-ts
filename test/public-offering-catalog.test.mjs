// Flow contract: review one kind of Schema.org offering at a time before publication, then group public listings with their eligible territorial offers.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import * as catalog from '../dist/public-offering-catalog.js'
const {readPublicOfferingCatalog, readPublicOfferingCatalogJson, searchPublicOfferingCatalog, projectPublicOfferingJsonLd} = catalog

const offer = (id, country, regions = []) => ({id, seller: {id: `seller-${id}`, name: `Distributor ${id}`}, eligibleRegions: [{country, regions}], deliveryCountries: [country], operationCountries: [], supportCountries: []})
const item = {id: 'tracker', type: 'Product', category: 'devices', sector: 'animal-care', name: 'Example tracker', description: 'Animal monitoring device', publisher: {id: 'publisher', name: 'Example manufacturer'}, demo: true, offers: [offer('one', 'ES'), offer('two', 'CA', ['CA-BC'])]}

test('opens a single resource or ordered homogeneous batch as drafts without publishing incomplete data', () => {
  const image = 'https://example.invalid/tracker.png'
  const first = {type:'https://schema.org/Product', attributes:{name:'Tracker', image, brand:'Example brand'}}
  const second = {type:'Product', id:'existing-tracker', attributes:{category:'devices', offers:item.offers}}
  const read = data => catalog.readPublicOfferingDraftDocument({jsonapi:{version:'1.1'},data}, () => 'new-tracker')
  const [draft, existing] = read([first,second]).data
  assert.deepEqual(draft,{type:'Product',id:'new-tracker',attributes:{name:'Tracker',images:[image],brand:{name:'Example brand'}}})
  assert.deepEqual(existing,second)
  assert.deepEqual(read(first).data,[draft])
  assert.throws(()=>read([first,{type:'Service',id:'visit',attributes:{name:'Consultation'}}]), {message:'public_offering_draft_mixed_types'})
  assert.throws(()=>read([second,second]), {message:'public_offering_catalog_invalid'})
  assert.throws(()=>read({...first,attributes:{...first.attributes,images:[image]}}), {message:'public_offering_catalog_invalid'})
  assert.throws(()=>read({...first,attributes:{...first.attributes,controllerEmail:'private'}}), {message:'public_offering_catalog_invalid'})
  assert.throws(()=>catalog.readPublicOfferingSubmission(read(first),item), {message:'public_offering_catalog_invalid'})
})

test('opens existing listings in the same draft format while keeping identifiers and all editable offer data', () => {
  const listing = {...item, brand:{name:'Tracker'}, images:['https://example.invalid/tracker.png']}
  const [original] = readPublicOfferingCatalog([listing])
  const {id,type,publisher,sector,demo,...attributes} = original
  const document = catalog.projectPublicOfferingDraftDocument([original])
  assert.deepEqual(document,{jsonapi:{version:'1.1'},data:[{id,type,attributes}]})
  assert.deepEqual(catalog.readPublicOfferingSubmission(document,{publisher,sector,demo}),[original])
})

test('maps Schema.org image, brand, manufacturer, territory and recurring price attributes into editable fields',()=>{
  const original={...item,manufacturer:{id:'maker',name:'Example maker'},brand:{name:'Tracker',logoUrl:'https://example.invalid/logo.png'},
    images:['https://example.invalid/image.png'],offers:[{...item.offers[1],plans:[{
      name:'Basic',currency:'EUR',features:[],monthly:'3.95',annually:'39.50',
    }]}]}
  const attributes=catalog.projectPublicOfferingJsonLd(original)
  const document=catalog.readPublicOfferingDraftDocument({data:{id:original.id,type:'Product',attributes}})
  const [published]=catalog.readPublicOfferingSubmission(document,original)
  assert.deepEqual(published.brand,original.brand)
  assert.deepEqual(published.manufacturer,original.manufacturer)
  assert.deepEqual(published.images,original.images)
  assert.deepEqual(published.offers[0].eligibleRegions,original.offers[0].eligibleRegions)
  assert.deepEqual(published.offers[0].plans,original.offers[0].plans)
})

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

test('binds a CRM submission to the trusted publisher scope and preserves territorial sellers and prices', () => {
  const {id, type, publisher, sector, demo, ...input} = item
  const scope = {publisher, sector, demo}
  const manufacturer = {id:'manufacturer', name:'Device designer'}
  const attributes = {...input, manufacturer, offers: [{...input.offers[0], plans: [
    {name:'Basic', currency:'EUR', monthly:'3.95', features:['Monitoring']},
  ]}, input.offers[1]]}
  const document = {jsonapi:{version:'1.1'}, data:[{id, type, attributes}]}
  const [submitted] = catalog.readPublicOfferingSubmission(document, scope)
  assert.deepEqual(catalog.readPublicOfferingSubmission({data: document.data[0]}, scope), [submitted])
  assert.deepEqual(submitted.publisher, publisher)
  assert.equal(submitted.sector, sector)
  assert.equal(submitted.demo, demo)
  assert.deepEqual(submitted.manufacturer, manufacturer)
  assert.equal(submitted.offers[0].plans[0].monthly, '3.95')
  assert.equal(submitted.offers[0].plans[0].annually, undefined)
  assert.equal(submitted.offers[1].seller.id, 'seller-two')
  const submit = changes => catalog.readPublicOfferingSubmission({data:[{id, type, attributes:{...attributes, ...changes}}]}, scope)
  assert.deepEqual(submit({publisher, sector, demo}), [submitted])
  for (const changes of [{publisher:{...publisher, id:'other'}}, {publisher:{...publisher, name:'Another organisation'}},
    {sector:'human-care'}, {demo:false}, {signature:'private'}, {controllerEmail:'private'}]) {
    assert.throws(() => submit(changes), {message:'public_offering_catalog_invalid'})
  }
  assert.throws(() => catalog.readPublicOfferingSubmission({data:[]}, scope))
  assert.throws(() => catalog.readPublicOfferingSubmission([item], scope))
  assert.throws(() => catalog.readPublicOfferingSubmission({...document, included:[{id:'private'}]}, scope))
  assert.throws(() => catalog.readPublicOfferingSubmission({data:[...document.data, ...document.data]}, scope))
})
