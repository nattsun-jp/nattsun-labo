const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c={window:{}};vm.createContext(c);for(const file of ['engine.js','friend.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);const E=c.window.LaboFight;
function setup(id=0,enemy=1,sign=1){const s=E.create('training',[id,enemy]);s.phase='fight';s.infinite=false;s.f[0].x=sign>0?400:700;s.f[1].x=s.f[0].x+sign*90;s.f[0].face=sign;s.f[1].face=-sign;return s;}
const tick=(s,n)=>{for(let i=0;i<n;i++)E.step(s);};
function longRoute(id,enemy,sign,spike=false){const s=setup(id,enemy,sign);s.drill=spike?'airDash':'airThrow';const hits=[];let count=0,maxHeight=0;
 for(let n=0;n<150;n++){
  if([0,13,42,61,83].includes(n))E.press(s,0,'P');if([52,69,94].includes(n))E.press(s,0,'K');
  if(n===26){E.direction(s,0,sign,1);E.press(s,0,'K');}if(n===38)E.direction(s,0,sign,-1);if(n===59)E.direction(s,0,0,0);if(n===60)E.direction(s,0,0,-1);
  if(n===80||n===82)E.direction(s,0,sign,0);if(n===81)E.direction(s,0,0,0);
  if(n===105){E.direction(s,0,spike?0:sign,spike?1:0);E.press(s,0,spike?'K':'S');}
  E.step(s);if(s.f[0].combo>count){count=s.f[0].combo;hits.push({frame:n,count,damage:s.f[0].comboDamage,move:s.f[0].action?.name,airJumps:s.f[0].airJumps,airDashed:s.f[0].airDashed,air:s.f.every(f=>f.y<0),stun:s.f[1].stun});}
  maxHeight=Math.min(maxHeight,s.f[0].y);
 }
 assert.equal(hits.length,10,JSON.stringify({id,enemy,sign,spike,hits}));assert.equal(hits.at(-1).move,spike?'空中叩き落とし':'空中投げ');assert(hits.slice(3).every(h=>h.air));assert.equal(hits[5].airJumps,1);assert(hits[7].airDashed);assert.equal(hits[8].count,9);assert(hits[8].damage-hits[7].damage<12,'late kick damage is scaled');assert(s.complete);
 assert(c.window.LaboFriend.validState({...JSON.parse(JSON.stringify(s)),mode:'friend'}));return {s,hits};}
for(let id=0;id<3;id++)for(let enemy=0;enemy<3;enemy++)for(const sign of [-1,1])for(const spike of [false,true])longRoute(id,enemy,sign,spike);
for(const sign of [-1,1])for(let enemy=0;enemy<3;enemy++){
 const s=setup(0,enemy,sign);let feinted=false,trace=[];
 for(let n=0;n<115;n++){
  if([0,30,43,72].includes(n))E.press(s,0,'P');if(n===12)E.direction(s,0,0,1);if(n===13)E.direction(s,0,sign,1);if(n===14){E.direction(s,0,sign,0);E.press(s,0,'K');}
  if(n===23){assert.equal(s.f[0].action.kind,'rulerDraw');assert(s.f[0].action.confirmed);E.press(s,0,'S');}
  if(n===24)feinted=s.f[0].action.kind==='rulerSheathe';if(n===56){E.direction(s,0,sign,1);E.press(s,0,'K');}if(n===68)E.direction(s,0,sign,-1);if(n===82)E.press(s,0,'K');E.step(s);trace.push(s.f[0].combo);
 }
 assert(feinted);assert(Math.max(...trace)>=7,'ruler hit → sheath cancel → normals → launch → aerial hits is continuous');
}
for(let id=0;id<3;id++)for(const sign of [-1,1]){
 const s=setup(id,id,sign),f=s.f[0];f.meter=100;s.drill='cancel';
 for(let n=0;n<47;n++){
  const dx=id===1?-sign:sign;
  if(n===0)E.direction(s,0,0,1);if(n===1)E.direction(s,0,dx,1);if(n===2){E.direction(s,0,dx,0);E.press(s,0,id===2?'P':'K');}
  if(n===(id===2?18:12)){assert(f.action.feint);assert(f.action.confirmed,`feint confirm ${id}/${sign}`);E.press(s,0,'S');}if(n===(id===2?26:20)){E.direction(s,0,0,0);E.press(s,0,'P');}E.step(s);
 }
 assert(s.complete);assert.equal(f.combo,2,'character-specific ground cancel connects into a normal');if(id>0)assert(f.meter<100);const used=f.feintUsed;assert(used);
 f.action={type:'skill',kind:'rulerDraw',feint:true};s.frame=50;s.f[1].stun=20;f.comboUntil=100;assert.equal(E.feintCancel(s,0),false,'cannot repeat a character cancel in the same combo after cooldown');
}
// Aerial movement cancels need a real hit, and do not refresh each other.
for(const blocked of [false,true]){
 const s=setup(),f=s.f[0];s.mode='friend';f.y=-70;f.action={...E.choose(s,0,'P'),frame:9,confirmed:blocked?false:undefined};f.jumpCancelUntil=0;
 E.direction(s,0,1,0);tick(s,1);E.direction(s,0,0,0);tick(s,1);E.direction(s,0,1,0);assert.equal(f.airDashed,false);assert(f.action,'whiff/block cannot be airdash-cancelled');
}
{
 const s=setup(),f=s.f[0];f.y=-160;f.action={...E.choose(s,0,'P'),frame:8,confirmed:true};f.jumpCancelUntil=30;E.direction(s,0,1,0);tick(s,1);E.direction(s,0,0,0);tick(s,1);E.direction(s,0,1,0);assert(f.airDashed);assert.equal(f.action,null);const jumpCount=f.airJumps;
 E.direction(s,0,0,0);tick(s,1);E.direction(s,0,1,0);assert.equal(f.airJumps,jumpCount);assert.equal(f.airDashFrames,9,'second double tap does not restart air dash');
}
// A combo throw cannot bypass other locks, floor, range or someone else's hitstun.
for(const condition of ['noCombo','guard','confusion','down','wakeup','far','height','ground']){
 const s=setup(),f=s.f[0],e=s.f[1];f.y=e.y=-100;f.dir=[1,0];e.stun=20;e.juggleHits=2;f.combo=3;f.comboUntil=60;
 if(condition==='noCombo')f.combo=0;if(condition==='guard')e.guardStun=5;if(condition==='confusion')e.confusion=5;if(condition==='down')e.down=5;if(condition==='wakeup')e.wakeup=5;if(condition==='far')e.x=f.x+150;if(condition==='height')e.y=-250;if(condition==='ground')e.y=0;
 assert.equal(E.hit(s,0,E.choose(s,0,'S')),false,condition);
}
// Every attack family spends the same aerial budget, including projectiles.
for(const family of ['basic','skill','projectile']){
 const s=setup(),f=s.f[0],e=s.f[1];f.y=e.y=-100;e.x=f.x+70;e.stun=25;e.juggleHits=11;f.comboAirHits=11;f.combo=12;f.comboUntil=70;
 const m=family==='basic'?E.choose(s,0,'P'):{...E.chars[2].skills[0],type:'skill',originFace:1};const p=family==='projectile'?{x:e.x,y:300,vx:7}:null;
 assert(E.hit(s,0,m,m.range,p));assert.equal(f.comboAirHits,12);assert(e.down>0&&e.stun===0,'budget-ending hit forces a knockdown');const hp=e.hp;assert.equal(E.hit(s,0,m,m.range,p),false);assert.equal(e.hp,hp);
 e.y=0;e.juggleHits=0;e.down=0;e.stun=10;assert.equal(E.hit(s,0,m,m.range,p),false,'landing alone does not renew the attackers combo budget');
}
// Air specials and their hit-confirm JC, plus early up input buffering.
for(let id=0;id<3;id++){
 const s=setup(id,id),f=s.f[0];f.meter=100;f.y=-100;E.direction(s,0,0,1);s.frame++;E.direction(s,0,-1,1);s.frame++;E.direction(s,0,-1,0);const m=E.choose(s,0,'K');assert(m.airSpecial);E.startMove(s,0,m);s.f[1].y=-100;assert(E.hit(s,0,m));E.direction(s,0,0,-1);tick(s,1);assert.equal(f.airJumps,1,'air special confirms into extra jump');
 const b=setup(id,id);E.press(b,0,'P');tick(b,4);E.direction(b,0,0,-1);tick(b,4);assert(b.f[0].y<0,'up buffered just before a hit confirms into jump');
}
console.log('Cancels: 36 actual 10-hit routes, 6 ruler cancel routes, character feints, input buffers, air special JC, throws, shared budgets and serialized guest states passed');
