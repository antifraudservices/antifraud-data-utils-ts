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

// Golden wire vectors captured from released gdc-common-utils-ts@2.9.30
// using only the synthetic fixtures below. Baseline npm tarball integrity:
// sha512-+ZJLEp/AfmCm4ZwJRU5wKTmWJPevlJ8Wa82EepyoGz0BE3sKBA2JjVbh4ML5+e+RIzstwoJnk4vWE4E44UhTqg==
// The published package exposes no source commit. Captured bytes are the oracle;
// no predecessor package is loaded at test time.
// Fixed entropy and key seed are synthetic test vectors, never production randomness.
const reviewedEnvelope = Object.freeze({
  "seedHex": "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f",
  "compact": "eyJ0eXAiOiJhcHBsaWNhdGlvbi9hbnRpZnJhdWQtY29uZmlkZW50aWFsLWFydGlmYWN0K2p3ZSIsImVuYyI6IkEyNTZHQ00iLCJnZGNfcHFfcHJvZmlsZSI6ImNvbmZpZGVudGlhbC1wcWMtdjEiLCJnZGNfa2V5X3B1cnBvc2UiOiJkb2N1bWVudC1hdC1yZXN0IiwiZ2RjX293bmVyX2JpbmRpbmciOiJzaGEzLTM4NDpjcm9zcy1wYWNrYWdlLW93bmVyIiwiYWxnIjoiTUwtS0VNLTc2OCtIS0RGLVNIQTI1NitBMjU2R0NNS1ciLCJraWQiOiJxeV84d3hvQVI4RTFveDNTUFdRUVhoamJ6bVRIbFh1TW9PZWZIMFFfcExrIn0.eyJ2IjoiZ2RjLW1sa2VtLWNlay13cmFwLXYxIiwia2VtIjoiTUwtS0VNLTc2OCIsImtkZiI6IkhLREYtU0hBLTI1NiIsIndyYXAiOiJBMjU2R0NNIiwia2VtQ2lwaGVydGV4dCI6InZrTW5zUlZqQnZEcElaRWFyd2s0SnlkMG9uWGhRMjFBc1VVdlRhOU5XUWt6REhld0RmUnRORFNISEZRRThyRnZnVU93cXhrdkJDN2w2Q2s0QWxoaGx2dkVqM1hRbnJZQTM2RTRTZFZZV3FhZkJpZ0h4dWRwTlhZUXRLdk1sTTluMkwta1l0MmZqMjlEX09RZXg1WVcwejdBOUJEZjBHdVJrbE1iaEk5VERjUVFja1JsOU1aMDRPWndOeVBJdkdkYmRweGtyNWVET1dWb0NwcXRBOGZuUFVyaDlJam40VmlIM05xeVp4M3hfMlZZeW1tZ3ZRZGlQUEpfV0lGeWhVbUdmZVJITGdTZmVzSjZURlRvSERZYkdFTnltcjNxMThZeERQWUlCSUU3eGNRM0p3aG1xYUxnRHBFY1NDUGIzWWNaN09ZZzRVTktTQXFFVWJsYWoybG9iZFVVbl9HT0Y4aGxlWUdjMGxZWkFGM2dkaW1ZSDJFSkhWdUk3MTd2Y1JTd3pJQXViRVNNMW11am1xM1JzYld2aGg4eUhNaGJfVXpEOHQtUUlqNzlDTnhyRndVYkRseUtZMkNsMk5ESkNEb1gxV2ZxaGxYT3JkaGJPWDQtUWdsS3RwTGtZbXB1SGFzdUpScndiSGNpUGVrVGlqY2lXYWdtRENLaW91dVpTLU40SHJLampCNDRnTXpaVFdjakNQRE1CcUpudGtxQWhqQnkyQ2FsNmtvSW5sTFVtal9BSVZFOUhBS1hucVgzTnNOR3N5ODdBLW5RYmRWREhJYXQ3NU5VU0RXRHI4blBWYkFqdFQzc21YQUo4VHJDYWxJTm5hNlVUOUVmbkFzZXJQdkxhZ3lyWE5rTjlaWUNtWWdGb3Ria0d5MXRSTDhqZGVyR2hGTUs2TzRSdlJSTl9rc2k0clZGeVRselBKZExyZ2Nnak9vQXJrYW1Ucld1cE1WckplZFJFMEhIMHZXV0t4U2VkSjNTLUpNVkxidWxrSTQycmNpNmNxMlpYeldUcnJqY29rNlB2WU5CZTh2SlBWVG80T2lJc2VlaEZGV3dDOVotVXJMWlBSQUU5OVdjYXlRS1FWdkQ0UmtPUDVMNm43UXM1V1QtWjljVlY2akhrdmVVc19DTS1FVWQ1Z2xYVnRnRVNBZXNHQjRSZXVsNndHY3Q2SWJzeUZENlV0Zzh1UkhxcmhUUTJjdzY2aXotUnYzQXNJY2lINEVTTmV6ZlZBemNYc3gwMURTcjRqalFxbm15ekRyek1uVm53aTdsUUphaFZ6SWJTYWlHd1dLSEhXQWVhV3ROWlhzeDd4bHlBbzNjS1duVDRsMG1FaHNHRGJJMHB6YkZxX3E3SjlwUzZnQnVENDM4eFB6bzdQZkhJT0hHNGNPekpvaTZmdVFsSERPTnlSUHhDUHFvcFBZMXFXTDN6MjUtMkZVMkJHcUZvQUptbmZ1c29wbzdLWmp1VGt3V1pqYkN3SGVoQWpYak5tZWtDN0tBVTQ3TlR1dzRZdTZNVmdFV05MQUF6RHotSlVONGRjR0x1QjR2Skx5TkZSNi11WFd3NEdRRGZCeG5GTFRPY1N1aVprU2dISHdfNlhXZlBiU0ZXX3hDa1V1cXRjaXdoeEJlRGxLT2piR1JMX2lXS1F0NVVrajFBRkVENzg1V29RUUdqdERPakFKUnRXNk5ZZnltenFPOEd3akVST3A4X3dLaE1CS2hBZUU0UURObjFpbFZkUzE3aDVlU0pOTlh0QksyckRuV0k1RTduSXc5cVVBYy1LYnE5SG9GbnRVN0Y1T01ISVc4eXRmeExGTl9mQzdKVURRZHFTYmJLM3BxZFNjYnJxZTM2aV9KbzdORG1mSlBlN2wzVnZtNVptLVJsSTlGWW85eXpTSWZiMnB2dnBhNTFyeUNaWnlVUlV4N0dQUzRkNHFlalhrIiwiaXYiOiJRRUZDUTBSRlJrZElTVXBMIiwiY2lwaGVydGV4dCI6ImlTQlpRTkpZM3l1RDdnU0ZKbmFuc3NoU3k0eng1cVIzNWxkS3F0ZEVTMTA2bW1pU2ZvUGp4aTVMT3ciLCJ0YWciOiJrZTIxb1VEVm9KVlBuTjRkbkVWeGFBIn0.TE1OT1BRUlNUVVZX.ccCDrNpWsN7KHDuccPHSweYhtFyC-5BT3KZvmi42gPQ.woicaA18kgtkZSyBll2MdA",
  "recipientKid": "qy_8wxoAR8E1ox3SPWQQXhjbzmTHlXuMoOefH0Q_pLk"
})

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

test('reads the reviewed envelope and preserves its cryptographic bytes with fixed synthetic entropy', async () => {
  let offset = 0
  const vectorHelper = {
    ...cryptoHelper,
    async getRandomBytes(byteCount) {
      return Uint8Array.from({ length: byteCount }, () => offset++ % 251)
    },
  }
  const antifraud = new CryptographyService(vectorHelper)
  const recipient = await antifraud.generateKeyPairMlKem(
    Buffer.from(reviewedEnvelope.seedHex, 'hex'), 'ML-KEM-768',
  )
  assert.equal(recipient.publicJWKey.kid, reviewedEnvelope.recipientKid)
  const recipientPrivate = {
    ...recipient.publicJWKey,
    dBytes: recipient.secretKeyBytes,
  }
  const payload = 'cross-package confidential bytes'
  const protectedHeader = {
    typ: 'application/antifraud-confidential-artifact+jwe',
    enc: 'A256GCM',
    gdc_pq_profile: 'confidential-pqc-v1',
    gdc_key_purpose: 'document-at-rest',
    gdc_owner_binding: 'sha3-384:cross-package-owner',
  }

  const sharedEnvelope = reviewedEnvelope.compact
  assert.equal(
    Content.bytesToStringUTF8(
      (await antifraud.decryptJwe(sharedEnvelope, recipientPrivate)).decryptedBytes,
    ),
    payload,
  )

  const antifraudEnvelope = await antifraud.encryptJweToCompact(
    payload,
    protectedHeader,
    recipientPrivate,
    recipient.publicJWKey,
  )
  const actualParts = antifraudEnvelope.split('.')
  const reviewedParts = reviewedEnvelope.compact.split('.')
  // Recipient-wrap JSON member order is not a cryptographic field. Compare its
  // decoded fields independently; header, IV, ciphertext and tag remain exact.
  assert.deepEqual(
    Content.base64UrlSafeToJSON(actualParts[1]),
    Content.base64UrlSafeToJSON(reviewedParts[1]),
  )
  assert.deepEqual(
    actualParts.filter((_, index) => index !== 1),
    reviewedParts.filter((_, index) => index !== 1),
  )
  assert.equal(
    Content.bytesToStringUTF8(
      (await antifraud.decryptJwe(antifraudEnvelope, recipientPrivate)).decryptedBytes,
    ),
    payload,
  )
})
