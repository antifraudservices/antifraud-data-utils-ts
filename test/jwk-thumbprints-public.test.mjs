// Flow contract: root and public leaf share the same thumbprint implementation; actual existing public JWK types remain accepted, while encoded identifiers cannot be substituted for binary material.
import assert from 'node:assert/strict'
import test from 'node:test'
import {execFileSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import * as root from '../dist/index.js'
import * as leaf from 'antifraud-data-utils-ts/jwk-thumbprints'
const require=createRequire(import.meta.url)
test('root and explicit public subpath expose identical thumbprint functions',()=>{
 for(const name of ['computeRfc7638JwkThumbprint','toJwkThumbprintSha256Urn'])assert.equal(root[name],leaf[name])
})
test('actual public JWK consumers compile with precise encoded results',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2023','--module','NodeNext','--moduleResolution','NodeNext',fileURLToPath(new URL('./fixtures/jwk-thumbprint-consumer.ts',import.meta.url))],{stdio:'pipe'})
})
