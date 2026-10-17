const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const c={window:{},Image:class{constructor(){this.complete=false}}};vm.createContext(c);for(const f of ['engine.js','render.js','friend.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);const E=c.window.LaboFight,R=c.window.LaboFightRender;
const tick=(s,n=1)=>{for(let i=0;i<n;i++)E.step(s)};
function setup(id=0,enemy=1,sign=1){const s=E.create('training',[id,enemy]);s.phase='fight';s.infinite=false;s.f[0].x=sign>0?400:700;s.f[1].x=s.f[0].x+sign*90;s.f[0].face=sign;s.f[1].face=-sign;return s;}
for(let id=0;id<3;id++)for(const sign of [-1,1]){
 const s=setup(id,id,sign),f=s.f[0];E.direction(s,0,0,-1);tick(s,26);assert(f.y<-165,'ground jump is about twice the former 86px apex');assert.equal(f.airJumps,0,'holding up does not auto-double-jump');
 E.direction(s,0,0,0);tick(s);E.direction(s,0,0,-1);tick(s,25);assert.equal(f.airJumps,1);assert(f.y<-330,'free double jump extends height without any attack');
 E.direction(s,0,0,0);tick(s);const vy=f.vy;E.direction(s,0,0,-1);tick(s);assert(f.vy>vy,'no third jump');
 E.direction(s,0,sign,0);tick(s);E.direction(s,0,0,0);tick(s);E.direction(s,0,sign,0);tick(s);assert(f.airDashed,'free air dash remains available after double jump');assert.equal(f.airJumps,1);const x=f.x;tick(s,5);assert(sign*(f.x-x)>30);const remaining=f.airDashFrames;
 E.direction(s,0,0,0);tick(s);E.direction(s,0,sign,0);assert(f.airDashFrames<remaining,'second air dash cannot reset its duration');E.direction(s,0,0,0);tick(s,180);assert.equal(f.y,0);assert.equal(f.airJumps,0);assert(!f.airDashed);
 const d=setup(id,id,sign),g=d.f[0];E.direction(d,0,0,-1);tick(d,10);E.direction(d,0,sign,0);tick(d);E.direction(d,0,0,0);tick(d);E.direction(d,0,sign,0);tick(d);assert(g.airDashed);E.direction(d,0,0,-1);tick(d);assert.equal(g.airJumps,1,'double jump also works after air dash');assert(g.airDashed,'jump does not renew dash');assert.equal(g.airDashFrames,0);assert(g.vy<-13);
}
let peak=0;
for(let id=0;id<3;id++)for(let enemy=0;enemy<3;enemy++)for(const sign of [-1,1])for(const finish of ['throw','special']){
 const s=setup(id,enemy,sign),f=s.f[0],e=s.f[1];f.meter=100;let last=0,hits=[];
 for(let n=0;n<180;n++){
  if([0,13,42,61,83].includes(n))E.press(s,0,'P');if([52,69,94].includes(n))E.press(s,0,'K');
  if(n===26){E.direction(s,0,sign,1);E.press(s,0,'K');}if(n===38)E.direction(s,0,sign,-1);if(n===59)E.direction(s,0,0,0);if(n===60)E.direction(s,0,0,-1);
  if(n===80||n===82)E.direction(s,0,sign,0);if(n===81)E.direction(s,0,0,0);
  if(finish==='throw'&&n===105){E.direction(s,0,sign,0);E.press(s,0,'S');}
  if(finish==='special'){if(n===105)E.direction(s,0,0,1);if(n===106)E.direction(s,0,-sign,1);if(n===107){E.direction(s,0,-sign,0);E.press(s,0,'K');}if(n===108)E.direction(s,0,0,0);}
  E.step(s);peak=Math.min(peak,f.y);
  if(f.combo>last){last=f.combo;hits.push({n,y:f.y,enemyY:e.y,name:f.action?.name,down:e.down,stun:e.stun});}
  for(const [w,h,phone] of [[960,540,false],[844,390,true],[390,320,true]]){const cam=R.camera(s,w,h,phone);for(const who of s.f){const box=E.hurtbox(who);assert(box.top*cam.scale+cam.oy>=0,'heads remain in frame');assert(box.bottom*cam.scale+cam.oy<=h,'feet remain in frame');}}
 }
 assert.equal(hits.length,10,JSON.stringify({id,enemy,sign,finish,hits}));assert(hits[8].y<hits[4].y-180,'jump/dash extensions carry the combo higher');assert(hits.at(-1).down>0&&hits.at(-1).stun===0,'both finishers cause hard knockdown');assert.equal(hits.at(-1).name,finish==='throw'?'空中投げ':E.comboStyles[id].finisher);
 assert(c.window.LaboFriend.validState({...JSON.parse(JSON.stringify(s)),mode:'friend'}));
}
// The projectile extension must connect at the new high altitude, then grant JC.
for(let id=0;id<3;id++)for(let enemy=0;enemy<3;enemy++)for(const sign of [-1,1]){
 const s=setup(id,enemy,sign),f=s.f[0];f.meter=100;let jumped=false;
 for(let n=0;n<90;n++){
  if(n===0){E.direction(s,0,sign,1);E.press(s,0,'K');}if(n===12)E.direction(s,0,sign,-1);if(n===16)E.press(s,0,'P');if(n===26)E.press(s,0,'K');
  if(n===37)E.direction(s,0,0,1);if(n===38)E.direction(s,0,sign,1);if(n===39){E.direction(s,0,sign,0);E.press(s,0,'P');}if(n===40)E.direction(s,0,0,0);
  if(!jumped&&f.action?.airSpecial&&f.action.confirmed){E.direction(s,0,0,-1);jumped=true;}E.step(s);
 }
 assert.equal(f.combo,4);assert(jumped);assert.equal(f.airJumps,1,'a real air special hit grants the remaining double-jump cancel');
}
console.log('Aerial movement: free double jump, held/third-jump rejection, independent air dash budgets, landing reset; 36 real-input rising routes with throw/special knockdown; cameras/guest state passed. Peak:',Math.round(-peak));
