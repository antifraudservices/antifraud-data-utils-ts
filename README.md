# Antifraud Data Utilities

Product-neutral TypeScript contracts for identity verification, evidence and
attestations.

The package keeps three concerns separate:

1. Canonical business data uses governed Schema.org flat claims.
2. OpenID Identity Assurance `verified_claims` is an exchange projection.
3. An attestation records that an authorized actor assessed a subject, claim
   or relationship; it never silently rewrites the assessed source data.

## Current API

```ts
import {
  ClearingHouseTenantCapability,
  ClaimProofFormat,
  EudiPidClaim,
  IdentityAttestationCapability,
  IdentityEvidenceType,
  SchemaOrgIdentityClaim,
  defineAuthorizedWorkforceIdentityEvidenceStatement,
  defineClaimProofBinding,
  importOidc4IdaToSchemaOrgFlatClaims,
  projectSchemaOrgFlatClaimsToOidc4Ida,
  selectAuthoritativeTenantEndpoint,
  verifiedClaimsJsonSchema,
  workforceIdentityEvidenceStatementJsonSchema,
} from 'antifraud-data-utils-ts/identity-assurance'
```

`ClaimProofBinding` connects one canonical claim or derived predicate to one or
more credential-level proof references. For example, an `age-over` predicate
can disclose `age_over_18=true` without disclosing the source birth date. An
SD-JWT VC signs disclosure digests at credential level; the package does not
misrepresent that mechanism as an independent signature embedded in every
flat claim.

The initial governed projection covers the registered OpenID identity claims
that have direct Schema.org equivalents. An unknown mapping fails on export.
Import reports unsupported claims and conflicting existing values instead of
discarding or overwriting them.

An authorized workforce member may record identity evidence only when trusted
server context supplies the member assignment, a controller-governed work
group, an active Consent reference and `identity.evidence.record`. The form
collects the evidence observation; it does not select the actor, grant the
permission or sign a credential. Raw identity documents are excluded from the
statement. Attachments are referenced by digest.

The home tenant is the initial trust root. An employer or index-provider tenant
publishes its own authoritative endpoint. A different source tenant is usable
only after the home tenant explicitly trusts it and the source advertises the
required capability. The source tenant reads its stored record before issuing
an attestation; caller-authored claims are never signed as authoritative data.

EUDI Person Identification Data and OpenID Identity Assurance are related but
different contracts. For example, EUDI PID defines `birth_date` and
`age_over_18`, while the OpenID `verified_claims.claims` projection uses the
registered `birthdate` claim. OpenID4VP presents credentials and OpenID4VCI
issues them; OpenID Identity Assurance describes verified claims and evidence.

## Repository boundary

This package contains pure types, vocabulary, JSON Schemas, converters,
validators and synthetic fixtures. It contains no user interface, role policy,
HTTP client, persistence adapter, signing key, credential issuer, ledger
connection or deployment configuration.

See [Identity verification and attestation contract](docs/IDENTITY_VERIFICATION_AND_ATTESTATION.md)
for the normative model and downstream acceptance requirements.

## Standards

- [OpenID Identity Assurance Schema Definition 1.0](https://openid.net/specs/openid-ida-verified-claims-1_0-final.html)
- [OpenID Connect for Identity Assurance 1.0](https://openid.net/specs/openid-connect-4-identity-assurance-1_0-final.html)
- [Schema.org Person](https://schema.org/Person)
- [Schema.org Action](https://schema.org/Action)
- [Schema.org AssessAction](https://schema.org/AssessAction)

## Development

Node.js 24 is required.

```bash
npm ci
npm test
npm run typecheck
npm pack --dry-run
```

## License

Apache-2.0.
