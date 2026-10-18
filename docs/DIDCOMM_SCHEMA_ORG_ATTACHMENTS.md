# Schema.org documents delivered with DIDComm attachments

## Use-case boundary

Antifraud is Schema.org-native. A governed document is a `DigitalDocument` and
its concrete file encoding is a `MediaObject`. It is not a FHIR resource and it
must never be serialized, stored, searched or displayed as `DocumentReference`.

DIDComm is the authenticated and encrypted transport. Its `attachments[]`
array can carry PDF, spreadsheet, word-processing, image, video or any other
media type allowed by policy. Transport does not change the Schema.org type of
the business record.

## Two transport forms

For a bounded file, `buildDidCommInlineBinaryAttachment` emits:

```json
{
  "id": "urn:attachment:example",
  "media_type": "application/pdf",
  "byte_count": 123,
  "data": { "base64": "...base64url..." }
}
```

For a confidential file already described by a governed `MediaObject`,
`buildDidCommLinkedBinaryAttachment` emits an authorized URL and a multibase
multihash:

```json
{
  "id": "urn:attachment:example",
  "media_type": "application/pdf",
  "byte_count": 123,
  "data": {
    "links": ["https://protected.example/objects/example"],
    "hash": "z..."
  }
}
```

The linked attachment hash is the multihash carried inside the canonical
CIDv1; it is not the complete CID. The `MediaObject.identifier.value` retains
the complete CIDv1 value.

## Minimal PDF proof

`test/didcomm-binary-attachment.test.mjs` constructs a minimal synthetic PDF,
places its exact bytes in a DIDComm inline attachment, decodes the base64url
payload and verifies the original bytes, `%PDF-1.4` header and `%%EOF` marker.
The same suite proves protected-reference delivery from the canonical
`SyntheticConfidentialDocumentFixture` and rejects empty or incomplete input.

## Ownership and tasks

- Canonical contract and fixture proof:
  [antifraud-data-utils-ts issue #2](https://github.com/antifraudservices/antifraud-data-utils-ts/issues/2).
- Runtime-neutral orchestration:
  [antifraud-sdk-core-ts issue #5](https://github.com/antifraudservices/antifraud-sdk-core-ts/issues/5).
- Trusted Node transport:
  [antifraud-sdk-node-ts issue #5](https://github.com/antifraudservices/antifraud-sdk-node-ts/issues/5).
- Confidential persistence and retrieval:
  [antifraud-gw-node-ts issue #1](https://github.com/antifraudservices/antifraud-gw-node-ts/issues/1).
- Reusable controlled attachment panel:
  [antifraud-portal-components-react issue #5](https://github.com/antifraudservices/antifraud-portal-components-react/issues/5).
- Professional portal:
  [antifraud-professional-nextjs issue #1](https://github.com/antifraudservices/antifraud-professional-nextjs/issues/1).
- Personal portal:
  [antifraud-personal-next issue #1](https://github.com/antifraudservices/antifraud-personal-next/issues/1).

The C2PA and ML-DSA interoperability proof is tracked separately in
[antifraud-data-utils-ts issue #3](https://github.com/antifraudservices/antifraud-data-utils-ts/issues/3).
