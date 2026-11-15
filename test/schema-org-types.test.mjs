// Flow contract: neutral organization classes retain their exact published Schema.org IRIs, remain immutable, and do not define occupations, sectors, eligibility or authority.
import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const subject=await import('../dist/schema-org-types.js').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return{};throw error});
const expected={Dentist:'https://schema.org/Dentist',Hospital:'https://schema.org/Hospital',MedicalClinic:'https://schema.org/MedicalClinic',VeterinaryCare:'https://schema.org/VeterinaryCare',GovernmentOrganization:'https://schema.org/GovernmentOrganization',NGO:'https://schema.org/NGO',Organization:'https://schema.org/Organization',Corporation:'https://schema.org/Corporation',ResearchOrganization:'https://schema.org/ResearchOrganization'};
test('owned neutral organization types expose the exact nine official IRIs',()=>{
 assert.ok(subject.SchemaOrgOrganizationTypes,'missing owned canonical organization type catalog');
 assert.deepEqual(subject.SchemaOrgOrganizationTypes,expected);
 assert.equal('DentalClinic'in subject.SchemaOrgOrganizationTypes,false);
});
test('the type catalog is frozen and contains no sector or occupation policy',()=>{
 assert.ok(subject.SchemaOrgOrganizationTypes,'missing owned canonical organization type catalog');
 assert.ok(Object.isFrozen(subject.SchemaOrgOrganizationTypes));
 assert.throws(()=>{subject.SchemaOrgOrganizationTypes.Dentist='ISCO-08|2261'},TypeError);
 assert.ok(Object.values(subject.SchemaOrgOrganizationTypes).every(value=>value.startsWith('https://schema.org/')));
});
test('public typed consumers accept only catalog IRIs and preserve literal types',()=>{
 assert.ok(subject.SchemaOrgOrganizationTypes,'missing owned canonical organization type catalog');
 execFileSync(process.execPath,[fileURLToPath(new URL('../node_modules/typescript/bin/tsc',import.meta.url)),'--noEmit','--strict','--skipLibCheck','--module','NodeNext','--moduleResolution','NodeNext','--target','ES2022',fileURLToPath(new URL('./fixtures/schema-org-types-consumer.ts',import.meta.url))],{stdio:'pipe'});
});
