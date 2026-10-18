// Flow contract: signing requests bind trusted user, device, operation, manifest, purpose and relying party; user presence authorizes one operation but is not itself a signature.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  ManagedSignatureRequestState,
  ManagedSigningAlgorithm,
  ManagedSigningKeyPurpose,
  SyntheticManagedSignatureRequestFixture,
  UserPresenceMethod,
  defineManagedSignatureRequest,
} from '../dist/index.js'

test('owns the managed-signing vocabulary and a complete synthetic fixture', () => {
  assert.deepEqual(ManagedSignatureRequestState, {
    Pending: 'pending',
    Authorized: 'authorized',
    Rejected: 'rejected',
    Cancelled: 'cancelled',
    Expired: 'expired',
    Signed: 'signed',
    Failed: 'failed',
  })
  assert.deepEqual(UserPresenceMethod, {
    Biometric: 'biometric',
    Pin: 'pin',
    Password: 'password',
  })
  assert.equal(ManagedSigningAlgorithm.MlDsa65, 'ML-DSA-65')
  assert.equal(ManagedSigningKeyPurpose.ActorSigning, 'actor-signing')

  const request = defineManagedSignatureRequest(
    SyntheticManagedSignatureRequestFixture.draft,
    SyntheticManagedSignatureRequestFixture.trustedContext,
  )
  assert.equal(request.state, ManagedSignatureRequestState.Pending)
  assert.equal(request.manifest.digestAlgorithm, 'sha3-384')
  assert.equal(request.signingKey.algorithm, ManagedSigningAlgorithm.MlDsa65)
  assert.equal(Object.isFrozen(request), true)
})

test('rejects browser-authored authority, malformed digests and non-future expiry', () => {
  const fixture = SyntheticManagedSignatureRequestFixture
  assert.throws(
    () => defineManagedSignatureRequest(
      {...fixture.draft, relyingParty: 'https://attacker.example'},
      fixture.trustedContext,
    ),
    /server-owned signing authority.*relyingParty/i,
  )
  assert.throws(
    () => defineManagedSignatureRequest(
      {...fixture.draft, manifest: {...fixture.draft.manifest, digest: 'not-sha3-384'}},
      fixture.trustedContext,
    ),
    /48-byte SHA3-384 digest/i,
  )
  assert.throws(
    () => defineManagedSignatureRequest(
      {...fixture.draft, expiresAt: fixture.draft.createdAt},
      fixture.trustedContext,
    ),
    /expiresAt must be after createdAt/i,
  )
})

test('requires the reviewed ML-DSA-65 actor-signing key context', () => {
  const fixture = SyntheticManagedSignatureRequestFixture
  assert.throws(
    () => defineManagedSignatureRequest(fixture.draft, {
      ...fixture.trustedContext,
      signingKey: {...fixture.trustedContext.signingKey, algorithm: 'ML-DSA-44'},
    }),
    /ML-DSA-65/i,
  )
  assert.throws(
    () => defineManagedSignatureRequest(fixture.draft, {
      ...fixture.trustedContext,
      signingKey: {...fixture.trustedContext.signingKey, purpose: 'comm-signing'},
    }),
    /actor-signing/i,
  )
})
