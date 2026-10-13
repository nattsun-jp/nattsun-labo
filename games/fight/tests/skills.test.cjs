const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');const root={window:{},Image:class{constructor(){this.complete=false;}}};vm.createContext(root);for(const file of ['engine.js','render.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),root);const E=root.window.LaboFight,R=root.window.LaboFightRender;
function make(id=0,face=1){const s=E.create('friend',[id,1]);s.phase='fight';s.f[0].x=face>0?300:700;s.f[1].x=face>0?650:350;s.f[0].face=face;s.f[0].meter=100;return s;}
const tick=(s,n)=>{for(let i=0;i<n;i++)E.step(s);};
function input(s,seq){for(const d of seq){E.direction(s,0,...d);s.frame++;}}
for(let id=0;id<3;id++)for(const face of [-1,1]){
 const s=make(id,face);input(s,[[face,0],[0,1],[face,1]]);const m=E.choose(s,0,'P');assert.equal(m.index,4);assert.equal(m.cost,30);assert.equal(s.f[0].meter,70);E.startMove(s,0,m);assert.equal(s.events.at(-1).type,'move','anti-air is not a MAX super');tick(s,m.hits[0]);assert.equal(s.projectiles.length,1);const p=s.projectiles[0];assert(Math.sign(p.vx)===face&&p.vy<0);assert(p.airOnly&&p.rx>=48&&p.ry>=44);assert.equal(p.m.kind,['ruler','bomb','cd'][id]);
 const quick=make(id,face);input(quick,[[face,0],[0,1],[face,1]]);E.press(quick,0,'P');E.direction(quick,0,0,1);E.direction(quick,0,0,0);E.step(quick);assert.equal(quick.f[0].action.index,4,'releasing diagonal after P cannot corrupt the command');
 const q=make(id,face);input(q,[[0,1],[face,1],[face,0]]);assert.equal(E.choose(q,0,'P').index,0,'quarter-circle remains special 1');
 const late=make(id,face);input(late,[[face,0],[0,1],[face,1]]);late.frame+=70;assert.notEqual(E.choose(late,0,'P').index,4);
 const poor=make(id,face);poor.f[0].meter=29;input(poor,[[face,0],[0,1],[face,1]]);assert.equal(E.choose(poor,0,'P'),null);assert.equal(poor.f[0].meter,29);
}
for(const face of [-1,1]){
 const s=make(0,face);input(s,[[0,1],[face,1],[face,0]]);const m=E.choose(s,0,'P');assert.equal(m.kind,'fist');E.startMove(s,0,m);tick(s,12);assert.equal(s.projectiles.length,1);const firstY=s.projectiles[0].y,firstX=s.projectiles[0].x;tick(s,5);assert.equal(s.projectiles[0].y,firstY,'fist flies straight');assert(Math.sign(s.projectiles[0].x-firstX)===face);
 // Shooter moves vertically after launch; the projectile still resolves from its own location.
 s.f[0].y=-150;tick(s,30);assert.equal(s.f[1].hp,90);assert.equal(s.f[0].y,0);assert.equal(s.projectiles.length,0,'one projectile cannot hit repeatedly');
 const guard=make(0,face);guard.f[1].dir=[face,0];const shot={...E.chars[0].skills[0],type:'skill',index:0,originFace:face};E.spawnProjectile(guard,0,shot);tick(guard,40);assert.equal(guard.f[1].hp,100,'normal back guard prevents projectile HP damage');assert(guard.f[1].guard<100);
}
for(let id=0;id<3;id++){
 const ground=make(id);ground.f[1].x=420;const m={...E.chars[id].skills[4],type:'skill',index:4,originFace:1};E.spawnProjectile(ground,0,m);tick(ground,10);assert.equal(ground.f[1].hp,100,'anti-air does not hit grounded opponent');
 const air=make(id);air.f[1].x=440;air.f[1].y=-100;air.f[1].vy=-5;E.spawnProjectile(air,0,m);tick(air,10);assert.equal(air.f[1].hp,90.5,'wide anti-air hits airborne opponent');
 const before=air.f[0].x;const p={x:air.f[1].x,y:400,vx:7,vy:-7,airOnly:true};assert.equal(E.hit(ground,0,m,0,p),false);assert.equal(air.f[0].x,before,'projectile hits never move the owner as a collision proxy');
}
{
 const cpu=E.create('cpu',[0,2]);cpu.phase='fight';cpu.rng=1;cpu.f[0].y=-100;cpu.f[1].meter=100;E.step(cpu);assert.equal(cpu.f[1].action.index,4,'CPU responds to jump with anti-air');
 const drill=E.create('training');drill.phase='fight';drill.dummy='jump';let jumps=0,was=0;for(let i=0;i<150;i++){E.step(drill);if(drill.f[1].y<0&&was===0)jumps++;was=drill.f[1].y;}assert(jumps>=3,'jump dummy repeats jumps');
 const s=make();let stack=0;const c=new Proxy({canvas:{width:960,height:540},save(){stack++;},restore(){stack--;},createLinearGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true;}});for(let id=0;id<3;id++)E.spawnProjectile(s,0,{...E.chars[id].skills[4],type:'skill',index:4,originFace:1});E.spawnProjectile(s,0,{...E.chars[0].skills[0],type:'skill',index:0,originFace:1});R.draw(c,s);assert.equal(stack,0);
}
console.log('Skills: mirrored dragon-punch/QCF inputs, 30 meter cost, fist flight/guard, aerial-only wide projectiles, CPU and jump dummy passed');
