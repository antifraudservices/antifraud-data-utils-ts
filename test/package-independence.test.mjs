// Flow contract: every package dependency and executable source/test import stays independent of frozen client SDKs; recorded predecessor vectors are inert data, never executable compatibility dependencies.
import assert from 'node:assert/strict'
import test from 'node:test'
import {existsSync,readFileSync,readdirSync} from 'node:fs'
import {dirname,join,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import ts from 'typescript'

const root=dirname(dirname(fileURLToPath(import.meta.url)))
const forbidden=name=>/^(?:gdc-|uhc-|vet-)/u.test(name)||/^npm:(?:gdc-|uhc-|vet-)/u.test(name)
const json=path=>JSON.parse(readFileSync(path,'utf8'))

test('manifest, lock and installed package identities contain no frozen client dependencies, including development aliases',()=>{
 const findings=[]
 const manifest=json(join(root,'package.json')),lock=json(join(root,'package-lock.json'))
 for(const [field,dependencies]of Object.entries(manifest))if(['dependencies','devDependencies','optionalDependencies','peerDependencies'].includes(field))for(const [name,version]of Object.entries(dependencies))if(forbidden(name)||forbidden(version))findings.push(`package.json:${field}:${name}`)
 for(const [path,entry]of Object.entries(lock.packages??{})){
  if(/(?:^|\/node_modules\/|^node_modules\/)(?:gdc-|uhc-|vet-)/u.test(path)||forbidden(entry.name??'')||forbidden(entry.version??''))findings.push(`package-lock.json:${path}`)
  if(path){const installed=join(root,path,'package.json');if(existsSync(installed)&&forbidden(json(installed).name??''))findings.push(`installed:${path}`)}
 }
 assert.deepEqual(findings,[])
})

test('production modules and real test/tool modules never execute frozen client imports',()=>{
 const findings=[]
 function visitFile(path){
  const source=ts.createSourceFile(path,readFileSync(path,'utf8'),ts.ScriptTarget.Latest,true,path.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
  function check(node){
   let value
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteralLike(node.moduleSpecifier))value=node.moduleSpecifier.text
   if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||(ts.isIdentifier(node.expression)&&node.expression.text==='require'))&&node.arguments[0]&&ts.isStringLiteralLike(node.arguments[0]))value=node.arguments[0].text
   if(value&&forbidden(value))findings.push(relative(root,path).replaceAll('\\','/'))
   ts.forEachChild(node,check)
  }
  check(source)
 }
 function walk(directory){if(!existsSync(directory))return;for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);if(entry.isDirectory())walk(path);else if(/\.(?:[cm]?[jt]s|tsx|jsx)$/u.test(entry.name))visitFile(path)}}
 for(const directory of ['src','dist','test','scripts'])walk(join(root,directory))
 assert.deepEqual([...new Set(findings)].sort(),[])
})
