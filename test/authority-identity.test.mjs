// Flow contract: a neutral authority identifier derives only from its host and port, preserves encoded-port spelling and never embeds a path or credentials.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as identity from '../dist/index.js'

test('builds host-only did:web authority identities without routing or private credentials',()=>{
  assert.equal(typeof identity.buildAuthorityDidWeb,'function')
  assert.equal(identity.buildAuthorityDidWeb({authority:'https://EXAMPLE.invalid/tenant/path'}),'did:web:example.invalid')
  assert.equal(identity.buildAuthorityDidWeb({authority:'localhost:3300'}),'did:web:localhost%3A3300')
  const credentialed=new URL('https://example.invalid')
  credentialed.username='synthetic-user'
  credentialed.password='synthetic-test-secret'
  for(const authority of ['', 'ftp://example.invalid',credentialed.href])assert.throws(()=>identity.buildAuthorityDidWeb({authority}))
})
