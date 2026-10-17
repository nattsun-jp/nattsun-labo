const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const {E,runHuman}=require('./helpers/human-routes.cjs');
for(const id of [0,2])for(const enemy of [0,1,2])for(const sign of [-1,1])for(const jitter of [0,3]){const r=runHuman({id,enemy,sign,jitter});assert.equal(r.hits.length,id===0?17:11,JSON.stringify({id,enemy,sign,jitter,hits:r.hits}));assert(r.hits.at(-1).down>0);const normalGaps=r.hits.slice(1).map((h,i)=>({h,delta:h.n-r.hits[i].n})).filter(x=>!x.h.name.includes('プラグイン連打'));assert(normalGaps.every(x=>x.delta>=16),'normal hits are at least 0.267 real seconds apart');assert(r.hits.at(-1).n>=(id===0?350:235));}
function scene(ids=[0,1]){const s=E.create('training',ids);s.phase='fight';s.infinite=false;s.f[0].x=400;s.f[1].x=490;return s;}
const frames=(s,n)=>{for(let i=0;i<n;i++)E.advance(s)};
{
 const s=scene();E.press(s,0,'P');while(!s.f[0].combo)E.advance(s);const original={frame:s.frame,y:s.f[1].y,stun:s.f[1].stun,action:s.f[0].action.frame,hp:s.f[1].hp};const stop=s.hitStopFrames;assert.equal(stop,10);
 E.press(s,0,'K');frames(s,stop);assert.equal(s.frame,original.frame);assert.equal(s.f[1].y,original.y);assert.equal(s.f[1].stun,original.stun);assert.equal(s.f[0].action.frame,original.action);assert.equal(s.f[1].hp,original.hp);assert.equal(s.f[0].queue.length,1,'hitstop keeps a buffered attack');frames(s,20);assert.equal(s.f[0].combo,2,'one buffered input is consumed exactly once');
}
{
 const s=scene();E.direction(s,0,1,1);E.press(s,0,'K');while(!s.f[0].combo)E.advance(s);E.direction(s,0,0,-1);frames(s,3);E.direction(s,0,0,0);frames(s,12);assert(s.f[0].y<0,'a short up tap during hitstop still grants JC');assert.equal(s.f[0].airJumps,0);
}
{
 const s=scene(),f=s.f[0],e=s.f[1];e.x=900;E.press(s,0,'P');frames(s,7);assert.equal(f.combo,0);assert(E.activeNow(f.action));const b=E.attackbox(f,f.action);e.x=b.right+E.combat[e.id].width-2;frames(s,1);assert.equal(f.combo,1,'target entering after the first active frame is hit');const hp=e.hp;frames(s,14);assert.equal(e.hp,hp,'the same active window cannot hit twice');
}
for(const id of [0,1,2])for(const sign of [-1,1]){
 const s=scene([id,id]),f=s.f[0],e=s.f[1];f.face=sign;f.y=e.y=-150;f.meter=100;f.dir=[-sign,0];f.motions=[{dx:0,dy:1,t:0},{dx:-sign,dy:0,t:1}];s.frame=1;const m=E.choose(s,0,'K'),b=E.skillbox(f,m);assert(b);assert(b.top<b.bottom&&b.left<b.right);e.x=sign>0?b.right+E.combat[id].width+2:b.left-E.combat[id].width-2;assert(!E.hit(s,0,m),'outside the skill rectangle misses');e.x=f.x+sign*75;assert(E.hit(s,0,m),'inside the skill rectangle connects');e.hp=100;e.down=e.stun=0;e.y=-700;assert(!E.hit(s,0,m),'melee skills cannot hit distant heights');
 const p=E.basicGeometry(id,false,false,false),k=E.basicGeometry(id,true,false,false);assert(p.tipX<k.tipX,'fist and foot use different reach');
}
const c={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024}addEventListener(){}}};vm.createContext(c);for(const f of ['engine.js','render.js','friend.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);const R=c.window.LaboFightRender;
{
 const r=runHuman({id:2}),s=r.frames.find(s=>s.f[0].action?.airBarrage&&E.activeNow(s.f[0].action));s.showHitboxes=true;let depth=0,rects=[];const ctx=new Proxy({canvas:{width:960,height:540},save(){depth++},restore(){depth--},strokeRect(...x){rects.push(x)},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});R.draw(ctx,s);assert.equal(depth,0);assert(rects.length>=3,'hurtboxes and skill contact shape are shown');assert(c.window.LaboFriend.validState({...JSON.parse(JSON.stringify(s)),mode:'friend'}));
}
{const empty={window:{},Image:class{constructor(){this.complete=false}}};vm.createContext(empty);for(const f of ['engine.js','render.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),empty);const state=runHuman({id:2}).frames.find(s=>s.f[0].action?.rushStep&&s.f[0].action.frame>=14);const ctx=new Proxy({canvas:{width:960,height:540},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});assert.doesNotThrow(()=>empty.window.LaboFightRender.draw(ctx,state),'rush fallback also renders before artwork loads');}
{const s=scene(),m={...E.chars[0].skills[0],type:'skill',originFace:1};assert(!E.hit(s,0,m,0,{x:100,y:100,vx:9}),'projectile must overlap its own collision rectangle');}
assert(fs.readFileSync(path.join(__dirname,'../fight.js'),'utf8').includes('E.advance(state)'),'the actual 60fps game loop uses hitstop');
console.log('Tempo/hitboxes: 24 paced real-time routes with 3-frame input variation; freeze/queued attacks/up taps; active-frame pickup and single-hit limits; mirrored melee reach/height; matching training overlay/guest state passed');
