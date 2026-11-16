// Flow contract: recognize only the established trimmed RFC9278 SHA-256 URI syntax without coercion, digest verification or authority inference; retain the existing real-public-key thumbprint transcript and framing.
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash,generateKeyPairSync} from 'node:crypto';
import * as owned from '../dist/jwk-thumbprints.js';
import * as publicApi from '../dist/index.js';

// Read-only predecessor: https://github.com/Global-DataCare/gdc-common-utils-ts/blob/main/src/utils/jwk-thumbprint.ts
const prefix='urn:ietf:params:oauth:jwk-thumbprint:sha-256:';
const syntactic=prefix+'A'.repeat(43);
const need=()=>{assert.equal(typeof owned.isJwkThumbprintSha256Urn,'function');return owned.isJwkThumbprintSha256Urn};

test('public predicate retains trim and exact 43-character URI syntax without treating it as key verification',()=>{
 const isUrn=need();assert.equal(publicApi.isJwkThumbprintSha256Urn,isUrn);
 for(const value of [syntactic,` ${syntactic} `,prefix+'_-'.repeat(21)+'A'])assert.equal(isUrn(value),true);
});
test('rejects wrong prefix, length, padding, alphabet and nonstrings without invoking caller conversion hooks',()=>{
 const isUrn=need();let invoked=false;
 for(const value of [undefined,null,0,{},[],new String(syntactic),{toString(){invoked=true;throw new Error('caller conversion forbidden')}},
  prefix+'A'.repeat(42),prefix+'A'.repeat(44),prefix+'A'.repeat(42)+'=',prefix+'A'.repeat(42)+'+',
  syntactic.replace('sha-256','sha-384'),syntactic.replace('urn:','URN:'),syntactic.replace('oauth:','oauth: ')])assert.equal(isUrn(value),false);
 assert.equal(invoked,false);
});
test('retains real public EC SHA-256 member bytes and URI framing independently of the new recognizer',()=>{
 const key=generateKeyPairSync('ec',{namedCurve:'P-384'}).publicKey.export({format:'jwk'});
 const transcript=JSON.stringify({crv:key.crv,kty:key.kty,x:key.x,y:key.y});
 const expected=createHash('sha256').update(transcript,'utf8').digest('base64url');
 assert.equal(owned.computeRfc7638JwkThumbprint(key),expected);
 assert.equal(owned.toJwkThumbprintSha256Urn(key),prefix+expected);
});
