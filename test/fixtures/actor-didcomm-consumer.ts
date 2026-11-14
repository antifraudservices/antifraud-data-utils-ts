// Flow contract: protocol envelopes preserve business body types separately from neutral headers, and syntactic actor classification neither narrows false string branches away nor proves actor ownership.
import type { DidCommPayload, DidCommAttachment } from 'antifraud-data-utils-ts/didcomm-contracts'
import { isStableActorIdentifier, buildDidCommInlineBinaryAttachment } from 'antifraud-data-utils-ts'
interface EducationBody { data: { type: 'Assessment'; resource: { id: string } }[] }
const body: EducationBody = { data: [{ type: 'Assessment', resource: { id: 'assessment-example' } }] }
const inline = buildDidCommInlineBinaryAttachment({ id: 'attachment-example', mediaType: 'application/octet-stream', bytes: new Uint8Array([1]) })
const attachment: DidCommAttachment = inline
const envelope: DidCommPayload<EducationBody> = { id: 'message-example', type: 'urn:example:assessment', from: 'did:example:sender', to: ['did:example:recipient'], body, attachments: [attachment] }
const knownString: string = 'not-an-actor'
if (!isStableActorIdentifier(knownString)) knownString.toUpperCase()
// @ts-expect-error the supported plaintext profile requires a protocol type separately from its business body
const missingType: DidCommPayload<EducationBody> = { id: envelope.id, body }
// @ts-expect-error a typed body must retain its required business fields
const wrongBody: DidCommPayload<EducationBody> = { ...envelope, body: {} }
// @ts-expect-error arrays are not the supported plaintext object body
const arrayBody: DidCommPayload<string[]> = { id: envelope.id, type: envelope.type, body: [] }
// @ts-expect-error primitive business bodies are not the supported object profile
const scalarBody: DidCommPayload<string> = { id: envelope.id, type: envelope.type, body: 'text' }
// @ts-expect-error the attachment compatibility profile retains required media_type
const missingMedia: DidCommAttachment = { id: attachment.id, data: { base64: 'AQ' } }
void [missingType, wrongBody, arrayBody, scalarBody, missingMedia]
