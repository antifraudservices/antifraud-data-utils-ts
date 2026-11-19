/** Neutral synthetic public fixtures. No seed, private key, resolver or authority is provided. */
import {DidCoreContext,type DidDocument,type VerificationMethod} from './did-document.js'
import type {PublicJwk,ClassicPublicJwk,MlkemPublicJwk} from './cryptography/types.js'

/** Fixed public-only samples: EC point generated for this fixture; ML-KEM sample reuses the canonical AF predecessor vector. */
export const DID_DOCUMENT_TEST_PUBLIC_KEYS=Object.freeze({
 ec:Object.freeze({"kty":"EC","x":"sbYF2RiMtVl1Wm-WVIH6itOUcr-dMu6jcCnJhPr-UwQ-eSIjONPixRZWPyV8Sgp4","y":"acEQPCKQeL-GagDzZg8wSVYfW4pHHRBvaDOPDgaeJGqKkGMvnH07Am8N0pdnm1-F","crv":"P-384","kid":"test-ec-agreement","alg":"ES384","use":"enc"} satisfies ClassicPublicJwk),
 mlkem:Object.freeze({"kty":"OKP","crv":"ML-KEM-768","x":"RHFz0AHLHOdlCdM9S1squpxdxPxB3ACWMUixLgqVjps5hCJG9WXNcsi3V0Nv1OkEreKExxyIWulKQ_g4hfIY6Kd22RhLg0omuSO0vqUfPmwfNygBCILAAGVgnTijPzOZrjtR4BcWIslBeQCntOVNDUguD0STA5h0CXA8xdiJ0CgUlwYwqMAZAjs25-RIjDrNTgYYA8cx7wAFBdomX8IL8BNf2EurymUenjh3RQO25WFhvHWdfQpn7qU6PhO4_NMwSSxTnAEAhOZB0kQqCtwIvgKKfqDPSmWTM6oOgvYT7sDBbtXFuFg6MUBNy-km5vxLCeGEHWdgNCBbgnKuaQQU0-ykxTZoOhNMo4SGtYqK69kUr5EQKluFvDksFBc6qNMKCFYHIVAB-MPPzAUFBLF2ouM5NagGyUiahffOKrCJVUc9mzls7dN1fqkKiUFSn5JSM-u5PdA4JOdLG6OsB0aMaZQaRfojpQQbrfOckPg9o5Ab-ny3hEjCH4dYEirFSWDM_osGsxhlQutXvAstW-ozcXG6uVlFo8tBkde_SqCCq3WchEfEPnZ27IOYKsNictKry0UptYo5S1sxSyEOKcmd2MW3qBe0V_OgsZWuJPlkjhJFZkGGoai4NlFuhlIeiXFSE9J3h7ehdBFse2BCDDNOElMmtUAdR6aEewPB2naxCUFocDmFT1MY8ao3aaWPfmlXB3OrVfaixHsmM-NFiKmGSWsW66Za4USEDqi3RTww6tSeJhw2YPx1VQub1XR99yYGkFsWyKMLXyAOt3Q29cRbwAILouhG2AIfNvoSWZR2E-KjvjuJHqeUZRyUVjmCnKifzAqkuPudKUgv6BEkD_KfMpwgY-OrKGZ8IuA2pVMJz9xfJERXbBVVt-Ncx1AdGBWA4tRfO3q8X7Bw6jJTygVHapWlHmaDieE-LBE75VdoN6sBJtx18tTPsJKIfsFPWcZxo0BeDQYca3MPZUuOgTMQB-Fs5-sAAVaZaTEqiFaAj_JLyrolltUtM0rGtytBnRwc6st7kiJ59EZnGmMtSGKU61sHQYp90YisLjXI0LK3ssJTtOk8IHBYU9U9Z4Z_EwxpCop8L-o2xfXFCkAHMiCm9TfLMZjNXNoGnfok45p4b8iXITI1PlA22iSUBQlBucBWIPJp3CeQ5QGNDdudT_VwqyWNj8pWuyC7exmLqwigVkASUAVaxWOPl4nM2aLNyulUC2wFWNkFJzPMSjsCNkQumhmEsbV5UlY3bwiUVRdD7nQ_kESEt4C4lES8evJLhUuUtgN9HaefacokS_pqDgJB9tqQsnVsP1WmiWgDN2Qp2lwP3jkyazStk7orG1Wz7IRSh4tGqcS3TkpaN5jFRfyRqgk1PGPEeQqLiteUiIGBYIsxcNYdqNdisEXAh2twvtA9eJIJwVSLYsKOGWgKWTSJ1aV18dJWmPAWhUNNY7fF4iBCYbWKwKmANXwPDDu_sZCpKkszOjgxKTp0j6h0JHPHO6JxPek-kuOMYLuZQSCj3zqNQhSc20QRQfS1qbXOjDAZoy5mF732489XwhXxamcdVnb20F_ieRV22x6jPVbZYyw","kid":"m4106BYzgkaLZyjlMe9eCxrIQe3qTufxstgKtiTN2bk"} satisfies MlkemPublicJwk),
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
})
export type DidDocumentTestFixtureInput=Readonly<{did:string;keys?:readonly PublicJwk[]}>
/** The caller supplies its reserved identity; this factory performs no ownership validation. */
export function createDidDocumentTestFixture(input:DidDocumentTestFixtureInput):DidDocument{
 const verificationMethod:VerificationMethod[]=(input.keys??[DID_DOCUMENT_TEST_PUBLIC_KEYS.ec]).map((key,index)=>({
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
  ...['d','k','p','q','dp','dq','qi','oth','dBytes','privBytes','priv','privateKey','privateKeyBytes','secretKey','secretKeyBytes'].map(field=>withKey('private-field-'+field,{[field]:'synthetic-negative-value'})),
 ]
}
