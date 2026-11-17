// Flow contract: cross-sector identifier-input tags preserve their exact wire spelling without defining normalization, hashing, standards or authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

const subject=await import('../dist/identifier-input-kinds.js').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return{};throw error})

test('identifier-input kinds expose only the three explicit wire tags',()=>{
 assert.deepEqual(subject.IdentifierInputKinds,{Uuid:'UUID',Email:'EMAIL',Phone:'PHONE'})
})

test('identifier-input tags are immutable and distinct from stable actor contact kinds',async()=>{
 assert.ok(subject.IdentifierInputKinds,'missing owned identifier-input kinds')
 assert.equal(Object.isFrozen(subject.IdentifierInputKinds),true)
 assert.throws(()=>{subject.IdentifierInputKinds.Email='email'},TypeError)
 const {StableActorContactKinds}=await import('../dist/organization-identity.js')
 assert.notEqual(subject.IdentifierInputKinds.Email,StableActorContactKinds.Email)
 assert.notEqual(subject.IdentifierInputKinds.Phone,StableActorContactKinds.Phone)
})

test('root and subpath consumers retain the strict identifier-input union',()=>{
 execFileSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',fileURLToPath(new URL('./fixtures/identifier-input-kinds-consumer.ts',import.meta.url))],{stdio:'pipe'})
})
