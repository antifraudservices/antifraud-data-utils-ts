// Flow contract: a typed education credential and a decoded presentation retain their distinct profiles; merely populating proof or issuer fields confers no verified status.
import {
  W3cCredentialContexts, W3cCredentialTypes,
  type CredentialProof, type VerifiableCredentialV2, type VpCredentialInput, type VpTokenPayload, type VpTokenHeader,
} from 'antifraud-data-utils-ts/credential-contracts'
interface EducationSubject { id: string; qualification: { name: string } }
const credential: VerifiableCredentialV2<EducationSubject> = {
  '@context': [W3cCredentialContexts.V2],
  type: [W3cCredentialTypes.VerifiableCredential],
  issuer: 'did:example:issuer',
  credentialSubject: { id: 'did:example:subject', qualification: { name: 'Example qualification' } },
  validFrom: '2026-11-13T00:00:00Z',
}
const proof: CredentialProof = { type: 'DataIntegrityProof', verificationMethod: 'did:example:issuer#key', proofPurpose: 'assertionMethod' }
credential.proof = proof
const unsigned: Omit<VerifiableCredentialV2<EducationSubject>, 'proof'> = credential
const reconstructed: VerifiableCredentialV2<EducationSubject> = { ...unsigned, proof }
credential.credentialSubject.qualification.name.toUpperCase()
const entry: VpCredentialInput = credential
const presentation: VpTokenPayload = { iss: 'did:example:holder', nonce: 'challenge-example', vp: { '@context': [W3cCredentialContexts.V1], type: [W3cCredentialTypes.VerifiablePresentation], holder: 'did:example:holder', verifiableCredential: [entry, 'encoded-credential-placeholder'] } }
const header: VpTokenHeader = { alg: 'ES256', typ: 'JWT' }
// @ts-expect-error the supported credential profile requires an issuer
const missingIssuer: VerifiableCredentialV2<EducationSubject> = { '@context': credential['@context'], type: credential.type, credentialSubject: credential.credentialSubject, validFrom: credential.validFrom }
// @ts-expect-error the supported proof profile retains its required proof type
const missingProofType: CredentialProof = { verificationMethod: proof.verificationMethod }
// @ts-expect-error this supported consumer profile has one object subject, not a subject array
const wrongSubject: VerifiableCredentialV2<EducationSubject> = { ...credential, credentialSubject: [credential.credentialSubject] }
// @ts-expect-error choosing an array generic does not bypass the supported object-subject profile
const arraySubject: VerifiableCredentialV2<string[]> = { ...credential, credentialSubject: [] }
// @ts-expect-error removing proof must not erase the remaining required credential fields
const missingUnsigned: Omit<VerifiableCredentialV2<EducationSubject>, 'proof'> = {}
// @ts-expect-error a decoded presentation payload is not an encoded JWT string
const encoded: string = presentation
// @ts-expect-error the JWT presentation profile requires an issuer
const wrongPresentation: VpTokenPayload = { vp: presentation.vp }
// @ts-expect-error a typed subject does not become an arbitrary collection of unvalidated fields
credential.credentialSubject.unsupportedClaim
void [header, reconstructed, missingIssuer, missingProofType, wrongSubject, arraySubject, missingUnsigned, encoded, wrongPresentation]
