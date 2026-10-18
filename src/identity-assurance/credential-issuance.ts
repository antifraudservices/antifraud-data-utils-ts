import {
  IdentityAttestationCapability,
  type IdentityAttestationCapabilityValue,
} from './vocabulary.js'

export const CredentialIssuanceStatus = Object.freeze({
  Pending: 'pending',
  Issued: 'issued',
  Denied: 'denied',
  Failed: 'failed',
} as const)

export type CredentialIssuanceStatusValue =
  typeof CredentialIssuanceStatus[keyof typeof CredentialIssuanceStatus]

export type CredentialIssuanceRequest = Readonly<{
  subjectReference: string
  capability: IdentityAttestationCapabilityValue
  verificationTransactionId: string
}>

export type CredentialIssuanceRequestWire = Readonly<{
  subject_reference: string
  capability: IdentityAttestationCapabilityValue
  verification_transaction_id: string
}>

export type CredentialIssuanceReceipt = Readonly<{
  issuanceId: string
  status: CredentialIssuanceStatusValue
  credential?: unknown
  credentialReference?: string
  reason?: string
}>

export type CredentialIssuanceReceiptWire = Readonly<{
  issuance_id: string
  status: CredentialIssuanceStatusValue
  credential?: unknown
  credential_reference?: string
  reason?: string
}>

function requireText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string`)
  }
  return value.trim()
}

function isCapability(value: string): value is IdentityAttestationCapabilityValue {
  return (Object.values(IdentityAttestationCapability) as readonly string[]).includes(value)
}

function isStatus(value: unknown): value is CredentialIssuanceStatusValue {
  return typeof value === 'string'
    && (Object.values(CredentialIssuanceStatus) as readonly string[]).includes(value)
}

export function defineCredentialIssuanceRequest(
  input: CredentialIssuanceRequest & Record<string, unknown>,
): CredentialIssuanceRequest {
  if ('claims' in input) {
    throw new TypeError(
      'Caller-supplied claims are not accepted; the provider must perform authoritative readback',
    )
  }
  const subjectReference = requireText(input.subjectReference, 'subjectReference')
  const capability = requireText(input.capability, 'capability')
  if (!isCapability(capability)) {
    throw new TypeError('capability must be a governed identity-attestation capability')
  }
  return Object.freeze({
    subjectReference,
    capability,
    verificationTransactionId: requireText(
      input.verificationTransactionId,
      'verificationTransactionId',
    ),
  })
}

export function toCredentialIssuanceRequestWire(
  input: CredentialIssuanceRequest & Record<string, unknown>,
): CredentialIssuanceRequestWire {
  const request = defineCredentialIssuanceRequest(input)
  return Object.freeze({
    subject_reference: request.subjectReference,
    capability: request.capability,
    verification_transaction_id: request.verificationTransactionId,
  })
}

export function parseCredentialIssuanceReceiptWire(
  value: unknown,
): CredentialIssuanceReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('Invalid credential-provider response')
  }
  const input = value as Record<string, unknown>
  let issuanceId: string
  try {
    issuanceId = requireText(input.issuance_id, 'issuance_id')
  } catch {
    throw new TypeError('Invalid credential-provider response')
  }
  if (!isStatus(input.status)) {
    throw new TypeError('Invalid credential-provider response')
  }
  const credentialReference = typeof input.credential_reference === 'string'
    && input.credential_reference.trim().length > 0
    ? input.credential_reference.trim()
    : undefined
  const reason = typeof input.reason === 'string' && input.reason.trim().length > 0
    ? input.reason.trim()
    : undefined
  const hasCredential = Object.prototype.hasOwnProperty.call(input, 'credential')

  if (input.status === CredentialIssuanceStatus.Issued && !hasCredential && !credentialReference) {
    throw new TypeError('An issued credential receipt requires a credential or credential reference')
  }
  if (
    (input.status === CredentialIssuanceStatus.Denied
      || input.status === CredentialIssuanceStatus.Failed)
    && hasCredential
  ) {
    throw new TypeError(`${input.status} credential receipt must not include a credential`)
  }
  if (
    (input.status === CredentialIssuanceStatus.Denied
      || input.status === CredentialIssuanceStatus.Failed)
    && !reason
  ) {
    throw new TypeError(`${input.status} credential receipt requires a reason`)
  }

  return Object.freeze({
    issuanceId,
    status: input.status,
    ...(hasCredential ? {credential: input.credential} : {}),
    ...(credentialReference ? {credentialReference} : {}),
    ...(reason ? {reason} : {}),
  })
}

export const credentialIssuanceRequestFixture = Object.freeze({
  subjectReference: 'urn:subject:synthetic',
  capability: IdentityAttestationCapability.AttestRelationship,
  verificationTransactionId: 'verification-synthetic-001',
}) satisfies CredentialIssuanceRequest
