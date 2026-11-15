// Flow contract: public-key thumbprints retain exact sorted SHA-256 member transcripts and RFC9278 URI framing for existing EC/RSA/OKP/AKP families; metadata does not affect key identity, and missing public material never produces an identity or authority assertion.
import assert from 'node:assert/strict'
import {test} from 'node:test'
import {createHash,generateKeyPairSync,randomBytes,randomUUID} from 'node:crypto'
import {CryptographyService} from '../dist/index.js'
const owned=await import('../dist/jwk-thumbprints.js').catch(error=>{
 if(error.code==='ERR_MODULE_NOT_FOUND')return {}
 throw error
})
const fields={EC:['crv','kty','x','y'],RSA:['e','kty','n'],OKP:['crv','kty','x'],AKP:['alg','kty','pub']}
function need(name){assert.equal(typeof owned[name],'function','missing owned '+name);return owned[name]}
function oracle(jwk){
 const transcript='{'+fields[jwk.kty].map(name=>JSON.stringify(name)+':'+JSON.stringify(jwk[name])).join(',')+'}'
 return createHash('sha256').update(transcript,'utf8').digest('base64url')
}
const service=new CryptographyService({
 async getRandomBytes(size){return randomBytes(size)},randomUUID,
 async digestString(value,algorithm){return createHash(algorithm.replace('-','').toLowerCase()).update(value).digest('hex')},
})
test('computes exact public-member hashes for real EC/RSA and owned ML-KEM/ML-DSA public keys',async()=>{
 const hash=need('computeRfc7638JwkThumbprint')
 const ec=generateKeyPairSync('ec',{namedCurve:'P-384'}).publicKey.export({format:'jwk'})
 const rsa=generateKeyPairSync('rsa',{modulusLength:2048}).publicKey.export({format:'jwk'})
 const kem=(await service.generateKeyPairMlKem(undefined,'ML-KEM-768')).publicJWKey
 const dsa=(await service.generateKeyPairMlDsa(undefined,'ML-DSA-44')).publicJWKey
 for(const jwk of [ec,rsa,kem,dsa]) assert.equal(hash(jwk),oracle(jwk))
})
test('URI framing is exact and ignores metadata and source property order',()=>{
 const hash=need('computeRfc7638JwkThumbprint'),urn=need('toJwkThumbprintSha256Urn')
 const key=generateKeyPairSync('ec',{namedCurve:'P-384'}).publicKey.export({format:'jwk'})
 const decorated={kid:'urn:example:key',use:'sig',alg:'ES384',key_ops:['verify'],...Object.fromEntries(Object.entries(key).reverse())}
 assert.equal(hash(decorated),oracle(key))
 assert.equal(urn(decorated),'urn:ietf:params:oauth:jwk-thumbprint:sha-256:'+oracle(key))
 assert.equal(hash({...key,x:key.y}),oracle({...key,x:key.y}))
 assert.notEqual(hash({...key,x:key.y}),hash(key))
})
test('unknown families and missing required public fields cannot produce a thumbprint',()=>{
 const hash=need('computeRfc7638JwkThumbprint')
 for(const input of [{kty:'oct',k:'unused'},{kty:'EC',crv:'P-384',x:'x'},{kty:'RSA',n:'n'},{kty:'OKP',crv:'ML-KEM-768'},{kty:'AKP',alg:'ML-DSA-44'}]) assert.throws(()=>hash(input))
})
