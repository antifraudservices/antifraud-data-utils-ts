// Flow contract: the existing proof-free organization transcript accepts the neutral credential consumer profile while preserving marker checks, recursive proof exclusion and byte ordering; canonicalization does not verify a credential or admit a caller.
import assert from 'node:assert/strict';
import test from 'node:test';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {canonicalizeOrganizationTestNetworkCredential,canonicalizeTestNetworkOrganizationCredential} from '../dist/organization-credentials.js';

test('public canonicalizers accept the existing neutral credential consumer without a reviewed-builder cast',()=>{
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),
 '--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',
 fileURLToPath(new URL('./fixtures/organization-canonicalization-profile.ts',import.meta.url))],{encoding:'utf8'});
 assert.equal(result.error,undefined);assert.equal(result.status,0,result.stdout+result.stderr);
});

test('existing marker checks and recursive proof-free transcript remain byte-for-byte unchanged',()=>{
 const credential={type:['OrganizationTestNetworkCredential'],issuer:'synthetic-issuer',credentialSubject:{z:2,proof:{jws:'synthetic-nested-proof'},a:1},evidence:[{z:2,a:1}],proof:{jws:'synthetic-outer-proof'}};
 const expected='{"credentialSubject":{"a":1,"z":2},"evidence":[{"a":1,"z":2}],"issuer":"synthetic-issuer","type":["OrganizationTestNetworkCredential"]}';
 assert.equal(canonicalizeOrganizationTestNetworkCredential(credential),expected);
 const domain={...credential,type:['OrganizationCredential','TestNetworkCredential']};
 assert.equal(canonicalizeTestNetworkOrganizationCredential(domain),expected.replace('["OrganizationTestNetworkCredential"]','["OrganizationCredential","TestNetworkCredential"]'));
 assert.throws(()=>canonicalizeOrganizationTestNetworkCredential({...credential,type:['OrganizationCredential']}),/not an organization/u);
 assert.throws(()=>canonicalizeTestNetworkOrganizationCredential({...domain,type:['OrganizationCredential']}),/marker/u);
 assert.throws(()=>canonicalizeTestNetworkOrganizationCredential({...domain,type:['TestNetworkCredential']}),/not a Test Network/u);
});
