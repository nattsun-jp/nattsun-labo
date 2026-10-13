const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;}addEventListener(){}}};vm.createContext(root);for(const file of ['engine.js','render.js','friend.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),root);const E=root.window.LaboFight,R=root.window.LaboFightRender;
const tick=(s,n)=>{for(let i=0;i<n;i++)E.step(s);};
function state(id=0){const s=E.create('friend',[id,id]);s.phase='fight';s.f[0].x=300;s.f[1].x=400;return s;}
for(let id=0;id<3;id++)for(const b of ['P','K']){
 const s=state(id),f=s.f[0],e=s.f[1];f.y=-50;const air=E.choose(s,0,b);air.frame=8;f.action=air;e.x=850;
 let scales=[],images=[],depth=0;const c=new Proxy({canvas:{width:960,height:540},save(){depth++},restore(){depth--},scale(...a){scales.push(a)},drawImage(...a){images.push(a)},createLinearGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});R.draw(c,s);assert.equal(depth,0);assert(!scales.some(([x,y])=>y===.65||x===.62),'air attack artwork must not shrink');assert(images.length>=2);assert(air.tipX<E.combat[id][b==='P'?'punch':'kick'].x,'air hitbox stays shorter, independent of body art');
}
{
 const s=state(),f=s.f[0],e=s.f[1];e.dir=[1,0];const m=E.choose(s,0,'P');for(let i=0;i<4;i++)assert(E.hit(s,0,m));assert.equal(e.hp,100,'every hit during blockstun remains harmless');assert.equal(e.guard,72);assert.equal(e.damageTaken,0);assert.equal(f.combo,0);
 const g=e.guard;tick(s,89);assert.equal(e.guard,g,'guard does not regenerate during delay');tick(s,2);assert(e.guard>g,'guard regenerates after delay');
 e.guard=6;e.x=400;assert(E.hit(s,0,m));assert.equal(e.hp,100,'breaking hit also does zero HP damage');assert.equal(e.confusion,120);assert.equal(e.guard,0);const x=e.x;
 for(let i=0;i<119;i++){E.direction(s,1,-1,-1);E.press(s,1,'K');E.step(s);assert.equal(e.x,x);assert.equal(e.y,0);assert.equal(e.action,null);assert.equal(e.queue.length,0);}
 assert.equal(e.confusion,1);E.step(s);assert.equal(e.confusion,0);assert.equal(e.guard,100);E.direction(s,1,1,0);E.step(s);assert(e.x>x,'movement resumes after two seconds');
 const open=state();const base=E.choose(open,0,'P');assert(E.hit(open,0,base));assert.equal(open.f[1].hp,97.5);assert.equal(open.f[1].damageTaken,5);assert.equal(open.f[0].maxHp,200);
}
{
 const s=state(2),f=s.f[0],e=s.f[1];const data={...E.chars[2].skills[2],type:'skill',originFace:1};assert(E.hit(s,0,data));assert.equal(e.hp,50,'data keeps the specified half-max-HP damage');assert.equal(e.damageTaken,100);
 E.resetRound(s);assert.equal(s.f[1].guard,100);assert.equal(s.f[1].confusion,0);assert.equal(s.f[1].hp,100);assert.equal(s.f[1].maxHp,200);
}
{
 const s=state();s.f[0].x=E.arena.right;E.direction(s,0,1,0);tick(s,3);assert.equal(s.f[0].x,1135);s.f[0].x=1000;E.direction(s,0,1,0);tick(s,10);assert(s.f[0].x>1000,'the added stage area is playable');assert(root.window.LaboFriend.validState(JSON.parse(JSON.stringify(s))),'new defence state remains accepted for online guests');
}
console.log('Defence: full-size aerial P/K, 200 health, zero chip and consecutive guards, regeneration, 2-second input lock/recovery, data damage, expanded stage and online state passed');
