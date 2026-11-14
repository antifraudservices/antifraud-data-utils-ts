# Neutral record and vault contracts

The `vault-repository` subpath exports five type-only contracts:
`RecordBase`, `VaultRecord`, `VaultQueryCondition`, `VaultQuery` and
`IVaultRepository`. They provide one reusable abstract storage boundary for
education, administration and other sector consumers without importing a product
SDK, clinical vocabulary or a storage backend.

`RecordBase` requires `id: string`; `VaultRecord` aliases it. The repository
retains the existing four methods and results: write one or several records,
read an optional typed record, query typed records, and delete a record. Write
and delete results remain `Promise<boolean>`. An identifier does not establish
authority; host composition must enforce the authenticated account, tenant and
collection scope.

## Query profile and compatibility

`VaultQueryCondition` retains `attribute`, optional `equals` and optional `in`.
`VaultQuery` retains optional `where`, `orderBy`, `limit` and `offset`. This is the
existing exact record-field profile. In particular an attribute containing dots
is not automatically interpreted as a nested path, an EAV attribute name or a
protected HMAC index selector. This extraction adds no `extraIndex` capability
or implicit index dialect. Protected-index queries need a separately named and
tested profile/capability that retains vault, tenant and index namespaces.

Original contract source: <https://github.com/soschain/sos-sdk-core-ts>, reviewed
at the [four-method repository port](https://github.com/soschain/sos-sdk-core-ts/blob/53adaa88724560b728f9c6e5e897951c8da9550b/src/vault-repository.ts).
Compatibility consumers can retain their existing public subpaths through
type-only re-exports. Record metadata or a query input alone does not authorize
collection access or select a backend.

## What the abstract port does not implement

There is no memory, SQLite, IndexedDB, Firestore or other persistence adapter in
this module. There is no transaction implementation, driver, transport client,
cross-device synchronization or key-custody implementation. Those behaviors
belong to explicit runtime owners and require their own adapter and journey
proof. Antifraud Data must not import a product runtime to implement this port.

The richer Gateway repository class, with section/history/hydration operations
and a runtime DI token, is a separate contract. It must not be silently replaced
with this four-method type-only interface merely because the public names match.

Public consumer fixtures check typed record reads/queries, required IDs and
method results while rejecting an unsupported EAV condition shape. A scoped
source check rejects reverse product/clinical dependencies and runtime
implementations in the abstract module. These are contract/ownership checks,
not proof of native or browser persistence, encrypted key reopening or backend
query parity.
