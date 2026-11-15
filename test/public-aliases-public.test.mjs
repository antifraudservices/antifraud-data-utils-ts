// Flow contract: root/subpath exports resolve to the same owned alias functions and a typed real consumer can use the data outputs without inventing an authorization type.
import assert from 'node:assert/strict'
import test from 'node:test'
import {execFileSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import * as root from '../dist/index.js'
import * as leaf from 'antifraud-data-utils-ts/public-aliases'
const require=createRequire(import.meta.url)
test('the root and explicit subpath expose the same alias implementation',()=>{
 for(const name of ['normalizePublicAliasList','normalizeControllerAlias','normalizeTelephoneAlias'])assert.equal(root[name],leaf[name])
})
test('the public consumer has precise outputs and rejects incompatible result substitutions',()=>{
 execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit','--strict','--skipLibCheck','--target','ES2023','--module','NodeNext','--moduleResolution','NodeNext',fileURLToPath(new URL('./fixtures/public-alias-consumer.ts',import.meta.url))],{stdio:'pipe'})
})
