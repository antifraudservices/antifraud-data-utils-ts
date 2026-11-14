// Flow contract: parsing exposes unvalidated field values; credential schema, issuer and signature checks remain explicit caller responsibilities.
import { decodeUnverifiedJsonOrJwtObject, extractUnverifiedPresentationCredentials } from 'antifraud-data-utils-ts/credential-decoding'
import type { VerifiableCredentialV2 } from 'antifraud-data-utils-ts/credential-contracts'
const record = decodeUnverifiedJsonOrJwtObject('{}')
if (record) {
  const issuer: unknown = record.issuer
  // @ts-expect-error parsing does not validate a required credential schema
  const credential: VerifiableCredentialV2 = record
  // @ts-expect-error an unvalidated issuer is not automatically a usable string
  record.issuer.toUpperCase()
  void [issuer, credential]
}
const credentials = extractUnverifiedPresentationCredentials('{}')
const subject: unknown = credentials[0]?.credentialSubject
// @ts-expect-error parsed nested data remains unknown until explicitly validated
subject.id
void subject
