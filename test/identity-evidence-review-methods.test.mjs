// Flow contract: neutral submitted document-review method codes retain their existing wire values across sectors without asserting that evidence was verified or a credential signed.
import test from 'node:test'
import assert from 'node:assert/strict'

test('exports the same neutral review vocabulary from the identity and root public surfaces',async()=>{
 const identity=await import('../dist/identity-assurance/index.js'),root=await import('../dist/index.js')
 const expected={PhysicalInPerson:'pipp',SupervisedRemote:'sripp',ElectronicIdentity:'eid',UnsupervisedRemote:'uripp'}
 assert.deepEqual(identity.IdentityEvidenceReviewMethods,expected)
 assert.deepEqual(root.IdentityEvidenceReviewMethods,expected)
 assert.equal(Object.isFrozen(identity.IdentityEvidenceReviewMethods),true)
})
