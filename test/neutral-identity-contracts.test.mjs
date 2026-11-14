// Flow contract: cross-sector identity consumers retain exact flat claim identities and compile registration/token data without importing a product, authorizing a session or changing existing catalog identifiers.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import * as contracts from '../dist/index.js'
import * as catalog from '../dist/organization-service-catalog.js'

test('person and action claims are reusable without a healthcare role policy', () => {
  assert.equal(contracts.SchemaOrgPersonClaim?.OccupationIdentifierValue, 'org.schema.Person.hasOccupation.identifier.value')
  assert.equal(contracts.SchemaOrgPersonClaim?.OccupationIdentifierSystem, 'org.schema.Person.hasOccupation.identifier.additionalType')
  assert.equal(contracts.SchemaOrgPersonClaim?.Identifier, 'org.schema.Person.identifier')
  assert.equal(contracts.SchemaOrgPersonClaim?.IdentifierValue, 'org.schema.Person.identifier.value')
  assert.equal(contracts.SchemaOrgPersonClaim?.MemberOf, 'org.schema.Person.memberOf')
  assert.equal(contracts.SchemaOrgActionClaim?.AgentIdentifier, 'org.schema.Action.agent.identifier')
  assert.equal(contracts.SchemaOrgActionClaim?.StartTime, 'org.schema.Action.startTime')
  assert.ok(Object.isFrozen(contracts.SchemaOrgPersonClaim))
  assert.ok(Object.isFrozen(contracts.SchemaOrgActionClaim))
})

test('expanded organization and service claims preserve catalog identifiers and distinguish references', () => {
  assert.equal(contracts.SchemaOrgOrganizationClaim.Identifier, 'org.schema.Organization.identifier.value')
  assert.equal(contracts.SchemaOrgOrganizationClaim.IdentifierReference, 'org.schema.Organization.identifier')
  assert.equal(contracts.SchemaOrgOrganizationClaim.IdentifierValue, contracts.SchemaOrgOrganizationClaim.Identifier)
  assert.equal(contracts.SchemaOrgOrganizationClaim.MemberIdentifierType, 'org.schema.Organization.member.identifier.additionalType')
  assert.equal(contracts.SchemaOrgOrganizationClaim.HasCredentialMaterial, 'org.schema.Organization.hasCredential.material')
  assert.equal(contracts.SchemaOrgServiceClaim.Identifier, 'org.schema.Service.identifier.value')
  assert.equal(contracts.SchemaOrgServiceClaim.IdentifierReference, 'org.schema.Service.identifier')
  assert.equal(contracts.SchemaOrgServiceClaim.TermsOfService, 'org.schema.Service.termsOfService')
  assert.strictEqual(catalog.SchemaOrgOrganizationClaim, contracts.SchemaOrgOrganizationClaim)
  assert.strictEqual(catalog.SchemaOrgServiceClaim, contracts.SchemaOrgServiceClaim)
  assert.strictEqual(catalog.SchemaOrgPlaceClaim, contracts.SchemaOrgPlaceClaim)
})

test('neutral identity catalog retains existing OpenID identity-assurance mappings', () => {
  for (const [field, identityField] of [
    ['Name','PersonName'], ['GivenName','PersonGivenName'], ['FamilyName','PersonFamilyName'],
    ['BirthDate','PersonBirthDate'], ['Gender','PersonGender'], ['Email','PersonEmail'], ['Telephone','PersonTelephone'],
  ]) assert.equal(contracts.SchemaOrgPersonClaim?.[field], contracts.SchemaOrgIdentityClaim[identityField])
})

test('public consumer separates standard registration data, device extensions and access-token profile', () => {
  const fixture = fileURLToPath(new URL('./fixtures/neutral-identity-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})
