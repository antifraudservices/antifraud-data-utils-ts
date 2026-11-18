// Flow contract: pharmacy and office occupations resolve from the neutral ISCO catalog without product roles or authorization fields.
import assert from 'node:assert/strict'
import test from 'node:test'
import { Isco08Occupations, Isco08CodingSystem, findIsco08Occupation } from '../dist/isco-08.js'

for (const [name, code, display] of [
  ['Pharmacist', '2262', 'Pharmacists'],
  ['PharmaceuticalTechnicianOrAssistant', '3213', 'Pharmaceutical Technicians and Assistants'],
  ['GeneralOfficeClerk', '4110', 'General Office Clerks'],
]) {
  test(`resolves ${code} from the shared occupation catalog`, () => {
    const coding = Isco08Occupations[name]
    assert.deepEqual(coding, { system: Isco08CodingSystem, code, display })
    assert.equal(findIsco08Occupation(code), coding)
    assert.equal(Object.isFrozen(coding), true)
    assert.deepEqual(Object.keys(coding).sort(), ['code', 'display', 'system'])
  })
}
