// Flow contract: public registry discovery filters real source projections without granting membership; exact identifiers stay server-side; nearby results require reviewed geographic coordinates and are sorted before limiting.
import test from 'node:test'
import assert from 'node:assert/strict'
import {searchPublicRegistry,parsePublicRegistryQuery,distanceKm} from '../dist/public-registry-search.js'

const source={authority:'Example authority',url:'https://example.invalid/registry',checkedAt:'2026-11-17T00:00:00Z'}
const entries=[
 {id:'far',registrationNumber:'EX-2',address:'Calle Ejemplo 20',municipality:'Alcalá',postalCode:'00000',source,geo:{latitude:40.1,longitude:-3}},
 {id:'near',registrationNumber:'EX-1',address:'Calle Ejemplo 10',municipality:'Alcalá',postalCode:'00000',source,geo:{latitude:40,longitude:-3}},
 {id:'unlocated',registrationNumber:'EX-3',address:'Other street',municipality:'Other',postalCode:'00001',source},
]
test('combines accent-insensitive address/locality with exact identifier lookup without disclosure',()=>{
 const result=searchPublicRegistry(entries,{municipality:'alcala',address:'ejemplo',identifier:'example-id'},new Map([['EXAMPLE-ID',new Set(['near'])]]))
 assert.deepEqual(result.entries.map(e=>e.id),['near'])
 assert.equal(JSON.stringify(result).includes('EXAMPLE-ID'),false)
 assert.equal(searchPublicRegistry(entries,{identifier:'absent'}).total,0)
 assert.equal(searchPublicRegistry(entries,{postalCode:'00001'}).total,1)
})
test('filters and sorts before pagination, omits unknown coordinates and preserves straight-line distances',()=>{
 const result=searchPublicRegistry(entries,{near:{latitude:40,longitude:-3,radiusKm:20},limit:1})
 assert.equal(result.total,2)
 assert.equal(result.entries[0].id,'near')
 assert.equal(result.entries[0].distanceKm,0)
 assert.equal(result.unlocatedCount,1)
 assert.ok(Math.abs(distanceKm({latitude:0,longitude:0},{latitude:0,longitude:1})-111.195)<.01)
 assert.throws(()=>searchPublicRegistry([entries[2]],{near:{latitude:40,longitude:-3,radiusKm:5}}),/coordinates_unavailable/)
})
test('rejects incomplete, non-finite, out-of-range and unbounded location requests',()=>{
 for(const query of ['latitude=40','latitude=&longitude=0&radiusKm=1','latitude=91&longitude=0&radiusKm=5','latitude=0&longitude=181&radiusKm=5','latitude=0&longitude=0&radiusKm=0','latitude=0&longitude=0&radiusKm=201','limit=101','latitude=0&latitude=1&longitude=0&radiusKm=5','identifier=one&identifier=two']){
  assert.throws(()=>parsePublicRegistryQuery(new URLSearchParams(query)))
 }
 assert.deepEqual(parsePublicRegistryQuery(new URLSearchParams('municipality=Madrid&latitude=40&longitude=-3&radiusKm=5')).near,{latitude:40,longitude:-3,radiusKm:5})
 assert.throws(()=>searchPublicRegistry(entries,{near:{latitude:NaN,longitude:0,radiusKm:1}}))
})
