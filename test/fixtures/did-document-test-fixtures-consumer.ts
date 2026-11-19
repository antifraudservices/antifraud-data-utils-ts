// Flow contract: reusable positive DID fixtures retain canonical public types; adversarial JSON cannot be assigned to a trusted DID document.
import {createDidDocumentTestFixture,createInvalidDidDocumentTestFixtures,DID_DOCUMENT_TEST_PUBLIC_KEYS,DID_DOCUMENT_TEST_PROBES} from 'antifraud-data-utils-ts/did-document-test-fixtures'
import type {DidDocument,VerificationMethod} from 'antifraud-data-utils-ts/did-document'
import type {PublicJwk} from 'antifraud-data-utils-ts/cryptography'
const key:PublicJwk=DID_DOCUMENT_TEST_PUBLIC_KEYS.ec
const document:DidDocument=createDidDocumentTestFixture({did:DID_DOCUMENT_TEST_PROBES.reservedDid,keys:[key]})
const method:VerificationMethod|undefined=document.verificationMethod?.[0]
const invalid:unknown=createInvalidDidDocumentTestFixtures({did:document.id})[0]!.document
// @ts-expect-error Adversarial data must pass the consumer's authority validator.
const rejected:DidDocument=invalid
void method;void rejected
