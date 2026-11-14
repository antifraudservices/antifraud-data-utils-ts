/** Storage identity only; a record or collection identifier does not establish authority. */
export interface RecordBase { id: string }
export type VaultRecord = RecordBase

/** Existing exact record-field condition, not an implicit protected-index or nested-path selector. */
export interface VaultQueryCondition {
  attribute: string
  equals?: unknown
  in?: unknown[]
}

/** Portable input profile. EAV/HMAC query capabilities require a separate explicit contract. */
export interface VaultQuery {
  where?: VaultQueryCondition[]
  orderBy?: { attribute: string; direction: 'asc' | 'desc' }
  limit?: number
  offset?: number
}

/** Abstract data port only. Hosts own authentication, scope, transactions and backend selection. */
export interface IVaultRepository {
  put<T extends VaultRecord>(collectionName: string, records: T | T[]): Promise<boolean>
  get<T extends VaultRecord>(collectionName: string, id: string): Promise<T | undefined>
  query<T extends VaultRecord>(collectionName: string, query: VaultQuery): Promise<T[]>
  delete(collectionName: string, id: string): Promise<boolean>
}
