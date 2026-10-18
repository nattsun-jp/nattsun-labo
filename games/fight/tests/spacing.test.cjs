const assert=require('node:assert/strict');
const {E,runRoute}=require('./helpers/roster-routes.cjs');
function scene(id,enemy,sign,y=0,corner=false){const s=E.create('friend',[id,enemy]);s.phase='fight';const [a,b]=s.f;a.x=corner?(sign>0?E.arena.right-50:E.arena.left+50):600;b.x=a.x+sign*50;a.face=sign;b.face=-sign;a.y=b.y=y;return s;}
for(const id of [0,1,2])for(const enemy of [0,1,2])for(const sign of [-1,1]){
 for(const y of [0,-200])for(const corner of [false,true]){
  const s=scene(id,enemy,sign,y,corner),[a,b]=s.f;b.stun=60;E.direction(s,0,sign,0);
  for(let n=0;n<20;n++){E.step(s);assert(Math.abs(a.x-b.x)>=E.spacing.bodyGap-1e-6,'walking and aerial pursuit cannot merge torsos');assert((b.x-a.x)*sign>0,'body contact cannot silently swap sides');assert(s.f.every(f=>f.x>=E.arena.left&&f.x<=E.arena.right));}
 }
 for(const air of [false,true]){
  const s=scene(id,enemy,sign,air?-200:0),[a,b]=s.f;b.x=a.x+sign*E.spacing.bodyGap;a.dir=[sign,0];const m=E.choose(s,0,'S');assert(E.hit(s,0,m),'throws still connect at the new minimum spacing');
  const miss=scene(id,enemy,sign,air?-200:0);miss.f[0].dir=[sign,0];const grab=E.choose(miss,0,'S');miss.f[1].x=miss.f[0].x+sign*(grab.range+1);assert(!E.hit(miss,0,grab),'throws still whiff outside their exact range');
 }
 const r=runRoute({id,enemy,sign,route:'long',startDistance:140,startMeter:0});assert.equal(r.hits.length,10,'ten-hit route can start with visible space between bodies');assert(r.hits.at(-1).down>0);assert(r.frames.slice(r.hits[0].n,r.hits.at(-1).n).every(s=>s.f[1].stun>0),'wider start is one true combo');
}
console.log('Spacing: every matchup/facing, ground/air/corners, no body cross-through, reachable and whiffing throws, and 18 ten-hit real-input routes starting at distance 140 passed');
