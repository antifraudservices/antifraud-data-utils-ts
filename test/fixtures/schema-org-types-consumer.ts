// Flow contract: canonical organization class IRIs are separate from occupational codes or invented class spellings.
import {SchemaOrgOrganizationTypes,type SchemaOrgOrganizationType} from '../../dist/schema-org-types.js';
const dentist:'https://schema.org/Dentist'=SchemaOrgOrganizationTypes.Dentist;
const type:SchemaOrgOrganizationType=SchemaOrgOrganizationTypes.ResearchOrganization;
// @ts-expect-error An occupation code is not an organization class.
const occupation:SchemaOrgOrganizationType='ISCO-08|2261';
// @ts-expect-error There is no cataloged DentalClinic class.
const invented:SchemaOrgOrganizationType='https://schema.org/DentalClinic';
void dentist;void type;void occupation;void invented;
