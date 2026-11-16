// Flow contract: identifier-input tags are literal typed inputs, not lowercase contact kinds or arbitrary identifiers.
import {IdentifierInputKinds,type IdentifierInputKind} from 'antifraud-data-utils-ts/identifier-input-kinds'
import {IdentifierInputKinds as RootKinds,type IdentifierInputKind as RootKind} from 'antifraud-data-utils-ts'
const uuid:'UUID'=IdentifierInputKinds.Uuid
const email:IdentifierInputKind=RootKinds.Email
const phone:RootKind=IdentifierInputKinds.Phone
// @ts-expect-error A contact kind is not an identifier-input tag.
const contactKind:IdentifierInputKind='email'
// @ts-expect-error The bounded catalog does not claim clinical identifier types.
const clinicalKind:IdentifierInputKind='MR'
void[uuid,email,phone,contactKind,clinicalKind]
