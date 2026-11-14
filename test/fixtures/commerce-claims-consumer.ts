// Flow contract: shared commercial data uses neutral claim keys while payment validation and entitlement decisions remain caller-owned.
import {
  SchemaOrgOfferClaim, SchemaOrgOrderClaim, SchemaOrgIndividualProductClaim,
  type SchemaOrgOfferClaimKey, type SchemaOrgOrderClaimKey, type SchemaOrgIndividualProductClaimKey,
} from 'antifraud-data-utils-ts/schema-org-claims'
const offer: Partial<Record<SchemaOrgOfferClaimKey, string>> = {
  [SchemaOrgOfferClaim.Identifier]: 'offer-example',
  [SchemaOrgOfferClaim.ItemOfferedName]: 'Example assessment',
  [SchemaOrgOfferClaim.EligibleQuantityValue]: '1',
}
const order: Partial<Record<SchemaOrgOrderClaimKey, string>> = {
  [SchemaOrgOrderClaim.AcceptedOfferIdentifier]: offer[SchemaOrgOfferClaim.Identifier],
  [SchemaOrgOrderClaim.OrderedItemServiceType]: 'assessment',
}
const product: Partial<Record<SchemaOrgIndividualProductClaimKey, string>> = {
  [SchemaOrgIndividualProductClaim.SerialNumber]: 'serial-example',
}
// @ts-expect-error an order confirmation is not an offer field
const wrongOfferKey: SchemaOrgOfferClaimKey = SchemaOrgOrderClaim.ConfirmationNumber
// @ts-expect-error an arbitrary entitlement is not a canonical product claim identity
const wrongProductKey: SchemaOrgIndividualProductClaimKey = 'license-approved'
void [order, product, wrongOfferKey, wrongProductKey]
