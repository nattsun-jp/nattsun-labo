/* Original animated cleaning-tool enemies and Rei's kick combat. */
window.ReiCombat=(()=>{
 const layouts={normal:[[640,1650,2250],[650,1370,2290,3080],[680,1650,2240,3430]],hard:[[310,640,1060,1650,1900,2250,2850],[310,650,1110,1370,1640,2230,2830,3160],[300,680,970,1640,1890,2240,2780,3080,3480]]};
 function fresh(difficulty,stage){return {enemies:layouts[difficulty][stage].map((x,i)=>({id:i,kind:['bucket','mop','broom'][i%3],home:x,x,y:i%3===2?325:403,w:i%3===1?30:40,h:i%3===1?65:32,hp:difficulty==='hard'?(i%3===0?3:2):(i%3===0?2:1),direction:-1,hit:0})),kills:0,kick:0,kickCooldown:0,special:0,specialCooldown:0,combo:0,deadline:0,serial:0,lastHit:[],burst:[]};}
 function combo(c,action,time,airborne){
  if(time>c.deadline)c.combo=0;
  if(action==='jump'){c.combo=1;c.deadline=time+60;return false}
  if(action==='dash'){c.combo=c.combo===1?2:0;c.deadline=time+60;return false}
  if(action==='kick'){const special=c.combo===2&&airborne&&time<=c.deadline&&c.specialCooldown<=0;c.combo=0;return special}
  c.combo=0;return false;
 }
 function kick(c,hero,facing,time){
  const special=combo(c,'kick',time,hero.jumps>0);
  if(c.kickCooldown>0&&!special)return false;
  c.kick=special?30:17;c.kickCooldown=special?40:24;c.serial++;c.lastHit=[];
  if(special){c.special=30;c.specialCooldown=480;hero.invuln=Math.max(hero.invuln,36);hero.dashTicks=30;hero.vy=Math.min(hero.vy,-3);}
  return special?'special':'kick';
 }
 function tick(c,hero,facing,time,dt,difficulty,level){
  for(const k of ['kick','kickCooldown','special','specialCooldown'])c[k]=Math.max(0,c[k]-dt);
  c.burst=c.burst.filter(p=>(p.life-=dt)>0);
  let contact=false;
  for(const e of c.enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);
   const dx=hero.x+18-e.x,active=Math.abs(dx)<(difficulty==='hard'?520:340);e.direction=active?(dx>=0?1:-1):(Math.sin(time*.015+e.id)>=0?1:-1);
   let speed=difficulty==='hard'?1.65:1.1;
   if(e.kind==='mop'&&Math.floor((time+e.id*31)/60)%3===2)speed*=1.9;
   if(e.hit<=0){let x=e.x+e.direction*speed*dt;const range=e.kind==='broom'?220:155;x=Math.max(e.home-range,Math.min(e.home+range,x));
    if(e.kind!=='broom'&&level.gaps.some(g=>x>g.x-22&&x<g.x+g.w+22))x=e.x;
    if(level.gate&&!hero.levers.every(Boolean)&&e.x<level.gate.x&&x>level.gate.x-25)x=e.x;
    e.x=x;
   }
   e.y=e.kind==='broom'?Math.max(190,Math.min(399,active?hero.y+36:325))+Math.sin(time*.05+e.id)*12:e.kind==='bucket'?403-Math.max(0,Math.sin(time*.08+e.id))*23:370;
   const hitX=hero.x+18+facing*(c.special>0?92:34),hitY=hero.y+42;
   if(c.kick>0&&!c.lastHit.includes(e.id)&&Math.abs(e.x-hitX)<(c.special>0?155:49)&&Math.abs(e.y-hitY)<(c.special>0?130:48)){
    c.lastHit.push(e.id);e.hp-=c.special>0?4:1;e.hit=25;e.x+=facing*22;
    if(e.hp<=0){c.kills++;c.burst.push({x:e.x,y:e.y,life:30});}
   }
   if(e.hp>0&&Math.abs(hero.x+18-e.x)<(e.kind==='mop'?29:33)&&Math.abs(hero.y+38-e.y)<(e.kind==='mop'?63:42))contact=true;
  }
  return contact;
 }
 function draw(ctx,c,camera,time){
  ctx.save();ctx.translate(-camera,0);
  for(const e of c.enemies){if(e.hp<=0)continue;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.hit>0?Math.sin(time*.8)*.12:Math.sin(time*.08+e.id)*.045);ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='#52445e';
   if(e.kind==='bucket'){ctx.fillStyle=e.hit>0?'#fff2c7':'#83b7c9';ctx.beginPath();ctx.moveTo(-21,-15);ctx.lineTo(21,-15);ctx.lineTo(16,17);ctx.lineTo(-16,17);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,-12,22,Math.PI,0);ctx.stroke();}
   else{ctx.strokeStyle='#a7835a';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(0,-43);ctx.lineTo(0,5);ctx.stroke();ctx.fillStyle=e.kind==='mop'?'#9acbd3':'#e8bc69';ctx.strokeStyle='#6e5971';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,-3);ctx.lineTo(12,-3);ctx.lineTo(24,25);ctx.lineTo(-24,25);ctx.closePath();ctx.fill();ctx.stroke();for(let x=-15;x<=15;x+=6){ctx.beginPath();ctx.moveTo(x,4);ctx.lineTo(x+Math.sin(time*.1+x)*4,25);ctx.stroke()}}
   ctx.fillStyle='#292439';ctx.fillRect(-10,-5,5,6);ctx.fillRect(6,-5,5,6);ctx.strokeStyle='#292439';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-6,8);ctx.lineTo(0,4);ctx.lineTo(7,8);ctx.stroke();
   for(let i=0;i<e.hp;i++){ctx.fillStyle='#f2b4c3';ctx.fillRect(-10+i*9,-54,6,4)}ctx.restore();
  }
  for(const p of c.burst){ctx.globalAlpha=p.life/30;ctx.strokeStyle='#ffdf9b';ctx.lineWidth=3;for(let i=0;i<7;i++){const a=i*Math.PI*2/7,r=35-p.life;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r);ctx.lineTo(p.x+Math.cos(a)*(r+8),p.y+Math.sin(a)*(r+8));ctx.stroke()}}ctx.restore();
 }
 return {fresh,combo,kick,tick,draw};
})();
