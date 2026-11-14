// Flow contract: cross-sector order and offer consumers preserve indexed flat claim identities without importing professional licence policy or treating a declared product category as authorization.
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { fileURLToPath } from 'node:url'
import * as contracts from '../dist/index.js'

test('neutral commerce claim identities retain offer quantities, order links and product serials', () => {
  assert.equal(contracts.SchemaOrgOfferClaim?.Identifier, 'org.schema.Offer.identifier')
  assert.equal(contracts.SchemaOrgOfferClaim?.EligibleQuantityValue, 'org.schema.Offer.eligibleQuantity.value')
  assert.equal(contracts.SchemaOrgOfferClaim?.ItemOfferedSku, 'org.schema.Offer.itemOffered.sku')
  assert.equal(contracts.SchemaOrgOrderClaim?.AcceptedOfferIdentifier, 'org.schema.Order.acceptedOffer.identifier')
  assert.equal(contracts.SchemaOrgOrderClaim?.ConfirmationNumber, 'org.schema.Order.confirmationNumber')
  assert.equal(contracts.SchemaOrgIndividualProductClaim?.SerialNumber, 'org.schema.IndividualProduct.serialNumber')
  for (const vocabulary of [contracts.SchemaOrgOfferClaim, contracts.SchemaOrgOrderClaim, contracts.SchemaOrgIndividualProductClaim]) assert.ok(Object.isFrozen(vocabulary))
})

test('education and other sector commerce consumers compile through the neutral public subpath', () => {
  const fixture = fileURLToPath(new URL('./fixtures/commerce-claims-consumer.ts', import.meta.url))
  const program = ts.createProgram([fixture], { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext, strict: true, noEmit: true, skipLibCheck: true, types: [] })
  assert.deepEqual(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, '\n')), [])
})
