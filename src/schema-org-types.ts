/**
 * Canonical Schema.org Organization class IRIs, reviewed against each official
 * class page (https://schema.org/<Class>). ResearchOrganization is published
 * in Schema.org's new area. This bounded catalog is not the complete ontology.
 * Classes are not occupations, sectors, service capabilities or admission.
 */
export const SchemaOrgOrganizationTypes=Object.freeze({
  Dentist:'https://schema.org/Dentist',
  Hospital:'https://schema.org/Hospital',
  MedicalClinic:'https://schema.org/MedicalClinic',
  VeterinaryCare:'https://schema.org/VeterinaryCare',
  GovernmentOrganization:'https://schema.org/GovernmentOrganization',
  NGO:'https://schema.org/NGO',
  Organization:'https://schema.org/Organization',
  Corporation:'https://schema.org/Corporation',
  ResearchOrganization:'https://schema.org/ResearchOrganization',
} as const)
export type SchemaOrgOrganizationType=typeof SchemaOrgOrganizationTypes[keyof typeof SchemaOrgOrganizationTypes]
