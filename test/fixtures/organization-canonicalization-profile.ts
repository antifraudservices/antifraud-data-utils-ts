// Flow contract: neutral credential transcript inputs preserve readonly type markers without requiring reviewed-builder identity fields.
import type {VerifiableCredentialV2} from 'antifraud-data-utils-ts/credential-contracts';
import {canonicalizeOrganizationTestNetworkCredential,canonicalizeTestNetworkOrganizationCredential,type ReviewedOrganizationCredential} from 'antifraud-data-utils-ts/organization-credentials';
const credential:VerifiableCredentialV2={
 '@context':['https://www.w3.org/ns/credentials/v2'],type:['OrganizationTestNetworkCredential'],
 issuer:'synthetic-issuer',credentialSubject:{nested:{a:1}},validFrom:'2026-11-16T00:00:00Z',
 evidence:[{format:'synthetic-evidence'}],
};
const admission:string=canonicalizeOrganizationTestNetworkCredential(credential);
const domain:string=canonicalizeTestNetworkOrganizationCredential({...credential,type:['OrganizationCredential','TestNetworkCredential']});
declare const reviewed:ReviewedOrganizationCredential;
const retained:string=canonicalizeOrganizationTestNetworkCredential(reviewed);
// @ts-expect-error a credential transcript requires explicit type markers
canonicalizeOrganizationTestNetworkCredential({issuer:'synthetic-issuer'});
// @ts-expect-error marker names are text
canonicalizeTestNetworkOrganizationCredential({type:[1]});
// @ts-expect-error an array of markers is required
canonicalizeOrganizationTestNetworkCredential({type:'OrganizationTestNetworkCredential'});
void [admission,domain,retained];
