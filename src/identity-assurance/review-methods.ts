/** Submitted document-review methods; selecting one does not verify evidence. */
export const IdentityEvidenceReviewMethods=Object.freeze({
 PhysicalInPerson:'pipp',
 SupervisedRemote:'sripp',
 ElectronicIdentity:'eid',
 UnsupervisedRemote:'uripp',
} as const)
export type IdentityEvidenceReviewMethod=typeof IdentityEvidenceReviewMethods[keyof typeof IdentityEvidenceReviewMethods]
