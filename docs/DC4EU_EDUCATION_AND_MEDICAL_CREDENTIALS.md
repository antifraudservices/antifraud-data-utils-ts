# DC4EU Education and Medical Credential Reference

Status reviewed: 17 October 2026.

The [DC4EU educational pilot](https://github.com/dc4eu/educational-pilot)
publishes the European Educational and Professional Qualifications framework.
It includes the sector rulebook, the Electronic Attestation of Attributes
catalogue, European Learning Model 3.2 based data models, W3C Verifiable
Credential serializations, examples and trust-governance material for the
European Digital Identity Wallet ecosystem.

This repository is a source for future interoperability adapters. It is not
copied into the Antifraud canonical model and its draft schemas are not treated
as stable production contracts.

## Relevant DC4EU credentials

The university qualification and the current authority to practise are not the
same assertion.

The European Higher Education Diploma (`EUHED`) represents a higher-education
diploma awarded by an educational institution. Its current catalogue entry and
schema are linked from the [DC4EU sectorial EAA catalogue](https://github.com/dc4eu/educational-pilot/tree/main/sectorial-eaa-catalogue#table-with-available-datamodels-based-on-edc-w3c-w3c-vcdm-11-aligned-to-1st-batch-of-implementing-acts).
This is the likely source of the university-issued medical-degree fields.

The [Doctor ID schema](https://github.com/dc4eu/educational-pilot/blob/main/sectorial-eaa-catalogue/non-foundational-id/doctor-id-schema.md)
is a separate non-foundational professional identity credential. Its draft
credential subject includes the physician identifier, given and family names,
medical board, professional administrative number, legal entitlement to
practise and medical specialities. The issuer includes its identifier,
multilingual legal name and issuing country. Issuance, expiry and cryptographic
proof data are credential-level properties.

The [Certificate of Professional Suitability](https://github.com/dc4eu/educational-pilot/blob/main/sectorial-eaa-catalogue/professional-qualifications/CertificateProfessionalSuitability.md)
is another distinct credential. It represents current professional competence
and entitlement to practise. Its draft subject carries `legally_entitled` and
one or more medical registrations, including medical board, professional
administrative number, membership start date and optional membership end date.

The catalogue also identifies Professional Medical Certification, Continuing
Professional Development, Professional Training Certificate and
[Accreditation Medical Training](https://github.com/dc4eu/educational-pilot/blob/main/sectorial-eaa-catalogue/professional-qualifications/AccreditationMedicalTraining.md).
Medical training accreditation concerns a programme or activity and its
accreditation. It must not be presented as the holder's medical licence.

## Trust and disclosure boundary

DC4EU characterises Doctor ID as issuable by an authorised professional body
or regulated authority, not by an arbitrary employer. The proposal requires a
Person Identification Data credential, proof of possession, cryptographic
holder binding, restricted disclosure and verifier-role checks. Its validity
is linked to the professional affiliation or membership period.

This supports the Antifraud separation between:

- a university-issued educational qualification;
- a professional-body identity or registration;
- current legal entitlement or licence status;
- an employer attestation about evidence it reviewed;
- active employment and application authorization.

No proof may silently substitute for another authority. An employer can attest
that it reviewed a diploma, but it cannot issue the university's diploma or the
professional body's registration.

## Current maturity warning

The medical schemas are explicitly marked as drafts. The checked Doctor ID
schema and its example are not fully consistent: the schema and example use
different name casing for some subject fields; the medical-board cardinality
differs; the administrative-number example does not satisfy the schema's
numeric pattern; and `expirationDate` is required without being declared in
the schema properties. Some characterisation documents still contain
`TO_BE_DEFINED` values and example trust identifiers.

Consequently, implementers must pin an exact upstream revision and validate an
actual issuer and verifier profile before enabling interoperability. These
draft field names must not be copied directly into a stable public API.

## Antifraud integration rule

Antifraud keeps product-neutral Schema.org
`EducationalOccupationalCredential` flat claims and independent proof
bindings as its canonical application contract. A future DC4EU adapter may
import or export a pinned EUHED, Doctor ID or professional-qualification
profile. OpenID for Verifiable Credential Issuance and OpenID for Verifiable
Presentations handle issuance and presentation; OpenID Connect for Identity
Assurance remains a separate verified-identity projection.

Health-specific FHIR projections remain outside this package. A SOS data
utility may convert the neutral qualification and verification evidence to the
required FHIR version without making FHIR the Antifraud storage model.

