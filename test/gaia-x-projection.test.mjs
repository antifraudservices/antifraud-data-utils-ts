// Flow contract: reuse shared test fixtures and canonical types; do not introduce duplicated literals.
// Unsigned legal-person descriptions retain an explicit registration reference;
// constructing a description does not verify it or confer participant authority.
import test from 'node:test'
import assert from 'node:assert/strict'
import {GaiaXProjectionExamples as examples} from './fixtures/gaia-x-values.mjs'
import {SchemaOrgOrganizationClaim} from '../dist/schema-org-claims.js'
import {buildGaiaXLegalPersonCredentialDraft} from '../dist/gaia-x-projection.js'

const input={claims:{
  [SchemaOrgOrganizationClaim.LegalName]:examples.legalName,
  [SchemaOrgOrganizationClaim.AddressCountry]:examples.countryCode,
  [SchemaOrgOrganizationClaim.Url]:examples.website,
},credentialId:examples.credentialId,subjectId:examples.organizationDid,issuerId:examples.issuerDid,
legalRegistrationNumberCredentialId:examples.registrationCredentialId,validFrom:examples.validFrom}
test('preserves the organization, issuer and legal registration reference',()=>{
  const credential=buildGaiaXLegalPersonCredentialDraft(input)
  assert.equal(credential.credentialSubject.id,examples.organizationDid)
  assert.equal(credential.issuer,examples.issuerDid)
  assert.deepEqual(credential.credentialSubject['gx:legalRegistrationNumber'],{id:examples.registrationCredentialId})
  assert.equal(credential.credentialSubject['gx:legalName'],examples.legalName)
  assert.equal(credential.proof,undefined)
})
test('requires the registration reference rather than inventing one',()=>{
  assert.throws(()=>buildGaiaXLegalPersonCredentialDraft({...input,legalRegistrationNumberCredentialId:''}),/registration/i)
})
