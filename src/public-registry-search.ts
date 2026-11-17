/** Public-source discovery projection. It is not an organization credential or a service publication. */
export type GeographicPoint = Readonly<{latitude:number; longitude:number}>
export type RegistryNear = GeographicPoint & Readonly<{radiusKm:number}>
export type PublicRegistryEntry = Readonly<{
  id:string
  registrationNumber:string
  name?:string
  address:string
  municipality:string
  postalCode:string
  classification?:string
  /** Only coordinates whose CRS and conversion have been reviewed may enter this projection. */
  geo?:GeographicPoint
  source:Readonly<{authority:string; url:string; checkedAt:string; hash?:string}>
}>
export type PublicRegistryQuery = Readonly<{
  query?:string; address?:string; municipality?:string; postalCode?:string; identifier?:string
  near?:RegistryNear; limit?:number
}>
export type PublicRegistrySearchResult = Readonly<{
  entries:readonly (PublicRegistryEntry & Readonly<{distanceKm?:number}>)[]
  total:number
  unlocatedCount:number
  nearbyAvailable:boolean
}>

export function parsePublicRegistryQuery(params:URLSearchParams):PublicRegistryQuery {
  const result:Record<string,unknown>={}
  for(const key of ['query','address','municipality','postalCode','identifier'] as const){
    if(params.getAll(key).length>1)throw new TypeError('registry_query_duplicate')
    const value=params.get(key)?.trim()
    if(value){if(value.length>200)throw new TypeError('registry_query_too_long');result[key]=value}
  }
  const coordinates=['latitude','longitude','radiusKm'].map(key=>params.get(key))
  for(const key of ['latitude','longitude','radiusKm','limit'])if(params.getAll(key).length>1)throw new TypeError('registry_query_duplicate')
  if(coordinates.some(value=>value!==null)){
    if(coordinates.some(value=>!value?.trim()))throw new TypeError('registry_near_incomplete')
    const [latitude,longitude,radiusKm]=coordinates.map(Number)
    result.near={latitude,longitude,radiusKm}
  }
  if(params.has('limit'))result.limit=Number(params.get('limit'))
  const query=result as PublicRegistryQuery
  validateQuery(query)
  return query
}

/** Identifier indexes remain private to the source reader; result records never disclose them. */
export function searchPublicRegistry(entries:readonly PublicRegistryEntry[],query:PublicRegistryQuery,
  identifiers:ReadonlyMap<string,ReadonlySet<string>>=new Map()):PublicRegistrySearchResult {
  validateQuery(query)
  const matchingIds=query.identifier?identifiers.get(query.identifier.trim().toUpperCase()):undefined
  const nearbyAvailable=entries.some(entry=>entry.geo)
  if(query.near&&!nearbyAvailable)throw new TypeError('registry_coordinates_unavailable')
  let unlocatedCount=0
  const matches:(PublicRegistryEntry & {distanceKm?:number})[]=[]
  for(const entry of entries){
    if(query.identifier&&!matchingIds?.has(entry.id))continue
    if(query.postalCode&&fold(entry.postalCode)!==fold(query.postalCode))continue
    if(query.municipality&&!fold(entry.municipality).includes(fold(query.municipality)))continue
    if(query.address&&!fold(entry.address).includes(fold(query.address)))continue
    if(query.query&&!fold([entry.registrationNumber,entry.name,entry.address,entry.municipality,entry.postalCode].join(' ')).includes(fold(query.query)))continue
    if(!entry.geo)unlocatedCount++
    if(query.near){
      if(!entry.geo)continue
      const distance=distanceKm(query.near,entry.geo)
      if(distance>query.near.radiusKm)continue
      matches.push({...entry,distanceKm:distance})
    }else matches.push(entry)
  }
  matches.sort((a,b)=>(a.distanceKm??0)-(b.distanceKm??0)||a.id.localeCompare(b.id))
  return {entries:matches.slice(0,query.limit??100),total:matches.length,unlocatedCount,nearbyAvailable}
}

export function distanceKm(a:GeographicPoint,b:GeographicPoint):number {
  validatePoint(a);validatePoint(b)
  const radians=Math.PI/180,lat=(b.latitude-a.latitude)*radians,lon=(b.longitude-a.longitude)*radians
  const h=Math.sin(lat/2)**2+Math.cos(a.latitude*radians)*Math.cos(b.latitude*radians)*Math.sin(lon/2)**2
  return 6371.0088*2*Math.asin(Math.sqrt(Math.min(1,Math.max(0,h))))
}
function validatePoint(point:GeographicPoint){
  if(!Number.isFinite(point.latitude)||!Number.isFinite(point.longitude)||Math.abs(point.latitude)>90||Math.abs(point.longitude)>180)throw new TypeError('registry_coordinates_invalid')
}
function validateQuery(query:PublicRegistryQuery){
  if(query.limit!==undefined&&(!Number.isInteger(query.limit)||query.limit<1||query.limit>100))throw new TypeError('registry_limit_invalid')
  for(const key of ['query','address','municipality','postalCode','identifier'] as const){if(query[key]!==undefined&&(typeof query[key]!=='string'||query[key]!.length>200))throw new TypeError('registry_query_invalid')}
  if(query.near){validatePoint(query.near);if(!Number.isFinite(query.near.radiusKm)||query.near.radiusKm<=0||query.near.radiusKm>200)throw new TypeError('registry_radius_invalid')}
}
function fold(value:string){return value.normalize('NFD').replace(/\p{M}/gu,'').trim().toLowerCase()}
