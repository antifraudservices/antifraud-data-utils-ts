// Flow contract: general and compact encrypted envelopes preserve the exact nested signed bytes; recipient isolation and signature verification remain mandatory.
import assert from 'node:assert/strict'
import {createHash, randomBytes, randomUUID} from 'node:crypto'
import test from 'node:test'
import {Content, CryptographyService} from '../dist/index.js'

const helper = {
  async getRandomBytes(size) { return randomBytes(size) },
  async digestString(data, algorithm) {
    return createHash(String(algorithm).replace('-', '').toLowerCase()).update(data).digest('hex')
  },
  randomUUID,
}

for (const zip of [undefined, 'DEF']) {
  test(`preserves verifiable compact JWS bytes in general JWE (compression ${zip ?? 'none'})`, async () => {
    const crypto = new CryptographyService(helper)
    const sender = await crypto.generateKeyPairMlKem()
    const recipient = await crypto.generateKeyPairMlKem()
    const signer = await crypto.generateKeyPairMlDsa(undefined, 'ML-DSA-65')
    const senderPrivate = {...sender.publicJWKey, dBytes: sender.secretKeyBytes}
    const recipientPrivate = {...recipient.publicJWKey, dBytes: recipient.secretKeyBytes}
    const jws = await crypto.signDataJws({result: 'accepted'}, {
      alg: 'ML-DSA-65', kid: signer.publicJWKey.kid,
    }, signer.secretKeyBytes)
    const compact = `${jws.protected}.${jws.payload}.${jws.signature}`
    const header = {enc: 'A256GCM', cty: 'JWS', ...(zip ? {zip} : {})}
    const envelope = await crypto.encryptJwe(compact, header, senderPrivate, [recipient.publicJWKey])
    const opened = await crypto.decryptJwe(envelope, recipientPrivate)
    const plaintext = Content.bytesToStringUTF8(opened.decryptedBytes)
    assert.equal(plaintext, compact)
    assert.equal(opened.protectedHeader.cty, 'JWS')
    assert.equal(await crypto.verifyJws(plaintext, signer.publicJWKey), true)
    await assert.rejects(crypto.decryptJwe(envelope, senderPrivate), /recipient/)
    const changed = plaintext.split('.')
    changed[1] = Content.objectToRawBase64UrlSafe({result: 'changed'})
    assert.equal(await crypto.verifyJws(changed.join('.'), signer.publicJWKey), false)
  })
}
