// Flow contract: 1) an authenticated organization controller marks departments, Schema.org Places and client Services public or private; 2) the trusted publisher emits only a coherent public flat-claims catalog and DCAT descriptor; 3) a marketplace cache revalidates versioned descriptors without becoming authoritative; 4) private resources, broken relationships and caller-authored trust never enter the published dataset.
import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DcatDatasetClaim,
  SchemaOrgPlaceClaim,
  SchemaOrgServiceClaim,
  buildPublicOrganizationServiceCatalog,
  evaluateOrganizationCatalogCache,
} from '../dist/organization-service-catalog.js'

const input = Object.freeze({
  datasetId: '00000000-0000-4000-8000-000000000001',
  version: 3,
  issuedAt: '2026-10-21T10:00:00.000Z',
  modifiedAt: '2026-10-21T11:00:00.000Z',
  jurisdiction: 'CA-BC',
  sector: 'education',
  publisher: { id: 'organization-example', name: 'Example organization', publishInCatalog: true },
  departments: [{ id: 'department-learning', name: 'Learning services', publishInCatalog: true }],
  places: [
    { id: 'place-campus', departmentId: 'department-learning', name: 'Main campus', publishInCatalog: true, geo: { latitude: 49.28, longitude: -123.12 } },
    { id: 'place-internal', departmentId: 'department-learning', name: 'Internal office', publishInCatalog: false },
  ],
  services: [
    { id: 'service-assessment', departmentId: 'department-learning', name: 'Qualification assessment', serviceType: 'qualification-assessment', placeIds: ['place-campus'], publishInCatalog: true },
    { id: 'service-internal', departmentId: 'department-learning', name: 'Internal review', serviceType: 'internal-review', placeIds: ['place-internal'], publishInCatalog: false },
  ],
  distribution: { accessUrl: 'https://example.invalid/datasets/organization-example/services', mediaType: 'application/vnd.api+json' },
})

test('publishes only explicitly public Schema.org resources with flat claims', () => {
  const catalog = buildPublicOrganizationServiceCatalog(input)
  assert.equal(catalog.dataset.meta.claims[DcatDatasetClaim.Version], '3')
  assert.equal(catalog.resources.some(resource => resource.id === 'place-internal'), false)
  assert.equal(catalog.resources.some(resource => resource.id === 'service-internal'), false)
  const place = catalog.resources.find(resource => resource.id === 'place-campus')
  assert.equal(place?.meta.claims[SchemaOrgPlaceClaim.Name], 'Main campus')
  const service = catalog.resources.find(resource => resource.id === 'service-assessment')
  assert.deepEqual(service?.meta.claims[SchemaOrgServiceClaim.AvailableAtOrFrom], ['place-campus'])
})

test('fails closed when a public Service references a private or unknown Place', () => {
  assert.throws(() => buildPublicOrganizationServiceCatalog({
    ...input,
    services: [{ ...input.services[0], placeIds: ['place-internal'] }],
  }), /public_service_place_not_public/u)
  assert.throws(() => buildPublicOrganizationServiceCatalog({
    ...input,
    services: [{ ...input.services[0], placeIds: ['place-unknown'] }],
  }), /public_service_place_not_found/u)
})

test('makes cache refresh deterministic without turning discovery into trust', () => {
  const discovered = buildPublicOrganizationServiceCatalog(input).descriptor
  const cached = { ...discovered, checkedAt: '2026-10-21T11:05:00.000Z' }
  assert.deepEqual(evaluateOrganizationCatalogCache({ cached, discovered, checkedAt: '2026-10-21T11:09:00.000Z', maxAgeSeconds: 300 }), { action: 'use-cache', reason: 'fresh' })
  assert.deepEqual(evaluateOrganizationCatalogCache({ cached, discovered, checkedAt: '2026-10-21T11:11:00.000Z', maxAgeSeconds: 300 }), { action: 'revalidate', reason: 'stale' })
  assert.deepEqual(evaluateOrganizationCatalogCache({ cached, discovered: { ...discovered, version: 4 }, checkedAt: '2026-10-21T11:06:00.000Z', maxAgeSeconds: 300 }), { action: 'fetch', reason: 'new-version' })
  assert.deepEqual(evaluateOrganizationCatalogCache({ cached, discovered: { ...discovered, version: 2 }, checkedAt: '2026-10-21T11:06:00.000Z', maxAgeSeconds: 300 }), { action: 'reject', reason: 'rollback-detected' })
  assert.deepEqual(evaluateOrganizationCatalogCache({ cached, discovered: { ...discovered, status: 'withdrawn' }, checkedAt: '2026-10-21T11:06:00.000Z', maxAgeSeconds: 300 }), { action: 'evict', reason: 'withdrawn' })
})
