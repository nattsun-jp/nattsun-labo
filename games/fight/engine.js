/* NattsunLABO's original fighting simulation. No network or billing dependencies. */
window.LaboFight=(()=>{
 'use strict';
 const chars=[
  {id:'rei',name:'月城麗',color:'#97a9e3',label:'月光の連撃',skills:[
   {name:'月光拳',cost:30,start:7,end:40,hits:[8,14,20,26,32],damage:5,range:114,kind:'rush'},
   {name:'月光旋風脚',cost:30,start:6,end:42,hits:[8,18,28],damage:8,range:110,kind:'spin',speed:6},
   {name:'月光波紋疾走',cost:100,start:12,end:76,hits:[16,25,34,43,52],damage:10,range:150,kind:'orbit'},
   {name:'月光韻波句徒',cost:100,start:14,end:72,hits:[18,29,40,51],damage:12,range:175,kind:'impact'}]},
  {id:'nuts',name:'ナッツんjp',color:'#f0c25c',label:'落花生の底力',skills:[
   {name:'落花生爆弾',cost:30,start:14,end:42,hits:[16],damage:22,range:0,kind:'bomb'},
   {name:'落花生回転',cost:30,start:6,end:45,hits:[9,21],damage:12,range:102,kind:'roll',speed:6.5},
   {name:'落花生の中からこんにちは。',cost:100,start:27,end:70,hits:[30],damage:48,range:195,kind:'giant'},
   {name:'落花生だって負けない！',cost:100,start:5,end:46,hits:[],damage:0,range:0,kind:'power'}]},
  {id:'chappy',name:'チャッピー',color:'#63d4d0',label:'電気と叡智の使い手',skills:[
   {name:'プラグイン',cost:30,start:12,end:39,hits:[15],damage:24,range:230,kind:'cable'},
   {name:'電気ビリビリ',cost:30,start:10,end:42,hits:[14],damage:27,range:105,kind:'shock'},
   {name:'データ収集',cost:100,start:38,end:78,hits:[42],damage:50,range:145,kind:'data',unblockable:true},
   {name:'叡智の集合体',cost:100,start:5,end:46,hits:[],damage:0,range:0,kind:'reach'}]}
 ];
 // Limb anchors in world pixels, aligned with each character's drawn fist / toe.
 const combat=[
  {height:266,crouch:172,width:32,speed:2.8,jumpSpeed:4.9,punch:{x:128,y:-208,rx:20,ry:22},kick:{x:180,y:-185,rx:24,ry:24}},
  {height:232,crouch:172,width:40,speed:2.45,jumpSpeed:4.5,punch:{x:111,y:-151,rx:24,ry:26},kick:{x:145,y:-153,rx:27,ry:27}},
  {height:266,crouch:185,width:30,speed:2.65,jumpSpeed:5.1,punch:{x:132,y:-204,rx:18,ry:20},kick:{x:200,y:-181,rx:22,ry:22}}
 ];
 function basicGeometry(id,kick,low,high,chain=1){const limb=combat[id][kick?'kick':'punch'],sx=(low||high)?0.62:1,sy=low?0.35:high?0.65:1;return {tipX:limb.x*sx+(chain-1)*4,tipY:limb.y*sy,rx:limb.rx,ry:limb.ry,sx,sy};}
 function hurtbox(f){const p=combat[f.id],m=f.action,crouching=f.y===0&&(f.dir[1]>0||m?.low),height=crouching?p.crouch:p.height;return {left:f.x-p.width,right:f.x+p.width,top:440+f.y-height,bottom:440+f.y};}
 function attackbox(f,m){if(m?.type!=='basic')return null;const reach=f.reach||1,tip=m.tipX*reach,back=Math.max(16,tip*.35),a=f.x+m.originFace*back,b=f.x+m.originFace*(tip+m.rx),cy=440+f.y+m.tipY;return {left:Math.min(a,b),right:Math.max(a,b),top:cy-m.ry,bottom:cy+m.ry,x:f.x+m.originFace*tip,y:cy};}
 const overlaps=(a,b)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;
 const locked=f=>f.stun>0||f.down>0||f.wakeup>0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function fighter(id,x){return {id,x,y:0,vy:0,hp:100,pink:100,meter:0,wins:0,face:x<480?1:-1,dir:[0,0],previousY:0,airVx:0,walkPhase:0,walking:false,dash:0,dashDx:0,airDashed:false,tap:null,down:0,wakeup:0,stun:0,action:null,queue:[],motions:[],history:[],lastDir:'',chain:0,lastBasic:-100,power:1,reach:1,slow:1,combo:0,comboDamage:0,comboUntil:0,damageTaken:0,lastMove:'',aiAt:0,guardTicks:0};}
 function create(mode='cpu',ids=[0,1]){return {mode,ids:[...ids],f:[fighter(ids[0],315),fighter(ids[1],645)],frame:0,time:99,phase:'intro',phaseTicks:100,round:1,winner:null,effects:[],projectiles:[],events:[],dummy:'stand',infinite:true,drill:'free',complete:false,rng:192731,inputSeq:0,showHitboxes:false};}
 function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
 function emit(s,type,text,side){s.events.push({type,text,side,frame:s.frame});if(s.events.length>12)s.events.shift();}
 function direction(s,side,dx,dy){const f=s.f[side];dx=clamp(dx,-1,1);dy=clamp(dy,-1,1);const changed=dx!==f.dir[0]||dy!==f.dir[1];
  if(changed&&dx!==0&&s.phase==='fight'){const tap=f.tap;if(tap&&tap.dx===dx&&tap.dy===dy&&s.frame-tap.t<=16&&s.frame>tap.t&&!locked(f)&&!f.action&&!(f.y<0&&f.airDashed)){f.dash=14;f.dashDx=dx;if(f.y<0){f.airDashed=true;f.airVx=dx*7.5;}emit(s,'move','ダッシュ',side);f.tap=null;}else f.tap={dx,dy,t:s.frame};}
  f.dir=[dx,dy];const value=(dy<0?'↑':dy>0?'↓':'')+(dx<0?'←':dx>0?'→':'');if(value&&value!==f.lastDir){f.motions.push({dx,dy,t:s.frame,face:f.face});f.motions=f.motions.filter(m=>s.frame-m.t<75).slice(-14);f.history.push({text:value,t:s.frame});if(f.history.length>18)f.history.shift();}f.lastDir=value;
 }
 function press(s,side,button){if(!['P','K','S'].includes(button)||s.phase==='match')return;const f=s.f[side];f.history.push({text:button,t:s.frame});if(f.history.length>18)f.history.shift();f.queue.push({button,t:s.frame});f.queue=f.queue.slice(-3);}
 function motion(f,seq,time){const list=f.motions.filter(m=>time-m.t<=65);let cursor=seq.length-1,face=f.face;for(let i=list.length-1;i>=0&&cursor>=0;i--){const m=list[i],symbol=m.dy>0?'D':m.dx*face>0?'F':m.dx*face<0?'B':null;if(symbol===seq[cursor])cursor--;else if(symbol&&symbol!==seq[cursor+1])return false;}return cursor<0;}
 function choose(s,side,button){const f=s.f[side],e=s.f[1-side],skills=chars[f.id].skills;let index=-1;
  if(button==='S'){if(motion(f,['F','D','B'],s.frame))index=2;else if(motion(f,['B','D','F'],s.frame))index=3;else if(f.dir[0]!==0&&f.dir[1]===0){f.motions=[];const air=f.y<0;return {name:air?'空中投げ':'投げ',type:'throw',kind:'throw',start:4,end:32,hits:[6],damage:air?24:16,range:air?90:80,air,throwDx:f.dir[0],swap:f.dir[0]*f.face<0,unblockable:true,frame:0,hit:[],originFace:f.face};}else{emit(s,'hint','投げは左右＋S / 超必殺はコマンド＋S',side);return null;}}
  else if(button==='P'&&motion(f,['D','F'],s.frame))index=0;
  else if(button==='K'&&motion(f,['D','B'],s.frame))index=1;
  if(index>=0){const m=skills[index];if(f.meter<m.cost){emit(s,'hint',index>=2?'ゲージMAXで発動できます':'スキルゲージが足りません',side);return null;}f.meter-=m.cost;f.motions=[];return {...m,type:'skill',index,frame:0,hit:[],originFace:f.face,connected:false};}
  const chain=s.frame-f.lastBasic<48?f.chain%3+1:1;f.chain=chain;f.lastBasic=s.frame;const kick=button==='K';const low=f.dir[1]>0&&f.y===0,high=f.y<0;
  const geometry=basicGeometry(f.id,kick,low,high,chain);
  return {...geometry,name:(low?'しゃがみ':high?'ジャンプ':'')+(kick?'キック':'パンチ')+(chain>1?' '+chain:' '),type:'basic',kind:kick?'kick':'punch',start:chain===3?8:5,end:chain===3?30:21,hits:[chain===3?10:7],damage:(kick?9:6)+(chain-1)*2,range:geometry.tipX+geometry.rx,low,high,frame:0,hit:[],originFace:f.face};
 }
 function startMove(s,side,m){const f=s.f[side];if(!m)return;f.action=m;f.dash=0;f.lastMove=m.name;emit(s,m.type==='skill'&&m.index>=2?'super':'move',m.name,side);if(m.kind==='power')f.power=1.5;if(m.kind==='reach')f.reach=1.6;
  if(s.mode==='training'&&side===0){const target={special1:0,special2:1,super1:2,super2:3}[s.drill];if(target===m.index&&m.type==='skill')s.complete=true;}
 }
 function canGuard(f,from,m){return !m.unblockable&&f.y===0&&!f.action&&!locked(f)&&f.dir[0]*(from.x>f.x?-1:1)>0&&(m.low?f.dir[1]>0:m.high?f.dir[1]<=0:true);}
 function hit(s,side,m,range=m.range){const f=s.f[side],e=s.f[1-side];if(e.hp<=0||e.down>0)return false;const dx=e.x-f.x,omni=['shock','orbit','data'].includes(m.kind),reach=m.type==='basic'||m.index<2?f.reach:1;let contact;
  if(m.type==='basic'){const box=attackbox(f,m),body=hurtbox(e);if(!overlaps(box,body))return false;contact={x:clamp(box.x,body.left,body.right),y:clamp(box.y,body.top,body.bottom)};}
  else if(m.kind==='throw'){if(Math.abs(dx)>range||m.air!==(f.y<0)||m.air!==(e.y<0)||Math.abs(f.y-e.y)>(m.air?75:10)||locked(e)||e.action?.type==='throw')return false;}
  else if(Math.abs(dx)>range*reach||(!omni&&dx*m.originFace<-15)||Math.abs(f.y-e.y)>100)return false;
  const continuing=e.stun>0&&s.frame<=f.comboUntil,guard=canGuard(e,f,m),damage=guard?Math.max(1,Math.round(m.damage*.18)):Math.round(m.damage*(m.type==='basic'||m.index<2?f.power:1));
  e.hp=clamp(e.hp-damage,0,100);e.damageTaken+=damage;e.stun=guard?7:m.type==='basic'?20:22;e.action=null;e.queue=[];e.dash=0;e.wakeup=0;
  if(!guard){f.combo=continuing?f.combo+1:1;f.comboDamage=continuing?f.comboDamage+damage:damage;f.comboUntil=s.frame+65;
   if(m.kind==='throw'){const oldX=f.x,enemyX=e.x,sign=Math.sign(dx||f.face);if(m.swap){f.x=clamp(enemyX,65,895);e.x=clamp(oldX-sign*42,65,895);}else e.x=clamp(enemyX+sign*110,65,895);e.down=30;e.stun=0;e.vy=m.air?6:0;e.airVx=0;f.face=e.x>=f.x?1:-1;e.face=-f.face;m.originFace=f.face;contact={x:e.x,y:440+e.y-45};}
   else e.x=clamp(e.x+Math.sign(dx||f.face)*(m.type==='basic'?5:12),65,895);
  }
  if(m.kind==='impact'&&!m.connected&&!guard){e.x=f.face>0?885:75;m.connected=true;}
  if(m.kind==='data')f.slow=.65;
  if(m.type==='basic')f.meter=clamp(f.meter+(guard?3:12),0,100);else if(m.index<2){const gain=Math.min(6,18-(m.gained||0));m.gained=(m.gained||0)+gain;f.meter=clamp(f.meter+gain,0,100);}
  s.effects.push({x:contact?.x??e.x,y:contact?.y??440+e.y-132,kind:guard?'guard':m.kind,life:20,side});emit(s,guard?'guard':'hit',guard?'GUARD':damage+' DAMAGE',1-side);
  if(s.mode==='training'&&side===0){if(s.drill==='combo'&&f.combo>=3)s.complete=true;if(s.drill==='throw'&&m.kind==='throw')s.complete=true;}
  return true;
 }
 function cpu(s){const f=s.f[1],e=s.f[0];if(s.mode==='training'&&s.dummy!=='cpu'){direction(s,1,s.dummy==='guard'?-f.face:0,0);return;}
  if(s.frame<f.aiAt)return;f.aiAt=s.frame+12+Math.floor(random(s)*12);const dist=Math.abs(e.x-f.x);if(e.action&&random(s)<.32){direction(s,1,-f.face,e.action.low?1:0);return;}
  direction(s,1,dist>105?f.face:0,0);if(f.action||locked(f))return;
  if(dist<180&&f.meter>=100&&random(s)<.12){const i=Math.floor(random(s)*2)+2;f.meter-=100;startMove(s,1,{...chars[f.id].skills[i],type:'skill',index:i,frame:0,hit:[],originFace:f.face});return;}
  if(dist<170&&f.meter>=30&&random(s)<.2){const i=random(s)<.5?0:1;f.meter-=30;startMove(s,1,{...chars[f.id].skills[i],type:'skill',index:i,frame:0,hit:[],originFace:f.face});return;}
  if(dist<65&&f.y===0&&e.y===0&&random(s)<.15){direction(s,1,random(s)<.5?f.face:-f.face,0);press(s,1,'S');return;}
  if(dist<155&&random(s)<.8)press(s,1,random(s)<.5?'P':'K');if(dist>160&&random(s)<.12)direction(s,1,f.face,-1);
 }
 function resetRound(s){const wins=s.f.map(f=>f.wins);s.f=[fighter(s.ids[0],315),fighter(s.ids[1],645)];s.f.forEach((f,i)=>f.wins=wins[i]);s.time=99;s.projectiles=[];s.effects=[];s.phase='intro';s.phaseTicks=90;s.round=wins[0]+wins[1]+1;}
 function endRound(s){const a=s.f[0],b=s.f[1];const winner=a.hp===b.hp?null:a.hp>b.hp?0:1;s.winner=winner;if(winner!==null)s.f[winner].wins++;s.phase=s.f.some(f=>f.wins>=2)?'match':'round';s.phaseTicks=150;emit(s,'round',winner===null?'DRAW':chars[s.f[winner].id].name+' WIN',winner);}
 function step(s){s.frame++;s.effects=s.effects.filter(e=>--e.life>0);if(s.phase==='match')return;if(s.phase==='intro'){if(--s.phaseTicks<=0)s.phase='fight';return;}if(s.phase==='round'){if(--s.phaseTicks<=0)resetRound(s);return;}
  if(s.mode!=='friend')cpu(s);if(s.mode!=='training')s.time=Math.max(0,s.time-1/60);
  for(let side=0;side<2;side++){const f=s.f[side],e=s.f[1-side];f.face=f.action?f.action.originFace:e.x>=f.x?1:-1;f.meter=clamp(f.meter+1/60,0,100);if(s.mode==='training'&&s.infinite&&side===0)f.meter=100;f.stun=Math.max(0,f.stun-1);f.wakeup=Math.max(0,f.wakeup-1);if(f.down>0&&f.y===0&&--f.down===0)f.wakeup=10;f.pink=Math.max(f.hp,f.pink-(s.frame%2?.2:.45));
   if(s.mode==='training'&&e.hp<100&&!locked(e)&&!f.action&&s.frame>f.comboUntil){e.hp=e.pink=100;}
   const profile=combat[f.id];f.walking=false;if(!locked(f)&&!f.action){const frozenDummy=s.mode==='training'&&side===1&&s.dummy!=='cpu';
    if(f.dir[1]<0&&f.previousY>=0&&f.y===0){f.vy=-10;f.airVx=f.dir[0]*profile.jumpSpeed;f.airDashed=false;}
    if(!frozenDummy){const crouch=f.dir[1]>0&&f.y===0,velocity=f.dash>0?f.dashDx*7.5*f.slow:f.y<0?(f.dir[0]?f.dir[0]*profile.jumpSpeed:f.airVx)*f.slow:crouch?0:f.dir[0]*profile.speed*f.slow;const beforeX=f.x;f.x=clamp(f.x+velocity,65,895);if(f.y===0&&f.vy===0&&!crouch&&Math.abs(f.x-beforeX)>.01){f.walking=true;f.walkPhase=(f.walkPhase+Math.abs(f.x-beforeX)/22)%4;}}
   }else f.dash=0;
   f.dash=Math.max(0,f.dash-1);f.previousY=f.dir[1];f.vy+=.55;f.y=Math.min(0,f.y+f.vy);if(f.y===0){f.vy=0;f.airVx=0;f.airDashed=false;}
   f.queue=f.queue.filter(q=>s.frame-q.t<40);const cancellable=f.action?.type==='basic'&&f.action.frame>=12&&f.chain<3;
   if(f.queue.length&&!locked(f)&&(!f.action||cancellable)){const q=f.queue.shift();startMove(s,side,choose(s,side,q.button));}
   const m=f.action;if(m){m.frame++;if(m.speed&&m.frame>=m.start&&m.frame<m.end-8)f.x=clamp(f.x+m.originFace*m.speed,65,895);
    if(m.kind==='orbit'&&m.frame>=m.start&&m.frame<60){f.x=clamp(e.x+Math.cos(m.frame*.3)*85,65,895);f.y=-Math.abs(Math.sin(m.frame*.3))*45;}
    if(m.hits.includes(m.frame)&&!m.hit.includes(m.frame)){m.hit.push(m.frame);if(m.kind==='bomb'){s.projectiles.push({x:f.x+f.face*35,y:440+f.y-80,v:f.face*7,side,life:90,m:{...m,range:75}});}else hit(s,side,m,m.kind==='impact'&&m.connected?960:m.range);}
    if(m.frame>=m.end)f.action=null;
   }
  }
  // Body collision keeps fighters apart on the ground, while jumps allow cross-ups.
  const a=s.f[0],b=s.f[1];if(Math.abs(a.x-b.x)<50&&a.y===0&&b.y===0&&!a.action?.kind?.includes('orbit')&&!b.action?.kind?.includes('orbit')){const push=(50-Math.abs(a.x-b.x))/2,sign=a.x<=b.x?1:-1;a.x=clamp(a.x-sign*push,65,895);b.x=clamp(b.x+sign*push,65,895);if(Math.abs(a.x-b.x)<50){if(a.x<=65||a.x>=895)b.x=clamp(a.x+sign*50,65,895);else a.x=clamp(b.x-sign*50,65,895);}}
  for(const p of s.projectiles){p.x+=p.v;p.life--;const enemy=s.f[1-p.side];if(Math.abs(enemy.x-p.x)<42&&Math.abs(440+enemy.y-65-p.y)<75){const owner=s.f[p.side],saved=owner.x;owner.x=p.x-p.v;hit(s,p.side,p.m,75);owner.x=saved;p.life=0;}if(p.life<=0)s.effects.push({x:p.x,y:p.y,kind:'bomb',life:24,side:p.side});}s.projectiles=s.projectiles.filter(p=>p.life>0&&p.x>0&&p.x<960);
  if(s.mode!=='training'&&(s.time<=0||s.f.some(f=>f.hp<=0)))endRound(s);
 }
 return {combat,basicGeometry,hurtbox,attackbox,chars,create,direction,press,step,choose,startMove,canGuard,hit,resetRound};
})();
