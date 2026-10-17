export type WorkforceAssignmentState = Readonly<{
  departmentReference?: string
  groupReferences: readonly string[]
}>

export type WorkforceInvitationAssignmentProposal = WorkforceAssignmentState & Readonly<{
  invitationReference: string
  inviteeReference: string
  organizationReference: string
  status: 'proposed'
  grantsAuthorization: false
}>

export type WorkforceAssignmentChangeNotice = Readonly<{
  kind: 'workforce-assignment-change'
  recipientAssignmentReference: string
  organizationReference: string
  authorizedByControllerReference: string
  effectiveAt: string
  previous: WorkforceAssignmentState
  current: WorkforceAssignmentState
  communicationRequired: true
}>

function requireNonEmpty(value: string, field: string): string {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(`${field} must not be empty`)
  return normalized
}

function normalizeAssignmentState(input: WorkforceAssignmentState): WorkforceAssignmentState {
  const groupReferences = input.groupReferences.map((reference) => requireNonEmpty(reference, 'groupReference'))
  if (new Set(groupReferences).size !== groupReferences.length) {
    throw new TypeError('Duplicate group proposals are not allowed')
  }
  return Object.freeze({
    ...(input.departmentReference
      ? { departmentReference: requireNonEmpty(input.departmentReference, 'departmentReference') }
      : {}),
    groupReferences: Object.freeze(groupReferences),
  })
}

/**
 * Defines non-authorizing department and group proposals carried by an
 * employee invitation. Acceptance still requires activation of the employee
 * assignment and each group membership through the authoritative backend.
 */
export function defineWorkforceInvitationAssignmentProposal(input: Readonly<{
  invitationReference: string
  inviteeReference: string
  organizationReference: string
  departmentReference?: string
  groupReferences: readonly string[]
}>): WorkforceInvitationAssignmentProposal {
  const assignment = normalizeAssignmentState(input)
  return Object.freeze({
    invitationReference: requireNonEmpty(input.invitationReference, 'invitationReference'),
    inviteeReference: requireNonEmpty(input.inviteeReference, 'inviteeReference'),
    organizationReference: requireNonEmpty(input.organizationReference, 'organizationReference'),
    status: 'proposed',
    grantsAuthorization: false,
    ...assignment,
  })
}

/**
 * Builds the non-personal payload that a transport adapter places in a
 * Communication. It records an assignment change; it never creates or updates
 * an employee-specific Consent.
 */
export function defineWorkforceAssignmentChangeNotice(input: Readonly<{
  recipientAssignmentReference: string
  organizationReference: string
  authorizedByControllerReference: string
  effectiveAt: string
  previous: WorkforceAssignmentState
  current: WorkforceAssignmentState
}>): WorkforceAssignmentChangeNotice {
  return Object.freeze({
    kind: 'workforce-assignment-change',
    recipientAssignmentReference: requireNonEmpty(input.recipientAssignmentReference, 'recipientAssignmentReference'),
    organizationReference: requireNonEmpty(input.organizationReference, 'organizationReference'),
    authorizedByControllerReference: requireNonEmpty(input.authorizedByControllerReference, 'authorizedByControllerReference'),
    effectiveAt: requireNonEmpty(input.effectiveAt, 'effectiveAt'),
    previous: normalizeAssignmentState(input.previous),
    current: normalizeAssignmentState(input.current),
    communicationRequired: true,
  })
}
