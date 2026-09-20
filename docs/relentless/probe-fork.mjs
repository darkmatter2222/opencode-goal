// Audit probes assert existing defects/policy mismatches, not desired behavior.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createGoal, waitForUserGoal } from '../../dist/domain/goal.js';
import { closeObservedTurn, markHostProgress } from '../../dist/runtime/progress.js';
import { recordEmptyAssistantTurn } from '../../dist/runtime/empty-turn.js';
import { reportBlocker } from '../../dist/runtime/blocker.js';
import { parseGoalCommand } from '../../dist/opencode/command.js';
import { shellGitWorkspaceMarker } from '../../dist/opencode/shell-progress.js';
import { modelContextCompactionReason } from '../../dist/runtime/model-context.js';
const results=[];
const fresh=()=>createGoal({sessionID:'audit',objective:'Under standard integer arithmetic, make 1 + 1 equal 3'});
let goal=fresh(); for(let i=0;i<3;i++) goal=closeObservedTurn(goal);
assert.equal(goal.status,'paused'); assert.equal(goal.usage.turns,0);
results.push({name:'three idle closures pause with zero completed turns',status:goal.status,turns:goal.usage.turns});
goal=fresh(); for(let i=0;i<2;i++) goal=recordEmptyAssistantTurn(goal,{messageID:`empty-${i}`});
assert.equal(goal.status,'paused'); results.push({name:'two empty completions pause',status:goal.status});
goal=waitForUserGoal(fresh(),{reason:'I believe the goal is impossible'});
assert.equal(goal.status,'waiting_user'); results.push({name:'model wait requires no dependency evidence',status:goal.status});
goal=fresh(); for(const i of [1,5,9]) {goal=reportBlocker(goal,{turnID:`turn-${i}`,reason:'same blocker'}); if(i<9) goal=markHostProgress(goal,{fingerprint:`progress-${i}`,source:'audit'});}
assert.equal(goal.status,'blocked'); results.push({name:'nonconsecutive reports with intervening progress still block',status:goal.status});
assert.equal(parseGoalCommand('help').action,'create'); assert.equal(parseGoalCommand('help').objective,'help');
assert.equal(parseGoalCommand('').objective,''); results.push({name:'help and empty command lack navigation behavior',help:parseGoalCommand('help').action,emptyObjective:parseGoalCommand('').objective});
const dir=await mkdtemp(path.join(tmpdir(),'goal-marker-audit-'));
try {
 const git=(...args)=>execFileSync('git',['-C',dir,...args],{stdio:'pipe'});
 git('init'); git('config','user.name','Audit');git('config','user.email','audit@example.invalid');
 await writeFile(path.join(dir,'work.txt'),'base');git('add','.');git('commit','-m','fixture');
 await writeFile(path.join(dir,'work.txt'),'first real change');const first=await shellGitWorkspaceMarker(dir);
 await writeFile(path.join(dir,'work.txt'),'second distinct real change');const second=await shellGitWorkspaceMarker(dir);
 assert.ok(first);assert.equal(first,second);results.push({name:'second edit of dirty file invisible to shell marker',sameMarker:true});
} finally {await rm(dir,{recursive:true,force:true});}
const pressure=modelContextCompactionReason({execution:{modelContext:{contextLimit:4096,lastRequestTokens:1}}});
assert.ok(pressure);results.push({name:'8192 minimum reserve marks 4096 window full at one input token',reason:pressure});
console.log(JSON.stringify({commit:'586e7ce3cf3a9105c7389310cc929ec1ed5e2bad',results},null,2));
