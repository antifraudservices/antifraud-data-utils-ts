/** Nonstandard cross-sector tags for private identifier inputs; not clinical identifier codes. */
export const IdentifierInputKinds=Object.freeze({
  Uuid:'UUID',
  Email:'EMAIL',
  Phone:'PHONE',
} as const)

/** Selecting a tag does not normalize, hash, verify or authorize its input. */
export type IdentifierInputKind=typeof IdentifierInputKinds[keyof typeof IdentifierInputKinds]
