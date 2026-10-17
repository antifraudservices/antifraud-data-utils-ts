const evidenceSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', minLength: 1 },
  },
  additionalProperties: true,
} as const

export const verifiedClaimsJsonSchema = Object.freeze({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://antifraudservices.github.io/antifraud-data-utils-ts/schemas/oidc4ida-verified-claims.json',
  title: 'OIDC4IDA Verified Claims',
  type: 'object',
  required: ['claims', 'verification'],
  properties: {
    claims: {
      type: 'object',
      additionalProperties: true,
    },
    verification: {
      type: 'object',
      required: ['evidence'],
      properties: {
        trust_framework: { type: ['string', 'null'] },
        assurance_level: { type: ['string', 'null'] },
        assurance_process: { type: ['string', 'null'] },
        verification_process: { type: ['string', 'null'] },
        time: { type: ['string', 'null'], format: 'date-time' },
        evidence: {
          type: 'array',
          minItems: 1,
          items: evidenceSchema,
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: false,
} as const)
