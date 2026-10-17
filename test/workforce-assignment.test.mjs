// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// Journey: the controller proposes optional department and group assignments in an invitation; acceptance activates membership;
// later assignment changes require a Communication notice but never create an employee-specific Consent.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  defineWorkforceAssignmentChangeNotice,
  defineWorkforceInvitationAssignmentProposal,
} from '../dist/identity-assurance/index.js'

const invitation = Object.freeze({
  invitationReference: 'urn:invitation:opaque',
  inviteeReference: 'urn:invitee:opaque',
  organizationReference: 'urn:organization:opaque',
  departmentReference: 'urn:department:student-services',
  groupReferences: Object.freeze([
    'urn:group:subject-maintenance',
    'urn:group:identity-evidence-review',
  ]),
})

test('keeps optional department and group proposals non-authorizing until invitation acceptance', () => {
  const proposal = defineWorkforceInvitationAssignmentProposal(invitation)

  assert.equal(proposal.status, 'proposed')
  assert.equal(proposal.grantsAuthorization, false)
  assert.equal(proposal.departmentReference, invitation.departmentReference)
  assert.deepEqual(proposal.groupReferences, invitation.groupReferences)
})

test('requires one Communication notice for assignment changes without creating employee Consent', () => {
  const notice = defineWorkforceAssignmentChangeNotice({
    recipientAssignmentReference: 'urn:assignment:employee',
    organizationReference: invitation.organizationReference,
    authorizedByControllerReference: 'urn:controller:organization',
    effectiveAt: '2026-10-17T18:00:00.000Z',
    previous: {departmentReference: invitation.departmentReference, groupReferences: invitation.groupReferences},
    current: {departmentReference: 'urn:department:registrar', groupReferences: ['urn:group:subject-maintenance']},
  })

  assert.equal(notice.communicationRequired, true)
  assert.equal(notice.kind, 'workforce-assignment-change')
  assert.equal('consentReference' in notice, false)
})

test('rejects duplicated group proposals', () => {
  assert.throws(
    () => defineWorkforceInvitationAssignmentProposal({
      ...invitation,
      groupReferences: ['urn:group:subject-maintenance', 'urn:group:subject-maintenance'],
    }),
    /duplicate group/i,
  )
})
