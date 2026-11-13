// Flow contract: public encoding primitives preserve leading zeroes and standard multihash/CID envelopes without an external project implementation.
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import test from 'node:test'
import * as encoding from '../dist/index.js'

const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const decode=value=>{
  let n=0n
  for(const character of value.slice(1))n=n*58n+BigInt(alphabet.indexOf(character))
  const bytes=[]
  while(n){bytes.unshift(Number(n&255n));n>>=8n}
  for(const character of value.slice(1)){if(character!=='1')break;bytes.unshift(0)}
  return Uint8Array.from(bytes)
}

test('exports exact base58 bytes without losing leading zeroes',()=>{
  assert.equal(typeof encoding.bytesToBase58,'function')
  assert.equal(encoding.bytesToBase58(Uint8Array.of(0,0,1)),'112')
  assert.equal(encoding.bytesToBase58(new Uint8Array()),'')
  assert.equal(encoding.bytesToHexString(Uint8Array.of(0,15,255)),'000fff')
})

test('frames SHA3 identifiers with their own multihash code and digest length',()=>{
  assert.equal(typeof encoding.encodeMultibaseSha3,'function')
  for(const [bits,code] of [[224,0x17],[256,0x16],[384,0x15],[512,0x14]]){
    const bytes=decode(encoding.encodeMultibaseSha3('catalog',bits))
    assert.deepEqual([...bytes.slice(0,2)],[code,bits/8])
    assert.deepEqual(bytes.slice(2),new Uint8Array(createHash(`sha3-${bits}`).update('catalog').digest()))
  }
  assert.throws(()=>encoding.encodeMultibaseSha3('catalog',128))
})

test('distinguishes a raw CIDv1 from an unframed multihash',()=>{
  assert.equal(typeof encoding.buildRawCidV1FromUtf8String,'function')
  const bytes=decode(encoding.buildRawCidV1FromUtf8String('catalog'))
  assert.deepEqual([...bytes.slice(0,4)],[1,0x55,0x15,48])
  assert.deepEqual(bytes.slice(4),new Uint8Array(createHash('sha3-384').update('catalog').digest()))
})
