// Flow contract: existing persisted identity-governance kind tags remain readable across sectors; occupation claims and kind tags never substitute for authenticated authority.
import assert from 'node:assert/strict'
import test from 'node:test'
import {ActorKinds,isActorKind} from '../dist/actor-kinds.js'

test('recognizes the existing persisted profile kind tags without rewriting identity',()=>{
 const persisted=[
  ['host_onboarding','HostOnboarding'],
  ['organization_controller','OrganizationController'],
  ['organization_employee','OrganizationEmployee'],
  ['individual_controller','IndividualController'],
  ['individual_member','IndividualMember'],
  ['professional','Professional'],
 ]
 for(const [stored,key] of persisted){assert.equal(ActorKinds[key],stored);assert.equal(isActorKind(stored),true)}
})

test('does not confuse occupations or caller objects with a profile kind',()=>{
 for(const value of ['ISCO-08|2261','doctor','controller','OrganizationEmployee','',null,undefined,{},['organization_employee']])assert.equal(isActorKind(value),false)
 let reads=0
 assert.equal(isActorKind({toString(){reads++;return 'organization_employee'}}),false)
 assert.equal(reads,0)
})
