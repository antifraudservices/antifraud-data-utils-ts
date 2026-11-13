// Flow contract: identity byte decoding preserves every UUID byte and rejects malformed encodings without granting identity authority.
import test from 'node:test'
import assert from 'node:assert/strict'
import * as data from '../dist/index.js'

test('decodes multibase base58btc including empty and leading-zero payloads', () => {
  assert.equal(typeof data.decodeBase58btc, 'function')
  for (const bytes of [new Uint8Array(), Uint8Array.of(0), Uint8Array.of(0, 0, 1), Uint8Array.of(255, 0, 128)]) {
    assert.deepEqual(data.decodeBase58btc(data.encodeBase58btc(bytes)), bytes)
  }
  for (const invalid of ['', '112', 'z0', 'zO', 'zl', 'zI', 'z 1', 'zé']) {
    assert.throws(() => data.decodeBase58btc(invalid), TypeError)
  }
})

test('normalizes UUID, resource reference and multibase bytes to the same full identity', () => {
  assert.equal(typeof data.normalizeUuid, 'function')
  const hex = '00000000000000000000000000000001'
  const uuid = '00000000-0000-0000-0000-000000000001'
  const encoded = data.encodeBase58btc(Uint8Array.of(...new Uint8Array(15), 1))
  for (const value of [hex, uuid, `urn:uuid:${uuid}`, `Patient/${uuid}`, encoded, ` ${uuid} `]) {
    assert.equal(data.normalizeUuid(value), hex)
  }
  assert.equal(data.normalizeUuid('ABCDEFAB-CDEF-ABCD-EFAB-CDEFABCDEFAB'), 'abcdefabcdefabcdefabcdefabcdefab')
  for (const value of [undefined, '', 'z1', 'z0', 'not-a-uuid', `${uuid}/extra`, `${uuid}00`]) {
    assert.equal(data.normalizeUuid(value), undefined)
  }
})
