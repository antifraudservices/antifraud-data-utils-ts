// Flow contract: agreement publication uses a separate eligible-family union and defaulted DID generic; private and signing-only material cannot be asserted as an agreement key or silently widen existing crypto-engine inputs.
import type {PublicJwk,PublicAgreementJwk,X25519PublicJwk,EcAgreementPublicJwk,MldsaPublicJwk,ICryptography} from 'antifraud-data-utils-ts/cryptography'
import type {DidDocument,DidService,VerificationMethod} from 'antifraud-data-utils-ts/did-document'
import {DID_DOCUMENT_TEST_PUBLIC_KEYS as keys,DID_DOCUMENT_TEST_PROBES as probes,createDidDocumentTestFixture,createInvalidJoseAgreementKeyTestFixtures} from 'antifraud-data-utils-ts/did-document-test-fixtures'
const x:X25519PublicJwk=keys.x25519
const ec:EcAgreementPublicJwk=keys.ecEcdh
const material:PublicAgreementJwk=x
const document:DidDocument<DidService,string|string[],PublicAgreementJwk>=createDidDocumentTestFixture({did:probes.reservedDid,keys:[x,ec]})
const method:VerificationMethod<PublicAgreementJwk>|undefined=document.verificationMethod?.[0]
const existing:PublicJwk=keys.ec
const defaultDocument:DidDocument=createDidDocumentTestFixture({did:probes.reservedDid})
// @ts-expect-error The signing-engine public union remains unchanged.
const notSigningEngineInput:Parameters<ICryptography['verifyBytes']>[2]=x
// @ts-expect-error A private scalar is forbidden in the public X25519 projection.
const privateMaterial:X25519PublicJwk={...x,d:x.x}
declare const signature:MldsaPublicJwk
// @ts-expect-error AKP signing material is not an eligible agreement-key family.
const signingAgreement:PublicAgreementJwk=signature
const invalid:unknown=createInvalidJoseAgreementKeyTestFixtures()[0]!.publicKeyJwk
// @ts-expect-error Adversarial fixture data requires runtime validation.
const unvalidated:PublicAgreementJwk=invalid
void [material,method,existing,defaultDocument,notSigningEngineInput,privateMaterial,signingAgreement,unvalidated]
