import type { JWK } from './types.js'

/** Engine signing profile with explicit algorithm/key selection; this is not every possible JOSE header shape. */
export interface JwsHeader {
  alg: string
  kid: string
  cty?: string
  typ?: string
  /** Import shape only; callers must enforce public-only publication before emitting an embedded key. */
  jwk?: JWK
}
/** Encoded signature fields in the engine's General JWS JSON serialization. */
export interface JwsDetachedSignParts {
  protected: string
  signature: string
}
export interface JwsMultiSign {
  payload: string
  signatures: JwsDetachedSignParts[]
}
