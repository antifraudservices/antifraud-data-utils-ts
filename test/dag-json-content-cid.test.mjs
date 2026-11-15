// Flow contract: exact caller-canonical JSON bytes acquire the fixed DAG-JSON/SHA2-256 CIDv1 envelope; invalid IPLD input is rejected and the existing raw/SHA3-384 profile never changes.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import test from 'node:test';
import * as encoding from '../dist/encoding.js';

const requireBuilder=()=>{
  assert.equal(typeof encoding.buildDagJsonCidV1FromUtf8String,'function','missing owned DAG-JSON CID builder');
  return encoding.buildDagJsonCidV1FromUtf8String;
};
// Fixed read-only compatibility vectors; the original is never imported by this suite:
// https://github.com/Global-DataCare/gdc-common-utils-ts/blob/f4031b221216cacd9917d1d20c5ff0b03bed7045/src/utils/fhir-cid.ts
const vectors=[
  ['{}','z4EBG9j4hWCYsZxJJM3w4nJPBZFNQyn3ZJmdaxJz6q7PWgrd2qw'],
  ['{"a":1,"z":["x",true,null]}','z4EBG9jBE9CtizG5noHjGyp3UiR1nYs6nLaMa4MYVnxmi8rKXDn'],
  ['{"label":"é水","nested":{"b":[2,1]}}','z4EBG9j6ne82CTUifUFxKtYpHMnLL2p1yQAWNtPKpJAvJgNcBtm'],
];

test('uses fixed CIDv1/DAG-JSON/SHA2-256 bytes for the canonical empty object vector',()=>{
  const build=requireBuilder();
  const bytes=encoding.decodeBase58btc(build('{}'));
  assert.deepEqual([...bytes.slice(0,5)],[1,0xa9,0x02,0x12,32]);
  assert.equal(encoding.bytesToHexString(bytes.slice(5)),'44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a');
  for(const [json,cid] of vectors)assert.equal(build(json),cid);
});

test('hashes exact validated UTF-8 bytes without stripping identifiers or reordering arrays',()=>{
  const build=requireBuilder();
  for(const json of ['{"a":1,"z":["x",true,null]}','{"label":"é水","id":"retained"}','[2,1]','[1,2]']){
    const bytes=encoding.decodeBase58btc(build(json));
    assert.deepEqual(bytes.slice(5),new Uint8Array(createHash('sha256').update(json,'utf8').digest()));
  }
  assert.notEqual(build('[1,2]'),build('[2,1]'));
  assert.notEqual(build('{"id":"retained"}'),build('{}'));
});

test('rejects unsupported caller input rather than hashing arbitrary text as DAG-JSON',()=>{
  const build=requireBuilder();
  for(const value of [undefined,null,{},new Uint8Array(),'', 'undefined','{"a":undefined}','{"a":NaN}','{"a":Infinity}','{"/":"not-a-cid"}'])assert.throws(()=>build(value));
});

test('retains the existing raw CIDv1/SHA3-384 profile independently',()=>{
  const build=requireBuilder();
  const bytes=encoding.decodeBase58btc(encoding.buildRawCidV1FromUtf8String('{}'));
  assert.deepEqual([...bytes.slice(0,4)],[1,0x55,0x15,48]);
  assert.deepEqual(bytes.slice(4),new Uint8Array(createHash('sha3-384').update('{}').digest()));
  assert.notEqual(build('{}'),encoding.buildRawCidV1FromUtf8String('{}'));
});
