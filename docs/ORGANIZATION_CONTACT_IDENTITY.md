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
Gateway employee creation and SDK enrollment must adopt the contact-aware
contract separately before a complete phone-only organization lifecycle can be
claimed. Existing email records are not rewritten automatically and no new
wire-level contact object is introduced.

## Reviewed organization credential drafts

The separate `organization-credentials` entry point exports
`buildOrganizationTestNetworkCredential` and
`buildTestNetworkOrganizationCredentialSet`, together with their existing
proof-free canonicalization helpers. The first builds the admission draft; the
second builds the Organization, legal representative and Service controller
domain drafts. They neither issue a trusted credential nor verify a signature.

Supply exactly one of `controllerEmail` or `controllerTelephone`. For the domain
set, independently supply exactly one of `legalRepresentativeEmail` or
`legalRepresentativeTelephone`. A representative and controller may use the
same verified phone account, or independently verified channels. Missing or
ambiguous party contacts fail instead of selecting a channel silently.

The admission projection preserves `credentialSubject.controller.email` for
email, and uses Schema.org `telephone` for a phone. Domain Person/owner `sameAs`
values preserve the established stable actor hash. There is no new wire contact
object, invented email, DID representation or proof algorithm.

The domain builder requires caller-governed `legalRepresentativeOccupation`,
`controllerOccupation` and `controllerAuthorityRole`; it does not choose
occupation or authority policy. The trusted domain layer supplies its governed
values and the gateway verifies their legitimacy. Compatibility tests supply
the predecessor's role values and compare the complete email JSON bytes.

`canonicalizeOrganizationTestNetworkCredential` and
`canonicalizeTestNetworkOrganizationCredential` retain the predecessor's exact
recursive proof removal and object-key ordering. This is the existing signing
payload contract, not a signature algorithm or evidence that a supplied proof
is valid. The enclosing host/GW still checks the trusted issuer, signer,
credential type/environment, PDF digest, party contact, controller key and
validity period.

On the reviewed technical-sector Test Network path, the host signs and the GW
verifies these admission/domain credentials before Offer/Order continuation.
That path legitimately need not invoke an external ICA. Real ICA issuance is a
separate verification boundary and must not be claimed from constructing drafts
or completing host-reviewed admission.
