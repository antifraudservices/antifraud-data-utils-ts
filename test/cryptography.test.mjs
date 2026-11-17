// Flow contract: reuse the reviewed shared PQC envelope and signature profile; private keys remain caller-custodied and tampering fails closed.
import assert from 'node:assert/strict'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'

import {
  Content,
  CryptographyService,
} from '../dist/index.js'
const recorded = JSON.parse(readFileSync(new URL('./fixtures/predecessor-vectors.json', import.meta.url), 'utf8'))

const cryptoHelper = {
  async getRandomBytes(byteCount) {
    return randomBytes(byteCount)
  },
  async digestString(data, algorithm) {
    return createHash(String(algorithm).replace('-', '').toLowerCase())
      .update(data)
      .digest('hex')
  },
  randomUUID,
}

test('round-trips confidential bytes with the reviewed ML-KEM-768 CEK-wrap profile', async () => {
  const service = new CryptographyService(cryptoHelper)
  const recipient = await service.generateKeyPairMlKem(undefined, 'ML-KEM-768')
  const recipientPrivate = {
    ...recipient.publicJWKey,
    dBytes: recipient.secretKeyBytes,
  }
  const payload = '%PDF-1.4\nsynthetic confidential evidence\n%%EOF'

  const compact = await service.encryptJweToCompact(
    payload,
    {
      typ: 'application/antifraud-confidential-artifact+jwe',
      enc: 'A256GCM',
      gdc_pq_profile: 'confidential-pqc-v1',
      gdc_key_purpose: 'document-at-rest',
      gdc_owner_binding: 'sha3-384:synthetic-owner-binding',
    },
    recipientPrivate,
    recipient.publicJWKey,
  )

  const parsed = service.parseCompactJwe(compact)
  const wrappedCek = Content.base64UrlSafeToJSON(
    parsed.recipients[0].encrypted_key,
  )
  assert.deepEqual(
    {
      v: wrappedCek.v,
      kem: wrappedCek.kem,
      kdf: wrappedCek.kdf,
      wrap: wrappedCek.wrap,
    },
    {
      v: 'gdc-mlkem-cek-wrap-v1',
      kem: 'ML-KEM-768',
      kdf: 'HKDF-SHA-256',
      wrap: 'A256GCM',
    },
  )

  const decrypted = await service.decryptJwe(compact, recipientPrivate)
  assert.equal(Content.bytesToStringUTF8(decrypted.decryptedBytes), payload)
  assert.equal(compact.includes(payload), false)

  const compactParts = compact.split('.')
  compactParts[3] = `${compactParts[3][0] === 'A' ? 'B' : 'A'}${compactParts[3].slice(1)}`
  await assert.rejects(
    service.decryptJwe(compactParts.join('.'), recipientPrivate),
  )
})

test('signs and verifies exact bytes with ML-DSA-65 and rejects changed bytes', async () => {
  const service = new CryptographyService(cryptoHelper)
  const signer = await service.generateKeyPairMlDsa(undefined, 'ML-DSA-65')
  const payload = Content.stringToBytesUTF8('manifest-digest:synthetic-v1')
  const signature = await service.signBytes(
    payload,
    signer.secretKeyBytes,
    'ML-DSA-65',
  )

  assert.equal(
    await service.verifyBytes(signature, payload, signer.publicJWKey),
    true,
  )
  assert.equal(
    await service.verifyBytes(
      signature,
      Content.stringToBytesUTF8('manifest-digest:changed'),
      signer.publicJWKey,
    ),
    false,
  )
})

test('rejects invalid AES keys and multiple JWE recipients', async () => {
  const service = new CryptographyService(cryptoHelper)
  await assert.rejects(
    service.encrypt('secret', new Uint8Array(31), 'protected-header'),
    /32-byte key/,
  )

  const recipient = await service.generateKeyPairMlKem(undefined, 'ML-KEM-768')
  const recipientPrivate = {
    ...recipient.publicJWKey,
    dBytes: recipient.secretKeyBytes,
  }
  await assert.rejects(
    service.encryptJwe(
      { secret: true },
      { enc: 'A256GCM' },
      recipientPrivate,
      [recipient.publicJWKey, recipient.publicJWKey],
    ),
    /single recipient/,
  )
})

test('retains the recorded cross-implementation envelope and rejects changed ciphertext or owner AAD', async () => {
  const vector=recorded.cryptography
  let position=0
  const antifraud=new CryptographyService({...cryptoHelper,async getRandomBytes(length){
    const row=vector.randomTranscript[position++]
    assert.equal(row.length,length)
    return new Uint8Array(Buffer.from(row.hex,'hex'))
  }})
  const recipient=await antifraud.generateKeyPairMlKem(undefined,'ML-KEM-768')
  assert.deepEqual(recipient.publicJWKey,vector.publicJwk)
  const recipientPrivate={...recipient.publicJWKey,dBytes:recipient.secretKeyBytes}
  assert.equal(Content.bytesToStringUTF8((await antifraud.decryptJwe(vector.compact,recipientPrivate)).decryptedBytes),vector.payload)
  const actual=await antifraud.encryptJweToCompact(vector.payload,vector.protectedHeader,recipientPrivate,recipient.publicJWKey)
  assert.equal(actual,vector.ownedCompact)
  assert.equal(position,vector.randomTranscript.length)
  assert.equal(vector.crossImplementation.legacyDecryptOwnedCiphertext,true)
  assert.equal(vector.crossImplementation.ownedDecryptLegacyCiphertext,true)
  // The unchanged implementations order wrap JSON members differently. Preserve
  // actual cryptographic fields without claiming full compact serialization parity.
  const oldParts=vector.compact.split('.'),parts=actual.split('.')
  for(const index of [0,2,3,4])assert.equal(parts[index],oldParts[index])
  assert.deepEqual(Content.base64UrlSafeToJSON(parts[1]),Content.base64UrlSafeToJSON(oldParts[1]))
  assert.equal(vector.crossImplementation.serializedCompactEquality,false)
  for(const envelope of [vector.compact,actual]){
    const changed=envelope.split('.')
    changed[3]=(changed[3][0]==='A'?'B':'A')+changed[3].slice(1)
    await assert.rejects(antifraud.decryptJwe(changed.join('.'),recipientPrivate))
    const aad=envelope.split('.'),header=Content.base64UrlSafeToJSON(aad[0])
    header.gdc_owner_binding='sha3-384:changed-owner'
    aad[0]=Content.objectToRawBase64UrlSafe(header)
    await assert.rejects(antifraud.decryptJwe(aad.join('.'),recipientPrivate))
  }
})
