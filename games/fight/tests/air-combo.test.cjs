const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),sandbox={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1254}addEventListener(){}}};vm.createContext(sandbox);
for(const file of ['engine.js','animation-data.js','render.js','friend.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
const E=sandbox.window.LaboFight,R=sandbox.window.LaboFightRender;
function state(id=0,sign=1){const s=E.create('training',[id,id]);s.phase='fight';s.infinite=false;s.drill='airCombo';s.f[0].x=sign>0?300:600;s.f[1].x=s.f[0].x+sign*90;s.f[0].face=sign;s.f[1].face=-sign;return s}
const tick=(s,n)=>{for(let i=0;i<n;i++)E.step(s)};
for(let id=0;id<3;id++)for(const sign of [-1,1])for(const route of [['P','P','K'],['P','K','K'],['K','K','K']]){
 const s=state(id,sign);
 for(let n=0;n<80;n++){
  if(n===0)E.press(s,0,route[0]);if(n===13)E.press(s,0,route[1]);if(n===26)E.press(s,0,route[2]);
  if(n===37){assert.equal(s.f[0].action.launcher,true);assert.equal(s.f[0].combo,3);assert(s.f[1].y<0);assert.equal(s.complete,false,'ground hits alone do not complete aerial drill')}
  if(n===38)E.direction(s,0,sign,-1);if(n===42)E.press(s,0,'P');if(n===52)E.press(s,0,'K');E.step(s);
 }
 assert.equal(s.f[0].combo,5,'P/K-only route continues through launcher into two air hits');assert(s.complete);assert(!s.f[0].history.some(h=>h.text==='S'));
}
{
 const s=state(),f=s.f[0];for(const mode of ['crouch','air']){f.chain=2;f.lastBasic=s.frame;f.y=mode==='air'?-40:0;f.dir=[0,mode==='crouch'?1:0];assert.equal(E.choose(s,0,'K').launcher,false,'crouch/air third kick remains its dedicated attack')}
 const g=state();g.mode='friend';g.f[1].dir=[1,0];for(let n=0;n<40;n++){if([0,13,26].includes(n))E.press(g,0,'K');E.step(g)}assert.equal(g.f[1].hp,100);assert.equal(g.f[1].y,0,'blocked third kick does not launch');assert.equal(g.f[0].action.confirmed,undefined);
}
for(let id=0;id<3;id++)for(const sign of [-1,1]){
 const s=state(id,sign);E.direction(s,0,0,1);E.press(s,0,'S');tick(s,11);assert(s.f[1].y<0);assert(s.f[0].action.confirmed);assert(s.f[0].meter>=12,'launcher works at zero meter and gains meter on hit');
 E.direction(s,0,sign,-1);tick(s,4);assert(s.f[0].y<0,'hit-confirm jump cancel leaves the ground');assert.equal(s.f[0].action,null);
 E.press(s,0,'P');tick(s,10);assert.equal(s.f[0].action.type,'basic','launcher input is consumed, not mistaken for a fireball');assert.equal(s.f[0].combo,2);
 E.press(s,0,'K');tick(s,12);assert.equal(s.f[0].combo,3);assert(s.complete,'air-combo drill recognizes the actual connected sequence');assert.equal(s.f[0].comboDamage,23);
 const f=s.f[0];E.direction(s,0,0,0);tick(s,1);E.direction(s,0,0,-1);tick(s,1);assert.equal(f.airJumps,1,'one extra hit-confirm aerial jump');
 f.action={...E.choose(s,0,'P'),confirmed:true,frame:8};f.jumpCancelUntil=s.frame+20;E.direction(s,0,0,0);tick(s,1);const vy=f.vy;E.direction(s,0,0,-1);tick(s,1);assert(f.vy>vy,'second extra aerial jump is not allowed');
 assert(sandbox.window.LaboFriend.validState({...JSON.parse(JSON.stringify(s)),mode:'friend'}),'new state remains accepted by guest validation');
 f.action=null;E.direction(s,0,0,0);tick(s,120);assert.equal(f.y,0);assert.equal(f.airJumps,0);assert.equal(f.airChain,0);assert.equal(s.f[1].juggleHits,0);
}
for(const guard of [false,true]){
 const s=state(),f=s.f[0],e=s.f[1];s.mode='friend';if(guard)e.dir=[1,0];else e.x=900;
 E.direction(s,0,0,1);E.press(s,0,'S');tick(s,11);const hp=e.hp;E.direction(s,0,0,-1);tick(s,1);
 assert.equal(f.y,0,'whiff/block never grants jump cancel');assert(!f.action.confirmed);assert.equal(e.y,0);if(guard)assert.equal(hp,100);
}
{
 const s=state(),f=s.f[0],e=s.f[1];f.y=e.y=-100;f.dir=[0,0];f.motions=[];e.x=365;
 const attack=E.choose(s,0,'P');for(let i=0;i<6;i++)assert(E.hit(s,0,attack));const hp=e.hp;assert.equal(E.hit(s,0,attack),false,'seventh airborne hit cannot restart a juggle');assert.equal(e.hp,hp);
}
{
 const s=state(),f=s.f[0];s.f[1].x=900;f.y=-80;f.dir=[0,0];E.press(s,0,'P');tick(s,2);E.press(s,0,'K');tick(s,10);assert.equal(f.action.kind,'punch','air whiff does not cancel to another attack');
}
const data=sandbox.window.LaboFighterAnimations;assert.equal(data.sheets.length,9);
for(const sheet of data.sheets){assert(sheet.parts.every(file=>fs.existsSync(path.join(root,file))));assert.equal(sheet.frames.length,16);for(const frame of sheet.frames){assert(frame.clipRuns.length>0);const [x,y,w,h]=frame.bbox;assert(x>=0&&y>=0&&x+w<=sheet.width&&y+h<=sheet.height)}}
for(let id=0;id<3;id++){
 const s=state(id),f=s.f[0];const check=(category,row)=>{const pose=R.animationPose(f,s.frame);assert.equal(pose.category,category);assert.equal(pose.row,row)};
 check('locomotion',0);f.walking=true;check('locomotion',1);f.walking=false;f.dash=12;check('locomotion',2);f.dash=0;f.y=-40;check('locomotion',3);
 for(const b of ['P','K']){f.dir=[0,0];f.action=E.choose(s,0,b);check('air-combo',b==='P'?0:1)}
 f.y=0;f.dir=[0,1];f.action=E.choose(s,0,'S');check('air-combo',2);f.action=null;f.y=-60;f.stun=20;check('air-combo',3);
 let depth=0,draws=[];const c=new Proxy({canvas:{width:960,height:540},save(){depth++},restore(){depth--},drawImage(...args){draws.push(args)},createLinearGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});
 R.draw(c,s);assert.equal(depth,0);assert(draws.some(args=>args[0].src.includes('animation-v2')),'new artwork is drawn');
}
console.log('Air combo: all characters and facings, hit-confirm/whiff/block, launch-input consumption, aerial jumps, juggle cap, landing reset, guest state and 144 sprite bounds passed');
