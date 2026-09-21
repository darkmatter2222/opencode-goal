import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import Plugin from '../dist/index.js'
import { createGoal, editGoal, pauseGoal, waitForUserGoal } from '../dist/domain/goal.js'
import { GoalStore } from '../dist/persistence/store.js'
import { closeObservedTurn } from '../dist/runtime/progress.js'
import { reportBlocker } from '../dist/runtime/blocker.js'
import { recordEmptyAssistantTurn } from '../dist/runtime/empty-turn.js'
import { reconcilePersistentGoals } from '../dist/opencode/supervisor.js'
import { createGoalInfrastructureTransport } from '../dist/opencode/infrastructure-recovery.js'
import { verifyArithmeticObjective, integerEquation } from '../dist/verification/arithmetic.js'
import { auditCompletion } from '../dist/verification/audit.js'
import { GOAL_COMMANDS, goalHelp } from '../dist/opencode/command-help.js'
const goal=()=>createGoal({sessionID:'s', objective:'1 + 1 = 3', persistent:true})
const tick=()=>new Promise(r=>setTimeout(r,30))
async function eventually(predicate) {
 const deadline=Date.now()+5000
 while(!await predicate()) {assert.ok(Date.now()<deadline,'observable state did not settle');await tick()}
}
async function fixture(fn) {
 const directory=await mkdtemp(path.join(os.tmpdir(),'relentless-'))
 let hooks
 try {
  const prompts=[];let status={};let response={}
  const client={session:{prompt:async a=>{prompts.push(a);return response},status:async()=>({data:status}),abort:async()=>({data:true})}}
  hooks=await Plugin({directory,client})
  const config={};await hooks.config(config)
  const store=new GoalStore(directory)
  const command=async (arguments_,name='goal')=>{const output={parts:[]};await hooks['command.execute.before']({sessionID:'s',command:name,arguments:arguments_},output);return output}
  await fn({hooks,client,store,prompts,config,command,directory,setStatus:x=>status=x,setResponse:x=>response=x})
 }finally{
  await hooks?.event({event:{type:'server.instance.disposed',properties:{}}})
  await tick();await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:50})
 }
}
test('persistent impossible objective stays unverified through 10000 failure observations',()=>{
 let current=goal()
 for(let i=1;i<=10000;i++) {
  current={...current,usage:{...current.usage,turns:i}}
  current=closeObservedTurn(current)
  current=reportBlocker(current,{turnID:String(i),reason:'mathematically impossible'})
  current=recordEmptyAssistantTurn(current,{messageID:`m${i}`})
  assert.equal(current.status,'active')
 }
 current=verifyArithmeticObjective(current)
 assert.equal(auditCompletion(current).ok,false)
 assert.ok(current.infrastructureRecovery.nextRetryAt>0)
 assert.equal(current.objective,'1 + 1 = 3')
})
test('integer oracle cannot be overridden by a forged semantic verdict',()=>{
 let current=goal()
 current.requirements=current.requirements.map(r=>({...r,status:'proven'}))
 current=verifyArithmeticObjective(current)
 assert.equal(auditCompletion(current).ok,false)
 assert.equal(integerEquation('1 + 1 = 2').passed,true)
 assert.equal(integerEquation('1 + 1 = 3').passed,false)
 assert.equal(integerEquation('process.exit(0)'),null)
})
test('duplicate idle accounting cannot create progress or stall turns',()=>{
 let current=goal();for(let i=0;i<100;i++)current=closeObservedTurn(current)
 assert.equal(current.stalledTurns,0);assert.equal(current.status,'active')
})
test('model dependency report never disables a persistent goal',()=>{
 const current=waitForUserGoal(goal(),{reason:'impossible',needed:'new arithmetic'})
 assert.equal(current.status,'active');assert.ok(current.infrastructureRecovery.nextRetryAt)
})
test('SDK resolved error objects become failures',async()=>{
 const wrapped=createGoalInfrastructureTransport({session:{prompt:async()=>({error:{message:'HTTP 503'}})}})
 await assert.rejects(wrapped.client.session.prompt({sessionID:'s'}),/503/)
})
test('all aliases and contextual help are generated without model calls',async()=>fixture(async f=>{
 for(const [name] of GOAL_COMMANDS){assert.ok(f.config.command[`goal-${name}`]);assert.match(goalHelp(name),/Usage:/)}
 for(const text of ['', 'help', 'help edit','edit','stats']) {
  const output=await f.command(text);assert.equal(output.noReply,true)
 }
 assert.equal(await f.store.load('s'),null);assert.equal(f.prompts.length,0)
 const output=await f.command('edit','goal-help');assert.match(output.parts[0].text,/revised objective/)
}))
test('public goals default to persistent and pause/stop keep user authority',async()=>fixture(async f=>{
 await f.command('1 + 1 = 3');assert.equal((await f.store.load('s')).persistent,true)
 await f.command('','goal-pause');assert.equal((await f.store.load('s')).status,'paused')
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks,Date.now()+999999)
 assert.equal(f.prompts.length,0)
 await f.command('','goal-stop');assert.equal(await f.store.load('s'),null)
 assert.equal((await f.store.history('s')).length,1)
}))
test('scanner repairs a lost wake, respects busy host and does not revive user pause',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0})
 f.setStatus({s:{type:'busy'}})
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks);assert.equal(f.prompts.length,0)
 f.setStatus({})
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks);await tick();assert.equal(f.prompts.length,1)
 await f.command('pause')
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks,Date.now()+999999);assert.equal(f.prompts.length,1)
}))
test('provider errors retain the goal and persist a future retry',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0});f.setResponse({error:{message:'HTTP 503 unavailable'}})
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks)
 await eventually(async()=>Boolean((await f.store.load('s'))?.infrastructureRecovery?.nextRetryAt))
 const current=await f.store.load('s');assert.equal(current.status,'active');assert.ok(current.infrastructureRecovery.nextRetryAt>Date.now())
 await f.command('pause')
}))
test('retry preserves provider deadline and never overrides user pause',async()=>fixture(async f=>{
 let current=waitForUserGoal(goal(),{reason:'provider needs credentials'});await f.store.save(current)
 const due=current.infrastructureRecovery.nextRetryAt
 await f.command('retry');assert.equal((await f.store.load('s')).infrastructureRecovery.nextRetryAt,due);assert.equal(f.prompts.length,0)
 await f.command('pause');const result=await f.command('retry');assert.match(result.parts[0].text,/paused/)
}))

test('late model blocker cannot resume a user-paused goal',async()=>fixture(async f=>{
 await f.command('1 + 1 = 3');await f.command('pause')
 const output=await f.hooks.tool.opencode_goal_blocked.execute({reason:'try again'}, {sessionID:'s'})
 assert.match(output,/rejected/);assert.equal((await f.store.load('s')).status,'paused')
}))
test('provider Retry-After is preserved above the local backoff cap',async()=>{
 const {retryAfterDeadline}=await import('../dist/runtime/retry-after.js')
 const {recoverPersistentGoal}=await import('../dist/runtime/persistence-policy.js')
 const now=1000,until=retryAfterDeadline({response:{headers:new Headers({'Retry-After':'3600'})}},now)
 const current=recoverPersistentGoal(goal(),'429',now,'continuation_dispatch',until)
 assert.equal(current.infrastructureRecovery.nextRetryAt,3601000)
 assert.equal(current.nextWakeAt,3601000)
})
test('persistent restart is reconciled without the legacy bootstrap barrier',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0})
 const restarted=await Plugin({directory:f.directory,client:f.client})
 await restarted.config({})
 await reconcilePersistentGoals({directory:f.directory,client:f.client},restarted)
 await tick();assert.equal(f.prompts.length,1)
 await restarted.event({event:{type:'server.instance.disposed',properties:{}}})
}))
test('simultaneous dispatchers share a persisted lease',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0})
 let settle;f.client.session.prompt=arg=>{f.prompts.push(arg);return new Promise(r=>settle=r)}
 const other=await Plugin({directory:f.directory,client:f.client})
 await Promise.allSettled([f.hooks,other].map(h=>reconcilePersistentGoals({directory:f.directory,client:f.client},h)))
 await tick();assert.equal(f.prompts.length,1)
 settle({});await tick()
}))

test('native picker is capability-detected and inserts commands without executing them',async()=>{
 const {default:plugin}=await import('../dist/tui/index.js')
 let layer,dialog,inserted
 await plugin.tui({
  slots:{register(){}},state:{path:{directory:'/unused',worktree:'/unused'},session:{status(){},messages(){return []}}},
  keymap:{registerLayer:x=>layer=x},
  ui:{DialogSelect:x=>x,dialog:{replace:render=>dialog=render(),clear(){}}},
  client:{tui:{appendPrompt:async x=>inserted=x}},
 })
 assert.equal(layer.commands[0].slashName,'goal-menu')
 layer.commands[0].run();assert.ok(dialog.options.length>=15)
 dialog.onSelect({value:'pause'});await tick();assert.equal(inserted.text,'/goal pause ')
})

test('dead-process lease does not delay restart until its old deadline',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0,dispatchLease:{owner:'2147483647:dead',expiresAt:Date.now()+1800000}})
 await reconcilePersistentGoals({directory:f.directory,client:f.client},f.hooks)
 await tick();assert.equal(f.prompts.length,1)
}))

for (const objective of ['pause', 'clear', 'help', 'edit', 'fix --help output', 'status\n--check literal']) {
 test(`literal new goal preserves objective: ${objective}`,async()=>fixture(async f=>{
  await f.command(`-- ${objective}`,'goal-new')
  const current=await f.store.load('s')
  assert.equal(current.objective,objective);assert.equal(current.status,'active')
 }))
}
test('invalid stop arguments cannot clear an existing goal',async()=>fixture(async f=>{
 await f.command('existing objective')
 const result=await f.command('stop extra')
 assert.match(result.parts[0].text,/Usage: \/goal stop/)
 assert.equal((await f.store.load('s')).objective,'existing objective')
}))
test('explicit new keeps structured check flags',async()=>fixture(async f=>{
 await f.command('pause --check "npm test"','goal-new')
 const current=await f.store.load('s')
 assert.equal(current.objective,'pause');assert.deepEqual(current.checks,['npm test'])
}))
test('editing and promoting queued goals preserve persistent policy',async()=>fixture(async f=>{
 await f.command('original objective');await f.command('edit revised objective')
 assert.equal((await f.store.load('s')).persistent,true)
 assert.equal(editGoal(goal(),{objective:'revised'}).persistent,true)
 await f.command('add queued objective');await f.command('stop');await f.command('next')
 const current=await f.store.load('s')
 assert.equal(current.objective,'queued objective');assert.equal(current.persistent,true)
}))
test('tool rounds consume usage but only terminal messages consume Goal turns',async()=>fixture(async f=>{
 const output=await f.command('ten distinct turns')
 await f.hooks['chat.message']({sessionID:'s',messageID:'user',agent:'build'},{message:{id:'user'},parts:output.parts})
 for(const [id,finish] of [['tool-1','tool-calls'],['tool-2','tool-calls'],['final','stop']]) {
  await f.hooks.event({event:{type:'message.updated',properties:{info:{id,sessionID:'s',parentID:'user',role:'assistant',text:'meaningful',finish,time:{created:1,completed:2},tokens:{input:2,output:3},cost:0.01}}}})
 }
 const current=await f.store.load('s')
 assert.equal(current.usage.turns,1);assert.equal(current.usage.tokens,15)
 assert.equal(current.usage.cost,0.03);assert.equal(current.usage.seenMessageIDs.length,3)
}))

test('pause/resume and edit preserve provider Retry-After without issuing a command turn',async()=>fixture(async f=>{
 const {recoverPersistentGoal}=await import('../dist/runtime/persistence-policy.js')
 const due=Date.now()+3600000
 await f.store.save(recoverPersistentGoal(goal(),'429',Date.now(),'continuation_dispatch',due))
 await f.command('pause')
 const resumed=await f.command('resume')
 assert.equal(resumed.noReply,true)
 let current=await f.store.load('s')
 assert.equal(current.status,'active');assert.equal(current.providerRetryAt,due)
 assert.ok(current.infrastructureRecovery.nextRetryAt>=due)
 const edited=await f.command('edit still must finish')
 assert.equal(edited.noReply,true)
 current=await f.store.load('s');assert.equal(current.providerRetryAt,due)
 await f.hooks.event({event:{type:'session.idle',properties:{sessionID:'s'}}})
 assert.equal(f.prompts.length,0)
 const later=recoverPersistentGoal(current,'another network observation')
 assert.ok(later.infrastructureRecovery.nextRetryAt>=due)
}))
test('resume of an already-active goal keeps its lease and does not seed duplicate work',async()=>fixture(async f=>{
 const lease={owner:`${process.pid}:other`,expiresAt:Date.now()+300000}
 await f.store.save({...goal(),dispatchLease:lease})
 const output=await f.command('resume')
 assert.equal(output.noReply,true)
 assert.deepEqual((await f.store.load('s')).dispatchLease,lease)
 assert.equal(f.prompts.length,0)
}))
test('retry is scoped to its own session',async()=>fixture(async f=>{
 await f.store.save({...goal(),nextWakeAt:0})
 await f.store.save({...createGoal({sessionID:'other',objective:'other goal',persistent:true}),nextWakeAt:0})
 await f.command('retry')
 await eventually(async()=>f.prompts.length===1 && !(await f.store.load('s')).dispatchLease)
 assert.equal(f.prompts[0].path.id,'s')
 assert.equal((await f.store.load('other')).dispatchLease,undefined)
}))
test('a newer explicit pause invalidates pending model resume intent',async()=>fixture(async f=>{
 await f.command('objective');await f.command('pause')
 const result=await f.hooks.tool.opencode_goal_resume.execute({}, {sessionID:'s'})
 assert.match(result,/accepted/)
 await f.command('pause')
 await f.hooks.event({event:{type:'session.idle',properties:{sessionID:'s'}}})
 assert.equal((await f.store.load('s')).status,'paused')
 assert.equal(f.prompts.length,0)
}))
test('inspection reports corrupt storage as an actionable command failure',async()=>fixture(async f=>{
 const {writeFile}=await import('node:fs/promises')
 await f.command('objective')
 await writeFile(f.store.fileFor('s'),'{broken')
 const output=await f.command('why')
 assert.equal(output.noReply,true)
 assert.match(output.parts[0].text,/Goal command did not finish/)
 assert.equal(f.prompts.length,0)
}))
