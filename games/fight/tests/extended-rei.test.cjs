const assert=require('node:assert/strict');
const {E,runExtendedRei}=require('./helpers/extended-rei-route.cjs');
for(const enemy of [0,1,2])for(const sign of [-1,1])for(const jitter of [0,3]){
 const r=runExtendedRei({enemy,sign,jitter});assert.equal(r.hits.length,34);assert.equal(r.hits.at(-1).count,34);assert.equal(r.hits.at(-1).damage,104);assert(r.hits.at(-1).down>0);assert(!r.s.infinite);
 assert.equal(r.frames[0].f[0].meter<1,true,'starts with zero meter, without training refill');assert(r.frames.every(s=>s.f[0].meter>=0&&s.f[0].meter<=100));
 assert.equal(r.hits.filter(h=>h.name==='空中定規連斬').length,3);assert.equal(r.hits.filter(h=>h.name==='月光韻波句徒').length,12);assert.equal(r.hits.filter(h=>h.name==='定規斬り上げ').length,2);
 const bounces=new Set(r.frames.flatMap(s=>s.events.filter(e=>e.text==='落月バウンド・拾い直し').map(e=>e.frame)));assert.equal(bounces.size,1);
 const first=r.hits[0].n,last=r.hits.at(-1).n;assert(r.frames.slice(first,last).every(s=>s.f[1].stun>0),'enemy never recovers anywhere in the route');
 assert(r.frames.slice(first,last).every(s=>s.f[0].combo>0&&s.f[0].combo<=34));
 const inputs=r.inputs.filter(q=>q.button&&q.button!=='S');assert(inputs.every((q,i)=>!i||q.real-inputs[i-1].real>=6),'commands are spaced in real time');
}
function scene(sign=1){const s=E.create('friend',[0,2]);s.phase='fight';s.f[0].meter=100;s.f[0].x=500;s.f[1].x=500+sign*90;s.f[0].face=sign;s.f[0].y=s.f[1].y=-100;return s;}
for(const sign of [-1,1]){
 const s=scene(sign),f=s.f[0],e=s.f[1];f.dir=[sign,0];f.motions=[{dx:0,dy:1,t:0},{dx:sign,dy:0,t:1}];s.frame=1;const fall=E.choose(s,0,'K');assert(fall.reboundSlash&&fall.cost===0);const meter=f.meter;assert(E.hit(s,0,fall));assert(f.reboundUsed);assert.equal(f.meter,meter);assert.equal(e.reboundFrom,0);
 f.motions=[{dx:0,dy:1,t:0},{dx:sign,dy:0,t:1}];assert.equal(E.choose(s,0,'K'),null,'a second falling extension cannot loop');
 const whiff=scene(sign);whiff.f[1].x=500+sign*300;assert(!E.hit(whiff,0,{...fall,originFace:sign}));assert(!whiff.f[0].reboundUsed);
 const guard=scene(sign);guard.f[0].y=guard.f[1].y=0;guard.f[1].dir=[sign,0];assert(E.hit(guard,0,{...fall,originFace:sign}));assert.equal(guard.f[1].hp,100);assert(!guard.f[0].reboundUsed);assert.equal(guard.f[1].reboundFrom,null);
 const superState=scene(sign),superMove={...E.chars[0].skills[3],type:'skill',frame:10,originFace:sign};superState.f[1].x=500+sign*191;assert(!E.hit(superState,0,superMove),'super cannot catch a target outside 190');superState.f[1].x=500+sign*190;assert(E.hit(superState,0,superMove));superState.f[1].x=500+sign*400;assert(!E.hit(superState,0,superMove),'confirmed super never turns into an arena-wide hitbox');
 for(const budget of ['juggleMax','comboMax']){const t=scene(sign),a=t.f[0],b=t.f[1],limits=E.comboLimits(0);b.stun=30;a.comboUntil=70;a.combo=budget==='comboMax'?limits.comboMax-1:5;a.comboAirHits=budget==='juggleMax'?limits.juggleMax-1:0;assert(E.hit(t,0,{...superMove}));assert(b.down>0);const hp=b.hp;assert(!E.hit(t,0,{...superMove}));assert.equal(b.hp,hp);}
}
assert.equal(E.comboLimits(1).comboMax,18);assert.equal(E.comboLimits(2).juggleMax,12);
console.log('Extended Rei: 12 real-time 34-hit routes from zero meter, ±3-frame inputs, uninterrupted hitstun; one rebound, whiff/guard, real finisher range and both shared caps passed');
