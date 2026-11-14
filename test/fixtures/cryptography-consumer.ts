// Flow contract: compile the public consumer API without treating a type declaration as cryptographic validation or key custody.
import type {
  ICryptography, CryptographyService, ICryptoHelper, BaseJwk, EcBaseJwk,
  PublicJwk, JWK, JwkSet, AesGcmComponents, ProtectedDataAES, MldsaPrivateJwk,
} from 'antifraud-data-utils-ts/cryptography'

declare const implementation: CryptographyService
declare const helper: ICryptoHelper
const engine: ICryptography = implementation
declare const signingKey: MldsaPrivateJwk
const signingBytes: Uint8Array = signingKey.privBytes
const ec: EcBaseJwk = { kty: 'EC', crv: 'P-256', x: 'example-x', y: 'example-y' }
const key: BaseJwk = ec
const imported: JWK = { ...ec, kid: 'example-key' }
const set: JwkSet = { keys: [imported] }
const bytes: AesGcmComponents = {
  ciphertext: new Uint8Array(), iv: new Uint8Array(), authTag: new Uint8Array(),
}
const encoded: ProtectedDataAES = { ciphertext: 'example', iv: 'example', tag: 'example' }
// @ts-expect-error Encoded strings are not raw cryptographic bytes.
const wrongBytes: AesGcmComponents = encoded
// @ts-expect-error Publication key literals do not have private key parameters.
const wrongPublication: PublicJwk = { ...ec, d: 'example-private-parameter' }
void [engine, helper, key, set, bytes, encoded, wrongBytes, wrongPublication, signingBytes]
