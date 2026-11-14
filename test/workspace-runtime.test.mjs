// Flow contract: keep the approved workspace Node runtime identical in the executing gate, repository instructions and CI; consumer engine compatibility never selects an older workspace runtime.
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
const approved='26.13.0'
test('CI uses the same approved runtime as the executing package gate',async()=>{
 assert.equal(process.versions.node,approved)
 const workflow=await readFile(new URL('../.github/workflows/ci.yml',import.meta.url),'utf8')
 const pins=[...workflow.matchAll(/node-version:\s*([0-9.]+)/gu)].map(match=>match[1])
 assert.deepEqual(pins,[approved])
})
test('repository and release instructions declare the approved runtime without an older install command',async()=>{
 const skill=await readFile(new URL('../.codex/skills/enforce-antifraud-release-discipline/SKILL.md',import.meta.url),'utf8')
 const instructions=await readFile(new URL('../AGENTS.md',import.meta.url),'utf8')
 assert.ok(skill.includes(approved));assert.ok(instructions.includes(approved))
 assert.doesNotMatch(skill,/Use Node\.js 24\b/u)
})
