# Organization contact identity

The `antifraud-data-utils-ts/organization-identity` entry point owns neutral,
deterministic contact identity construction. It contains no portal, transport,
identity-provider session, storage or role-authorization policy.

```ts
import {
  StableActorContactKinds,
  buildStableActorIdentifier,
  buildOrganizationEmployeeDidWeb,
} from 'antifraud-data-utils-ts/organization-identity'

const contact = {
  contactKind: StableActorContactKinds.Phone,
  contact: '+16505550111',
} as const

const actorIdentifier = buildStableActorIdentifier(contact)
const employeeDid = buildOrganizationEmployeeDidWeb({
  ...contact,
  organizationDidWeb: 'did:web:example.invalid:organization',
  role: 'ISCO-08|2359',
})
```

The caller selects the contact channel explicitly. A phone value is rejected
in the email channel, an email is rejected in the phone channel, and an unknown
channel fails. `normalizeActorContact` strips `mailto:` and normalizes email
case/whitespace, or strips `tel:` and phone formatting before requiring E.164.
It never invents an email for a phone account. A leading country calling code
is required; national-format numbers need an earlier governed normalization
step with known country context.

## Established representations and compatibility

The actor identifier retains the existing representation:

`urn:multibase:<base58btc(multihash(SHA3-256, normalized-contact))>`

The multihash algorithm byte is `0x16` and digest-length byte is `0x20`. The
employee DID retains the existing organization `did:web` root followed by
`:employee:<bare-multibase-actor>:<role>` and an optional device suffix. The role
is separate from the stable actor; two roles for one phone do not require two
phone accounts. Neither clear contact is embedded in the generated identifier.

The algorithm and representation are ported from the published predecessor
`gdc-common-utils-ts@2.9.30` actor identifier and employee DID helpers. Tests use
that existing **development dependency only** as a compatibility oracle for
email case, plus-addresses, URI/format normalization, phone hashes, employee
DIDs and device suffixes. Email DID compatibility is defined on normalized
email values; malformed historical inputs are not accepted as new contacts.
There is no runtime dependency on the frozen package. Existing evidence CID
and DIDComm attachment code share the same internal base58btc encoder.

## Trust boundary and migration scope

A contact string is input data, not proof of possession. The owning BFF must
verify the identity-provider token and bind the selected contact to the exact
account and protected profile. Organization admission, official contact
evidence, controller authority, employee role, licence capacity, device grants
and subject access retain their independent verification requirements.

The deterministic contact hash is a continuity identifier; it is not an access
token, encryption or protection against guessing a known email/phone number.
Do not substitute a generic organization telephone for an employee's verified
contact.

This entry point does not migrate an existing account, grant or credential.
Reviewed organization credential builders, gateway employee creation and SDK
enrollment must adopt the contact-aware contract separately before a complete
phone-only organization lifecycle can be claimed. Existing email records are
not rewritten automatically and no new wire-level contact object is introduced.
