/** Neutral synthetic public fixtures. No seed, private key, resolver or authority is provided. */
import {DidCoreContext,type DidDocument,type DidService,type VerificationMethod} from './did-document.js'
import {JoseEcdhAlgorithms,JoseKeyOperations,JoseAgreementCurves,type PublicJwk,type ClassicPublicJwk,type MlkemPublicJwk,type PublicAgreementMetadata,type PublicAgreementJwk,type X25519PublicJwk,type EcAgreementPublicJwk} from './cryptography/types.js'

/** Fixed public-only samples: EC point generated for this fixture; ML-KEM sample reuses the canonical AF predecessor vector. */
const agreementEc=Object.assign({"kty":"EC","x":"sbYF2RiMtVl1Wm-WVIH6itOUcr-dMu6jcCnJhPr-UwQ-eSIjONPixRZWPyV8Sgp4","y":"acEQPCKQeL-GagDzZg8wSVYfW4pHHRBvaDOPDgaeJGqKkGMvnH07Am8N0pdnm1-F","crv":"P-384","kid":"legacy-agreement","alg":"ES384","use":"enc"} satisfies ClassicPublicJwk,{crv:JoseAgreementCurves.P384,use:'enc',key_ops:[JoseKeyOperations.DeriveKey]} satisfies PublicAgreementMetadata & {crv:typeof JoseAgreementCurves.P384})
const agreementMlkem=Object.assign({"kty":"OKP","crv":"ML-KEM-768","x":"RHFz0AHLHOdlCdM9S1squpxdxPxB3ACWMUixLgqVjps5hCJG9WXNcsi3V0Nv1OkEreKExxyIWulKQ_g4hfIY6Kd22RhLg0omuSO0vqUfPmwfNygBCILAAGVgnTijPzOZrjtR4BcWIslBeQCntOVNDUguD0STA5h0CXA8xdiJ0CgUlwYwqMAZAjs25-RIjDrNTgYYA8cx7wAFBdomX8IL8BNf2EurymUenjh3RQO25WFhvHWdfQpn7qU6PhO4_NMwSSxTnAEAhOZB0kQqCtwIvgKKfqDPSmWTM6oOgvYT7sDBbtXFuFg6MUBNy-km5vxLCeGEHWdgNCBbgnKuaQQU0-ykxTZoOhNMo4SGtYqK69kUr5EQKluFvDksFBc6qNMKCFYHIVAB-MPPzAUFBLF2ouM5NagGyUiahffOKrCJVUc9mzls7dN1fqkKiUFSn5JSM-u5PdA4JOdLG6OsB0aMaZQaRfojpQQbrfOckPg9o5Ab-ny3hEjCH4dYEirFSWDM_osGsxhlQutXvAstW-ozcXG6uVlFo8tBkde_SqCCq3WchEfEPnZ27IOYKsNictKry0UptYo5S1sxSyEOKcmd2MW3qBe0V_OgsZWuJPlkjhJFZkGGoai4NlFuhlIeiXFSE9J3h7ehdBFse2BCDDNOElMmtUAdR6aEewPB2naxCUFocDmFT1MY8ao3aaWPfmlXB3OrVfaixHsmM-NFiKmGSWsW66Za4USEDqi3RTww6tSeJhw2YPx1VQub1XR99yYGkFsWyKMLXyAOt3Q29cRbwAILouhG2AIfNvoSWZR2E-KjvjuJHqeUZRyUVjmCnKifzAqkuPudKUgv6BEkD_KfMpwgY-OrKGZ8IuA2pVMJz9xfJERXbBVVt-Ncx1AdGBWA4tRfO3q8X7Bw6jJTygVHapWlHmaDieE-LBE75VdoN6sBJtx18tTPsJKIfsFPWcZxo0BeDQYca3MPZUuOgTMQB-Fs5-sAAVaZaTEqiFaAj_JLyrolltUtM0rGtytBnRwc6st7kiJ59EZnGmMtSGKU61sHQYp90YisLjXI0LK3ssJTtOk8IHBYU9U9Z4Z_EwxpCop8L-o2xfXFCkAHMiCm9TfLMZjNXNoGnfok45p4b8iXITI1PlA22iSUBQlBucBWIPJp3CeQ5QGNDdudT_VwqyWNj8pWuyC7exmLqwigVkASUAVaxWOPl4nM2aLNyulUC2wFWNkFJzPMSjsCNkQumhmEsbV5UlY3bwiUVRdD7nQ_kESEt4C4lES8evJLhUuUtgN9HaefacokS_pqDgJB9tqQsnVsP1WmiWgDN2Qp2lwP3jkyazStk7orG1Wz7IRSh4tGqcS3TkpaN5jFRfyRqgk1PGPEeQqLiteUiIGBYIsxcNYdqNdisEXAh2twvtA9eJIJwVSLYsKOGWgKWTSJ1aV18dJWmPAWhUNNY7fF4iBCYbWKwKmANXwPDDu_sZCpKkszOjgxKTp0j6h0JHPHO6JxPek-kuOMYLuZQSCj3zqNQhSc20QRQfS1qbXOjDAZoy5mF732489XwhXxamcdVnb20F_ieRV22x6jPVbZYyw","kid":"m4106BYzgkaLZyjlMe9eCxrIQe3qTufxstgKtiTN2bk"} satisfies MlkemPublicJwk,{use:'enc',key_ops:[JoseKeyOperations.DeriveBits]} satisfies PublicAgreementMetadata)
/** Public recipient key from RFC 8037 Appendix A.6; no example private scalar is copied. */
const agreementX25519={kty:'OKP',crv:JoseAgreementCurves.X25519,x:'3p7bfXt9wbTTW2HC7OQ1Nz-DQ8hbeGdNrfx-FG-IK08',kid:'Bob',use:'enc',alg:JoseEcdhAlgorithms.Direct,key_ops:[JoseKeyOperations.DeriveBits]} satisfies X25519PublicJwk
const agreementEcEcdh={kty:'EC',crv:JoseAgreementCurves.P384,x:agreementEc.x,y:agreementEc.y,kid:agreementEc.kid,use:'enc',alg:JoseEcdhAlgorithms.Direct,key_ops:[JoseKeyOperations.DeriveKey]} satisfies EcAgreementPublicJwk
export const DID_DOCUMENT_TEST_PUBLIC_KEYS=Object.freeze({
 x25519:Object.freeze(agreementX25519),ecEcdh:Object.freeze(agreementEcEcdh),
 ec:Object.freeze(agreementEc),mlkem:Object.freeze(agreementMlkem),
 wrappedMlkem:Object.freeze(Object.assign(structuredClone(agreementMlkem),{alg:'ML-KEM-768+HKDF-SHA256+A256GCMKW',publicMetadata:'synthetic public extension'})),
 signature:Object.freeze({...structuredClone(agreementEc),kid:'signature-only',use:'sig',key_ops:[JoseKeyOperations.Verify]}),
})
/** Reserved identities and deliberate transport attack inputs, never operational endpoints. */
export const DID_DOCUMENT_TEST_PROBES=Object.freeze({
 reservedDid:'did:web:example.invalid:example-tenant',reservedOrigin:'https://example.invalid',
 foreignDocumentUrl:'https://foreign.example.invalid/did.json',
 loopbackDocumentUrl:'http://127.0.0.1/did.json',
 userinfoDocumentUrl:'http://127.0.0.1@foreign.example.invalid/did.json',
 queryDocumentUrl:'http://127.0.0.1/did.json?token=synthetic-probe',
 fragmentDocumentUrl:'http://127.0.0.1/did.json#key',
 encodedSeparatorDocumentUrl:'http://127.0.0.1/a%2F..%2Fb/did.json',
 nonLoopbackIpDid:'did:web:192.0.2.1:example-tenant',
 unsafePublicationProfile:'../arbitrary',
})
export type DidDocumentTestFixtureInput=Readonly<{did:string;keys?:readonly PublicJwk[]}>
/** The caller supplies its reserved identity; this factory performs no ownership validation. */
export function createDidDocumentTestFixture(input:DidDocumentTestFixtureInput):DidDocument
export function createDidDocumentTestFixture(input:Readonly<{did:string;keys:readonly PublicAgreementJwk[]}>):DidDocument<DidService,string|string[],PublicAgreementJwk>
export function createDidDocumentTestFixture(input:Readonly<{did:string;keys?:readonly (PublicJwk|PublicAgreementJwk)[]}>):DidDocument<DidService,string|string[],PublicJwk|PublicAgreementJwk>{
 const verificationMethod:VerificationMethod<PublicJwk|PublicAgreementJwk>[]=(input.keys??[DID_DOCUMENT_TEST_PUBLIC_KEYS.ec]).map((key,index)=>({
  id:input.did+'#'+(key.kid||'test-key-'+index),type:'JsonWebKey2020',controller:input.did,publicKeyJwk:structuredClone(key),
 }))
 return {'@context':DidCoreContext,id:input.did,verificationMethod,keyAgreement:verificationMethod.map(method=>method.id)}
}
export type InvalidDidDocumentTestFixture=Readonly<{name:string;document:unknown}>
/** Invalid JSON intentionally has no trusted DID/JWK type; consumers must apply their own validator. */
export function createInvalidDidDocumentTestFixtures(input:Readonly<{did:string}>):readonly InvalidDidDocumentTestFixture[]{
 const positive=createDidDocumentTestFixture(input),method=positive.verificationMethod![0]!,foreign=input.did+':foreign'
 const changed=(name:string,patch:Record<string,unknown>):InvalidDidDocumentTestFixture=>({name,document:{...structuredClone(positive),...patch}})
 const withKey=(name:string,patch:Record<string,unknown>):InvalidDidDocumentTestFixture=>changed(name,{verificationMethod:[{...structuredClone(method),publicKeyJwk:{...structuredClone(method.publicKeyJwk),...patch}}]})
 return [
  changed('foreign-document',{id:foreign}),
  changed('foreign-controller',{verificationMethod:[{...structuredClone(method),controller:foreign}]}),
  changed('foreign-relationship',{keyAgreement:[foreign+'#key']}),
  changed('dangling-relationship',{keyAgreement:['#missing']}),
  changed('missing-relationship',{keyAgreement:undefined}),
  changed('duplicate-definition',{verificationMethod:[structuredClone(method),structuredClone(method)]}),
  changed('duplicate-relationship',{keyAgreement:[method.id,method.id]}),
  changed('conflicting-definition',{keyAgreement:[{...structuredClone(method),publicKeyJwk:{...structuredClone(method.publicKeyJwk),x:'conflicting-public-value'}}]}),
  withKey('non-string-kid',{kid:7}),withKey('symmetric-key',{kty:'oct'}),
  withKey('invalid-ec-coordinate',{x:'invalid'}),withKey('signing-only-use',{use:'sig'}),
  withKey(DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS.UnsupportedSigningMaterial,{kty:'AKP',alg:'ML-DSA-44',pub:'signing'}),
  withKey(DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS.SigningKeyOperations,{key_ops:['sign']}),
  withKey(DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS.UnsupportedX25519,{crv:'X25519'}),
  withKey(DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS.UnsupportedRsa,{kty:'RSA',n:'unsupported',e:'AQAB'}),
  withKey(DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS.UnsupportedEcAlgorithm,{alg:'unsupported'}),
  ...['d','k','p','q','dp','dq','qi','oth','dBytes','privBytes','priv','privateKey','privateKeyBytes','secretKey','secretKeyBytes'].map(field=>withKey('private-field-'+field,{[field]:'synthetic-negative-value'})),
 ]
}

/** Stable names let consumers select individual negative shapes without redefining them. */
export const DID_DOCUMENT_TEST_NEGATIVE_CASE_IDS=Object.freeze({
 ForeignDocument:'foreign-document',ForeignController:'foreign-controller',ForeignRelationship:'foreign-relationship',
 DanglingRelationship:'dangling-relationship',MissingRelationship:'missing-relationship',DuplicateDefinition:'duplicate-definition',
 DuplicateRelationship:'duplicate-relationship',ConflictingDefinition:'conflicting-definition',NonStringKid:'non-string-kid',
 SymmetricKey:'symmetric-key',InvalidEcCoordinate:'invalid-ec-coordinate',SigningOnlyUse:'signing-only-use',
 UnsupportedSigningMaterial:'unsupported-signing-material',SigningKeyOperations:'signing-key-operations',
 UnsupportedX25519:'unsupported-x25519',UnsupportedRsa:'unsupported-rsa',UnsupportedEcAlgorithm:'unsupported-ec-algorithm',
})
export type DidDocumentMetadataTestFixture=Readonly<{document:DidDocument;expected:PublicJwk}>
/** Positive metadata and relationship controls with independent documents and expected public keys. */
export function createDidDocumentMetadataTestFixtures(input:Readonly<{did:string}>):Readonly<Record<'opaqueKid'|'absentKid'|'embedded'|'skipSigning'|'wrapped',DidDocumentMetadataTestFixture>>{
 const opaque=createDidDocumentTestFixture(input),opaqueMethod=opaque.verificationMethod![0]!
 opaqueMethod.id=input.did+'#transport-reference';opaque.keyAgreement=[opaqueMethod.id]
 const absent=createDidDocumentTestFixture(input);delete absent.verificationMethod![0]!.publicKeyJwk.kid
 const embedded=createDidDocumentTestFixture(input);embedded.keyAgreement=[embedded.verificationMethod![0]!];delete embedded.verificationMethod
 return {
  opaqueKid:{document:opaque,expected:structuredClone(DID_DOCUMENT_TEST_PUBLIC_KEYS.ec)},
  absentKid:{document:absent,expected:structuredClone(DID_DOCUMENT_TEST_PUBLIC_KEYS.ec)},
  embedded:{document:embedded,expected:structuredClone(DID_DOCUMENT_TEST_PUBLIC_KEYS.ec)},
  skipSigning:{document:createDidDocumentTestFixture({did:input.did,keys:[DID_DOCUMENT_TEST_PUBLIC_KEYS.signature,DID_DOCUMENT_TEST_PUBLIC_KEYS.mlkem]}),expected:structuredClone(DID_DOCUMENT_TEST_PUBLIC_KEYS.mlkem)},
  wrapped:{document:createDidDocumentTestFixture({did:input.did,keys:[DID_DOCUMENT_TEST_PUBLIC_KEYS.wrappedMlkem]}),expected:structuredClone(DID_DOCUMENT_TEST_PUBLIC_KEYS.wrappedMlkem)},
 }
}
export type DidDocumentCanonicalUrlTestVector=Readonly<{did:string;documentUrl:string}>
/** Independent reserved wire examples for root, path-case/escaping and encoded authority-port resolution. */
export const DID_DOCUMENT_TEST_CANONICAL_URL_VECTORS:readonly DidDocumentCanonicalUrlTestVector[]=Object.freeze([
 {did:'did:web:example.invalid',documentUrl:'https://example.invalid/.well-known/did.json'},
 {did:'did:web:example.invalid:ClinicCase:user%20one',documentUrl:'https://example.invalid/ClinicCase/user%20one/did.json'},
 {did:'did:web:example.invalid%3A8443:ClinicCase',documentUrl:'https://example.invalid:8443/ClinicCase/did.json'},
])
export type DidDocumentTransportTestOptions=Readonly<{didDocumentUrl?:string;allowTestLoopbackDocument?:true;requestTimeoutMs?:number}>
export type InvalidDidDocumentTransportTestFixture=Readonly<{name:string;did:string;options:DidDocumentTransportTestOptions}>
/** Untrusted URL/timeout input shapes; no transport or resolver implementation is provided. */
export function createInvalidDidDocumentTransportTestFixtures(input:Readonly<{did:string}>):readonly InvalidDidDocumentTransportTestFixture[]{
 const p=DID_DOCUMENT_TEST_PROBES,override=(name:string,didDocumentUrl:string):InvalidDidDocumentTransportTestFixture=>({name,did:input.did,options:{didDocumentUrl,allowTestLoopbackDocument:true}})
 return [
  {name:'non-web-did',did:'did:key:abc',options:{}},
  {name:'parent-path-segment',did:input.did+':..',options:{}},
  {name:'encoded-path-separator',did:input.did+':%2Fsecret',options:{}},
  {name:'encoded-userinfo-authority',did:'did:web:user%40example.invalid',options:{}},
  override('remote-document-override',p.foreignDocumentUrl),override('userinfo-document-override',p.userinfoDocumentUrl),
  override('query-document-override',p.queryDocumentUrl),override('fragment-document-override',p.fragmentDocumentUrl),
  {name:'zero-timeout',did:input.did,options:{requestTimeoutMs:0}},
  override('encoded-loopback-path-separator',p.encodedSeparatorDocumentUrl),
 ]
}
/** Port-bound real-server controls; the caller supplies the actual ephemeral listener port. */
export function createDidDocumentLoopbackTestFixtures(port:number):Readonly<{did:string;documentUrl:string;invalid:readonly InvalidDidDocumentTransportTestFixture[]}>{
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('fixture_listener_port_invalid')
 const did='did:web:127.0.0.1%3A'+port+':ExampleTenant:ExamplePath',documentUrl='http://127.0.0.1:'+port+'/ExampleTenant/ExamplePath/.well-known/did.json'
 return {did,documentUrl,invalid:[
  {name:'canonical-ip-routing',did,options:{}},
  {name:'capability-without-override',did,options:{allowTestLoopbackDocument:true}},
  {name:'override-without-capability',did,options:{didDocumentUrl:documentUrl}},
  {name:'different-loopback-host',did,options:{didDocumentUrl:'http://localhost:'+port+'/did.json',allowTestLoopbackDocument:true}},
  {name:'different-loopback-port',did,options:{didDocumentUrl:'http://127.0.0.1:'+(port+1)+'/did.json',allowTestLoopbackDocument:true}},
  {name:'non-loopback-ip-did',did:DID_DOCUMENT_TEST_PROBES.nonLoopbackIpDid,options:{didDocumentUrl:documentUrl,allowTestLoopbackDocument:true}},
 ]}
}

/** Public-only JOSE agreement variants; field values and algorithms have one neutral fixture owner. */
export function createJoseAgreementKeyTestFixtures():readonly Readonly<{name:string;publicKeyJwk:PublicAgreementJwk}>[]{
 return Object.values(JoseEcdhAlgorithms).flatMap(alg=>[
  {name:'ec-'+alg,publicKeyJwk:{...structuredClone(agreementEcEcdh),alg}},
  {name:'x25519-'+alg,publicKeyJwk:{...structuredClone(agreementX25519),alg}},
 ])
}
/** Malformed or incompatible agreement input remains unknown, not a trusted key. */
export function createInvalidJoseAgreementKeyTestFixtures():readonly Readonly<{name:string;publicKeyJwk:unknown}>[]{
 const x=()=>structuredClone(agreementX25519)
 return [
  {name:'truncated-okp-coordinate',publicKeyJwk:{...x(),x:agreementX25519.x.slice(0,-2)}},
  {name:'invalid-okp-encoding',publicKeyJwk:{...x(),x:'invalid'}},
  {name:'private-okp-scalar',publicKeyJwk:{...x(),d:'synthetic-negative-value'}},
  {name:'wrong-ec-family-x25519',publicKeyJwk:{...x(),kty:'EC'}},
  {name:'signing-only-okp-curve',publicKeyJwk:{...x(),crv:'Ed25519'}},
  {name:'incompatible-okp-algorithm',publicKeyJwk:{...x(),alg:agreementEc.alg}},
  {name:'signing-only-key-use',publicKeyJwk:{...x(),use:'sig'}},
  {name:'signing-only-key-operations',publicKeyJwk:{...x(),key_ops:[JoseKeyOperations.Sign]}},
 ]
}
