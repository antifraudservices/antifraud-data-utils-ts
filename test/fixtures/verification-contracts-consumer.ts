// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
import type {
  CredentialPresentationRequest, CredentialPresentationSubmission,
  CredentialPresentationVerificationResult, GaiaXComplianceSubmission,
  GaiaXComplianceVerificationResult,
} from 'antifraud-data-utils-ts/verification-contracts'

export const presentationSubmission = (request: CredentialPresentationRequest, presentation: string): CredentialPresentationSubmission => ({ request, presentation })
export const complianceSubmission = (presentation: string): GaiaXComplianceSubmission => ({ presentation })
export const verifiedReferences = (result: CredentialPresentationVerificationResult): readonly string[] => result.credentialReferences
export const signedComplianceArtifact = (result: GaiaXComplianceVerificationResult): string => result.credentialJwt
