// Flow contract: an authorized service records one neutral conversation event when it updates a subject index, exposing only governed references to its EHR/CMS/customer portal and rejecting unsafe or authority-free links.
import test from 'node:test'
import assert from 'node:assert/strict'
import { buildServiceSubjectIndexUpdate } from '../dist/service-conversation.js'

test('builds one organization/service-scoped subject-index update event', () => {
  const event = buildServiceSubjectIndexUpdate({
    id: 'index-update-1',
    createdAt: '2026-11-06T12:00:00.000Z',
    organizationReference: 'Organization/clinic-one',
    serviceReference: 'Service/immunization-records',
    serviceName: 'Immunization records',
    authoritativeSystem: 'ehr',
    references: [{ label: 'Vaccination record', href: 'https://portal.example/records/vaccination-1', mediaType: 'application/fhir+json' }],
  })

  assert.equal(event.content.kind, 'subject-index-update')
  assert.equal(event.content.references[0].label, 'Vaccination record')
  assert.equal(event.content.references[0].href, 'https://portal.example/records/vaccination-1')
  assert.equal(Object.isFrozen(event.content.references), true)
})

test('rejects an index update without a service or with credential-bearing links', () => {
  assert.throws(() => buildServiceSubjectIndexUpdate({
    id: 'index-update-1', createdAt: '2026-11-06T12:00:00.000Z',
    organizationReference: 'Organization/clinic-one', serviceReference: '',
    serviceName: 'Records', authoritativeSystem: 'cms',
    references: [{ label: 'Record', href: 'https://portal.example/record' }],
  }), /serviceReference/)
  assert.throws(() => buildServiceSubjectIndexUpdate({
    id: 'index-update-1', createdAt: '2026-11-06T12:00:00.000Z',
    organizationReference: 'Organization/clinic-one', serviceReference: 'Service/records',
    serviceName: 'Records', authoritativeSystem: 'cms',
    references: [{ label: 'Record', href: 'https://user:secret@portal.example/record' }],
  }), /credentials/)
})
