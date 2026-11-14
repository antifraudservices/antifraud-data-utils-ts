// Flow contract: record identity, portable query input and repository method types are reusable by education and other sectors without selecting a backend, interpreting protected indexes or granting collection access.
import type { RecordBase, VaultRecord, VaultQueryCondition, VaultQuery, IVaultRepository } from 'antifraud-data-utils-ts/vault-repository'
interface EducationRecord extends RecordBase { qualification: string; sector: string }
interface AdministrativeRecord extends VaultRecord { description: string }
declare const vault: IVaultRepository
const record: EducationRecord = { id: 'record-example', qualification: 'Example qualification', sector: 'education' }
const condition: VaultQueryCondition = { attribute: 'sector', in: ['education'] }
const query: VaultQuery = { where: [condition], orderBy: { attribute: 'id', direction: 'asc' }, limit: 1, offset: 0 }
const write: Promise<boolean> = vault.put('records', record)
const batch: Promise<boolean> = vault.put('records', [record])
const read: Promise<EducationRecord | undefined> = vault.get<EducationRecord>('records', record.id)
const results: Promise<EducationRecord[]> = vault.query<EducationRecord>('records', query)
const remove: Promise<boolean> = vault.delete('records', record.id)
const otherRead: Promise<AdministrativeRecord | undefined> = vault.get<AdministrativeRecord>('other-records', 'other-record-example')
// @ts-expect-error stored records retain the required identity field
vault.put('records', { qualification: 'missing identity' })
// @ts-expect-error retrieval types must retain the required record identity
vault.get<{ qualification: string }>('records', record.id)
// @ts-expect-error the existing order profile accepts asc/desc rather than arbitrary directions
const wrongOrder: VaultQuery = { orderBy: { attribute: 'id', direction: 'ascending' } }
// @ts-expect-error an EAV selector is not silently accepted as the exact-field query profile
const wrongDialect: VaultQueryCondition = { indexName: 'protected-index', equals: 'value' }
void [write, batch, read, results, remove, otherRead, wrongOrder, wrongDialect]
