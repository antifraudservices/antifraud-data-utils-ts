/** Internal identity-governance tags shared across sectors; these are not occupations or authorization evidence. */
export const ActorKinds = Object.freeze({
  HostOnboarding: 'host_onboarding',
  OrganizationController: 'organization_controller',
  OrganizationEmployee: 'organization_employee',
  IndividualController: 'individual_controller',
  IndividualMember: 'individual_member',
  Professional: 'professional',
} as const)

export type ActorKind = typeof ActorKinds[keyof typeof ActorKinds]
const knownKinds = new Set<string>(Object.values(ActorKinds))

/** Validates the stored tag without coercing caller objects or inferring a professional role. */
export function isActorKind(value: unknown): value is ActorKind {
  return typeof value === 'string' && knownKinds.has(value)
}
