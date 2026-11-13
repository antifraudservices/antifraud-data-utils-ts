// Flow contract: one cross-sector ISCO-08 catalog describes occupations independently of FHIR, sector policies, evidence verification and authorization; unknown codes never acquire an invented meaning.
import assert from 'node:assert/strict'
import test from 'node:test'
import * as catalog from '../dist/index.js'

test('owns the canonical dentistry occupation without a GDC dependency',()=>{
 assert.deepEqual(catalog.Isco08Occupations?.Dentist,{system:'http://www.ilo.org/public/english/bureau/stat/isco/isco08/',code:'2261',display:'Dentists'})
 assert.notEqual(catalog.Isco08Occupations?.Dentist?.code,catalog.Isco08Occupations?.MedicalDoctors?.code)
})

test('resolves only defined occupation codes without controller aliases',()=>{
 assert.equal(typeof catalog.findIsco08Occupation,'function')
 assert.equal(catalog.findIsco08Occupation('2261'),catalog.Isco08Occupations.Dentist)
 for(const code of ['RESPRSN','2261-extra','',undefined])assert.equal(catalog.findIsco08Occupation(code),undefined)
})

test('keeps the standard catalog immutable and free of permission decisions',()=>{
 assert.equal(Object.isFrozen(catalog.Isco08Occupations),true)
 for(const coding of Object.values(catalog.Isco08Occupations)){
  assert.equal(Object.isFrozen(coding),true)
  assert.deepEqual(Object.keys(coding).sort(),['code','display','system'])
 }
})

test('serves education, legal and administrative consumers from the same catalog',()=>{
 assert.equal(catalog.Isco08Occupations?.SecondaryEducationTeacher?.code,'2330')
 assert.equal(catalog.Isco08Occupations?.Lawyer?.code,'2611')
 assert.equal(catalog.Isco08Occupations?.GeneralOfficeClerk?.code,'4110')
})
