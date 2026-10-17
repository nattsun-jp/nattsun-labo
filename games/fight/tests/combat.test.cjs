const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'engine.js'),'utf8'),sandbox);const E=sandbox.window.LaboFight;
function state(ids=[0,1]){const s=E.create('training',ids);s.phase='fight';s.infinite=false;s.f[0].x=300;s.f[1].x=390;return s;}
function tick(s,n){for(let i=0;i<n;i++)E.step(s);}
const basic=(s,b='K')=>{s.f[0].chain=0;s.f[0].lastBasic=s.frame-100;return E.choose(s,0,b);};
for(let id=0;id<3;id++){
 const s=state([id,id]),f=s.f[0],e=s.f[1];for(const button of ['P','K']){
  f.dir=[0,0];const mid=basic(s,button);f.dir=[0,1];const low=basic(s,button);f.y=-40;f.dir=[0,0];const air=basic(s,button);f.y=0;f.dir=[0,0];
  assert(low.tipX<mid.tipX);if(id===0&&button==='K')assert(air.rulerArt&&air.tipX>low.tipX,'Rei aerial K uses the ruler reach');else assert.equal(low.tipX,air.tipX);assert.notEqual(mid.tipY,low.tipY);assert.notEqual(air.tipY,low.tipY);
  const bx=E.attackbox(f,mid);e.x=bx.right+E.combat[id].width+2;assert.equal(E.hit(s,0,mid),false,'outside limb cannot hit');e.x=mid.tipX+f.x;assert.equal(E.hit(s,0,mid),true,'fist or toe contact must hit');e.hp=100;e.stun=0;
  f.face=-1;mid.originFace=-1;const mirror=E.attackbox(f,mid);assert.equal(Math.round(mirror.left-f.x),Math.round(f.x-bx.right));f.face=1;
 }
}
assert.notEqual(E.combat[0].kick.x,E.combat[1].kick.x);assert.notEqual(E.combat[1].kick.x,E.combat[2].kick.x);
{
 const s=state(),f=s.f[0],e=s.f[1];f.dir=[0,1];const low=basic(s,'K');e.y=-180;assert.equal(E.hit(s,0,low),false,'low kick cannot hit high airborne target');e.y=0;e.dir=[1,1];assert(E.hit(s,0,low));assert.equal(e.hp,100,'crouch guard prevents all HP damage');assert(e.guard<100);
 e.hp=100;e.stun=0;e.dir=[1,0];assert(E.hit(s,0,low));assert.equal(e.hp,96,'standing guard does not block low');
}
for(const swap of [false,true]){
 const s=state(),f=s.f[0],e=s.f[1];e.x=360;f.dir=[swap?-1:1,0];const t=E.choose(s,0,'S');assert.equal(t.type,'throw');assert.equal(t.swap,swap);assert(E.hit(s,0,t));assert.equal(e.hp,93);assert.equal(f.x>e.x,swap);assert.equal(e.down,30);
 f.dir=[0,0];e.dir=[1,0];const knockedX=e.x;tick(s,29);assert.equal(e.down,1);assert.equal(e.x,knockedX);tick(s,1);assert(e.wakeup>0);const wakeX=e.x;tick(s,8);assert.equal(e.x,wakeX);assert(e.wakeup>0);tick(s,3);assert.equal(e.wakeup,0);
}
{
 const s=state(),f=s.f[0],e=s.f[1];e.x=350;f.y=e.y=-70;f.dir=[1,0];const t=E.choose(s,0,'S');assert(t.air);assert(E.hit(s,0,t));assert.equal(e.hp,90);assert(e.down>0);tick(s,10);assert.equal(e.y,0);assert(e.down>0);
 const ground=state();ground.f[0].dir=[1,0];ground.f[1].x=350;ground.f[1].y=-70;assert.equal(E.hit(ground,0,E.choose(ground,0,'S')),false,'ground throw cannot catch airborne target');
}
{
 const s=state();s.f[0].dir=[-1,0];assert.equal(E.choose(s,0,'P').type,'basic','old throw input is now punch');s.f[1].x=800;assert.equal(E.hit(s,0,E.choose(s,0,'S')),false,'throw whiffs outside grab range');
 const f=s.f[0];f.meter=100;E.direction(s,0,1,0);s.frame++;E.direction(s,0,0,1);s.frame++;E.direction(s,0,-1,0);assert.equal(E.choose(s,0,'S').index,2,'super takes priority over directional throw');assert.equal(f.meter,0);
}
for(const dx of [-1,1]){
 const s=state();s.f[0].x=dx>0?300:500;s.f[1].x=dx>0?355:445;E.direction(s,0,dx,-1);tick(s,52);assert.equal(s.f[0].y,0);assert.equal(s.f[0].x>s.f[1].x,dx>0,'diagonal jump crosses opponent');tick(s,1);assert.equal(s.f[0].face,dx>0?-1:1);
}
for(const dy of [-1,0,1]){
 const s=state();E.direction(s,0,1,dy);tick(s,2);E.direction(s,0,0,0);tick(s,1);if(dy<0){E.direction(s,0,1,dy);tick(s,1);E.direction(s,0,0,0);tick(s,1);}E.direction(s,0,1,dy);assert(s.f[0].dash>0,'double tap direction starts dash');const x=s.f[0].x;tick(s,1);assert(s.f[0].x-x>6);const ticks=s.f[0].dash;E.direction(s,0,1,dy);assert.equal(s.f[0].dash,ticks,'held input does not restart dash');
}
{
 const s=state();E.direction(s,0,1,0);tick(s,26);E.direction(s,0,0,0);tick(s,1);E.direction(s,0,1,0);assert.equal(s.f[0].dash,0,'late second tap is ordinary walking');
}
// Existing combo, super and CPU simulation still complete without invalid state.
{
 const s=state(),f=s.f[0];s.f[1].x=390;for(let i=0;i<3;i++){E.press(s,0,'P');tick(s,13);}assert.equal(f.combo,3);assert.equal(f.comboDamage,21);
 for(let a=0;a<3;a++)for(let b=0;b<3;b++){const cpu=E.create('cpu',[a,b]);for(let frame=0;frame<10000&&cpu.phase!=='match';frame++){if(frame%21===0)E.press(cpu,0,frame%42?'P':'K');if(frame%60===0)E.direction(cpu,0,cpu.f[0].face,frame%120?1:0);E.step(cpu);for(const g of cpu.f)assert([g.x,g.y,g.hp,g.meter,g.wakeup,g.down].every(Number.isFinite));}assert(cpu.f.some(g=>g.wins>0));}
}
console.log('Combat: limb hitboxes, guards, directional/air throws, wakeup, cross-ups, dash, combo and CPU passed');
