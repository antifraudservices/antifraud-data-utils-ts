// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
/** Non-operational Gaia-X projection values, shared by compatibility and consumer tests. */
export const GaiaXProjectionExamples=Object.freeze({
  organizationDid:'did:web:example.invalid:organization',
  issuerDid:'did:web:example.invalid:host',
  credentialId:'urn:uuid:00000000-0000-4000-8000-000000000001',
  registrationCredentialId:'https://example.invalid/credentials/registration',
  legalName:'Example organization',
  countryCode:'CA',
  website:'https://example.invalid',
  validFrom:'2026-11-08T00:00:00.000Z',
})
