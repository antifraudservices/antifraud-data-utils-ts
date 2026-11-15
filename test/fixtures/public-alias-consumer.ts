// Flow contract: actual alias readers produce data strings/lists through their public subpath without an authorization decision or opaque unsafe return type.
import {normalizePublicAliasList,normalizeControllerAlias,normalizeTelephoneAlias} from 'antifraud-data-utils-ts/public-aliases'
const [subjectAlias]=normalizePublicAliasList(['urn:example:subject','urn:example:subject'])
const actorAlias:string=normalizeControllerAlias('urn:example:actor')
const telephoneAlias:string=normalizeTelephoneAlias(undefined)
const aliases:readonly string[]=normalizePublicAliasList('urn:example:subject,urn:example:other')
const selected=aliases.includes(subjectAlias)
// @ts-expect-error A list reader does not return numeric identifiers.
const wrongList:number[]=normalizePublicAliasList(undefined)
// @ts-expect-error Normalized identity data is not an authorization decision.
const authority:{authorized:true}=normalizeControllerAlias('urn:example:actor')
void [actorAlias,telephoneAlias,selected,wrongList,authority]
