# AGENTS.md

## Scope

This repository owns product-neutral data contracts for identity verification,
evidence and attestations. It must not contain product names, professional-role
policies, portal code, transport clients, persistence adapters, secrets,
deployment configuration or blockchain connectivity.

## Development contract

- Use red-green-refactor test-driven development for every behavior change.
- Begin every test file with the required flow-contract comment.
- Use canonical Schema.org and OpenID Identity Assurance vocabulary before
  defining an extension.
- Keep canonical flat claims separate from exchange projections.
- Import operations must report conflicts and must never silently overwrite
  an asserted claim.
- Raw identity documents and personal data never belong in ledger projections.
- Documentation and code are written in English.
