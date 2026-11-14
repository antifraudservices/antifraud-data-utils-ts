// Flow contract: public identity documents retain verification relationships and public keys independently from decoded or encoded signature data.
import type { DidDocument, DidService, VerificationMethod } from 'antifraud-data-utils-ts/did-document'
import type { JwsHeader, JwsMultiSign } from 'antifraud-data-utils-ts/cryptography'
const did = 'did:example:subject'
const method: VerificationMethod = { id: `${did}#key`, type: 'JsonWebKey', controller: did, publicKeyJwk: { kty: 'EC', crv: 'P-256', x: 'AA', y: 'AA' } }
const document: DidDocument = { '@context': 'https://www.w3.org/ns/did/v1', id: did, verificationMethod: [method], authentication: [method.id], keyAgreement: [method] }
const structured: DidService<{ uri: string }> = { id: `${did}#service`, type: 'DIDCommMessaging', serviceEndpoint: { uri: did } }
const custom: DidDocument<typeof structured> = { '@context': document['@context'], id: did, service: [structured] }
const header: JwsHeader = { alg: 'ES256', kid: method.id }
const serialized: JwsMultiSign = { payload: 'AA', signatures: [{ protected: 'AA', signature: 'AA' }] }
// @ts-expect-error the key-bearing verification method profile requires its controller
const missingController: VerificationMethod = { id: method.id, type: method.type, publicKeyJwk: method.publicKeyJwk }
// @ts-expect-error the public key projection does not declare private scalar material
const privateKey: VerificationMethod = { ...method, publicKeyJwk: { kty: 'EC', crv: 'P-256', x: 'AA', y: 'AA', d: 'private' } }
// @ts-expect-error decoded header objects are not encoded JWS protected header strings
const wrongSerialization: JwsMultiSign = { payload: 'AA', signatures: [{ protected: header, signature: 'AA' }] }
void [document, custom, serialized, missingController, privateKey, wrongSerialization]
