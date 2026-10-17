/* NattsunLABO's original fighting simulation. No network or billing dependencies. */
window.LaboFight=(()=>{
 'use strict';
 const balance={maxHp:200,damageScale:.85,guardMax:100,guardBreakFrames:120,guardRecoverDelay:90,guardRecoverPerFrame:.125,juggleMax:12,comboMax:18};
 const tempo={lightStop:10,heavyStop:12,multiStop:5,guardStop:6,inputBuffer:40,jumpBuffer:10};
 const airMovement={jump:14,doubleJump:14,jumpCancel:15.5,launch:15.3,rise:5.8,gravity:.55};
 const comboStyles=[{name:'定規の斬撃連携',rise:5.8,finisher:'空中定規一閃'},{name:'落花生の空中連撃',rise:5.8,finisher:'空中落花生回転'},{name:'電撃の接近連打',rise:6.2,finisher:'空中電撃落とし'}];
 const arena={width:1200,height:675,viewTop:-100,left:65,right:1135,center:600};
 const damageFor=(m,power=1)=>m.kind==='data'?balance.maxHp*.5:Math.max(1,Math.round(m.damage*balance.damageScale*power));
 const chars=[
  {id:'rei',name:'月城麗',color:'#97a9e3',label:'月光の連撃',skills:[
   {name:'月光拳',cost:30,start:10,end:36,hits:[12],damage:24,range:0,kind:'fist',projectile:true},
   {name:'月光旋風脚',cost:30,start:6,end:42,hits:[8,18,28],damage:8,range:110,kind:'spin',speed:6},
   {name:'月光波紋疾走',cost:100,start:12,end:104,hits:[18,34,50,66,82],damage:10,range:180,kind:'orbit'},
   {name:'月光韻波句徒',cost:100,start:14,end:72,hits:[18,29,40,51],damage:12,range:175,kind:'impact'},
   {name:'月光狩り',cost:30,start:9,end:38,hits:[11],damage:22,range:0,kind:'ruler',projectile:true,antiAir:true}]},
  {id:'nuts',name:'ナッツんjp',color:'#f0c25c',label:'落花生の底力',skills:[
   {name:'落花生爆弾',cost:30,start:14,end:42,hits:[16],damage:22,range:0,kind:'bomb'},
   {name:'落花生回転',cost:30,start:6,end:45,hits:[9,21],damage:12,range:102,kind:'roll',speed:6.5},
   {name:'落花生の中からこんにちは。',cost:100,start:8,end:104,hits:[20],activeUntil:64,damage:48,range:600,verticalRange:260,kind:'giant'},
   {name:'落花生だって負けない！',cost:100,start:5,end:46,hits:[],damage:0,range:0,kind:'power'},
   {name:'落花生ロケット',cost:30,start:10,end:40,hits:[12],damage:22,range:0,kind:'bomb',projectile:true,antiAir:true}]},
  {id:'chappy',name:'チャッピー',color:'#63d4d0',label:'電気と叡智の使い手',skills:[
   {name:'プラグイン',cost:30,start:12,end:39,hits:[15],damage:24,range:230,kind:'cable'},
   {name:'電気ビリビリ',cost:30,start:10,end:42,hits:[14],damage:27,range:105,kind:'shock'},
   {name:'データ収集',cost:100,start:8,end:116,hits:[42],activeUntil:88,damage:50,range:640,verticalRange:260,kind:'data',unblockable:true},
   {name:'叡智の集合体',cost:100,start:5,end:46,hits:[],damage:0,range:0,kind:'reach'},
   {name:'撃ち落とします！',cost:30,start:8,end:37,hits:[10],damage:22,range:0,kind:'cd',projectile:true,antiAir:true}]}
 ];
 // Limb anchors in world pixels, aligned with each character's drawn fist / toe.
 const combat=[
  {height:266,crouch:172,width:32,speed:2.8,jumpSpeed:4.9,punch:{x:128,y:-208,rx:20,ry:22},kick:{x:180,y:-185,rx:24,ry:24}},
  {height:232,crouch:172,width:40,speed:2.45,jumpSpeed:4.5,punch:{x:111,y:-151,rx:24,ry:26},kick:{x:145,y:-153,rx:27,ry:27}},
  {height:266,crouch:185,width:30,speed:2.65,jumpSpeed:5.1,punch:{x:132,y:-204,rx:18,ry:20},kick:{x:200,y:-181,rx:22,ry:22}}
 ];
 function basicGeometry(id,kick,low,high,chain=1){const limb=combat[id][kick?'kick':'punch'],sx=(low||high)?0.62:1,sy=low?0.35:high?0.65:1;return {tipX:limb.x*sx+(chain-1)*4,tipY:limb.y*sy,rx:limb.rx,ry:limb.ry,sx,sy};}
 function hurtbox(f){const p=combat[f.id],m=f.action,crouching=f.y===0&&(f.dir[1]>0||m?.low),height=crouching?p.crouch:p.height;return {left:f.x-p.width,right:f.x+p.width,top:440+f.y-height,bottom:440+f.y};}
 function attackbox(f,m){if(m?.type!=='basic')return null;const reach=f.reach||1,tip=m.tipX*reach,back=m.high?12:Math.max(16,tip*.35),a=f.x+m.originFace*back,b=f.x+m.originFace*(tip+m.rx),cy=440+f.y+m.tipY;return {left:Math.min(a,b),right:Math.max(a,b),top:cy-m.ry,bottom:cy+m.ry,x:f.x+m.originFace*tip,y:cy};}
 // Rectangles are shared by contact checks and the training overlay.
 function skillbox(f,m){if(!m||m.type!=='skill'||m.cost>=100||m.projectile||m.kind==='bomb')return null;const reach=f.reach||1,range=(m.range||0)*reach;let near=12,top=-210,bottom=-70;
  if(m.rulerArt||m.kind==='rulerDraw'){near=28;top=-208;bottom=-120;}
  else if(m.airBarrage){near=8;top=-210;bottom=-65;}
  else if(m.kind==='cable'){near=24;top=-180;bottom=-100;}
  else if(m.kind==='shock'){near=m.rushStep?8:-range;top=-205;bottom=m.airFinish?-15:-45;}
  else if(m.kind==='spin'||m.kind==='roll'){near=0;top=m.airSpecial?-210:-185;bottom=-25;}
  const a=f.x+m.originFace*near,b=f.x+m.originFace*range;return {left:Math.min(a,b),right:Math.max(a,b),top:440+f.y+top,bottom:440+f.y+bottom};
 }
 const activeFrames=m=>m.activeFrames??(m.type==='basic'?(m.launcher?4:m.kind==='kick'?4:3):m.airBarrage?2:m.type==='skill'&&m.cost<100?4:1);
 const activeNow=m=>!!m&&(['giant','data'].includes(m.kind)?m.frame>=m.hits[0]&&m.frame<=m.activeUntil:(m.hits||[]).some(at=>m.frame>=at&&m.frame<at+activeFrames(m)));
 function attackboxes(f,m){if(!m)return [];const box=attackbox(f,m)||skillbox(f,m);if(box)return [box];if(m.type==='throw')return [{left:f.x-m.range,right:f.x+m.range,top:440+f.y-(m.air?105:10),bottom:440+f.y+(m.air?105:10),grab:true}];if(m.type==='skill'&&m.cost>=100&&m.range){const omni=['orbit','data'].includes(m.kind),range=m.kind==='impact'&&m.connected?arena.width:superReach(m),a=f.x+(omni?-range:-15)*m.originFace,b=f.x+range*m.originFace,h=m.verticalRange??(m.kind==='orbit'?180:100);return [{left:Math.min(a,b),right:Math.max(a,b),top:440+f.y-h,bottom:440+f.y+h,super:true}];}return [];}
 function reachGuide(s,side=0){const f=s.f[side],e=s.f[1-side],p=combat[f.id],enemy=combat[e.id],reach=f.reach||1;return {distance:Math.abs(e.x-f.x),p:p.punch.x*reach+p.punch.rx+enemy.width,k:p.kick.x*reach+p.kick.rx+enemy.width,height:p.height,ground:f.y===0&&e.y===0};}
 function impactStyle(f,m,guard){if(guard)return 'guard';if(m.rulerArt||m.kind==='rulerDraw'||m.kind==='ruler')return 'slash';if(f.id===2||['shock','cable','cd'].includes(m.kind))return 'electric';if(['orbit','fist','impact'].includes(m.kind))return 'moon';return 'strike';}
 function advance(s){s.inputFrame=(s.inputFrame??s.frame)+1;if(s.hitStopFrames>0){s.hitStopFrames--;s.effects=s.effects.filter(e=>!e.spark||--e.life>0);return;}step(s);}
 const overlaps=(a,b)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;
 const locked=f=>f.stun>0||f.down>0||f.wakeup>0||f.guardStun>0||f.confusion>0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function fighter(id,x){return {id,x,y:0,vy:0,hp:100,pink:100,maxHp:balance.maxHp,guard:balance.guardMax,guardStun:0,guardDelay:0,confusion:0,meter:0,wins:0,face:x<arena.center?1:-1,dir:[0,0],previousY:0,airVx:0,walkPhase:0,walking:false,dash:0,dashDx:0,airDashed:false,airDashFrames:0,airChain:0,airJumps:0,juggleHits:0,comboAirHits:0,wallBounceUsed:false,wallBounceFrom:null,wallBounceUntil:0,feintUsed:false,feintReadyAt:0,jumpRequestUntil:0,jumpCancelUntil:0,landing:0,airComboHits:0,launchedComboUntil:0,tap:null,down:0,wakeup:0,stun:0,action:null,queue:[],motions:[],history:[],lastDir:'',chain:0,lastBasic:-100,power:1,reach:1,slow:1,combo:0,comboDamage:0,comboUntil:0,damageTaken:0,lastMove:'',aiAt:0,guardTicks:0};}
 function create(mode='cpu',ids=[0,1]){return {mode,ids:[...ids],f:[fighter(ids[0],435),fighter(ids[1],765)],frame:0,time:99,phase:'intro',phaseTicks:100,round:1,winner:null,effects:[],projectiles:[],events:[],dummy:'stand',infinite:true,drill:'free',complete:false,rng:192731,inputSeq:0,hitStopFrames:0,showReach:true,showHitboxes:false};}
 function random(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
 function emit(s,type,text,side){s.events.push({type,text,side,frame:s.frame});if(s.events.length>12)s.events.shift();}
 function direction(s,side,dx,dy){const f=s.f[side];if(s.cinematic){f.dir=[0,0];return;}dx=clamp(dx,-1,1);dy=clamp(dy,-1,1);const changed=dx!==f.dir[0]||dy!==f.dir[1];
  if(f.confusion>0){f.dir=[0,0];return;}
  if(dy<0&&f.dir[1]>=0)f.jumpRequestUntil=s.frame+tempo.jumpBuffer;
  if(changed&&dx!==0&&s.phase==='fight'){const tap=f.tap,air=f.y<0,airCancel=air&&(f.action?.type==='basic'&&!f.action.airSpike||f.action?.airBarrage)&&f.action.confirmed&&s.frame<=f.jumpCancelUntil;if(tap&&tap.air===air&&tap.dx===dx&&tap.dy===dy&&(s.inputFrame??s.frame)-(tap.inputT??tap.t)<=22&&(s.inputFrame??s.frame)>(tap.inputT??tap.t)&&!locked(f)&&(!f.action||airCancel)&&!(air&&f.airDashed)){f.dash=14;f.dashDx=dx;if(air){f.airDashed=true;f.airVx=dx*7.5;f.vy=0;f.airDashFrames=10;if(airCancel){f.action=null;f.queue=[];f.airChain=0;f.jumpCancelUntil=0;f.motions=[];if(s.mode==='training'&&side===0&&s.drill==='airDash')s.complete=true;}}emit(s,'move',airCancel?'空中ダッシュキャンセル':air?'空中ダッシュ':'ダッシュ',side);f.tap=null;}else f.tap={dx,dy,air,t:s.frame,inputT:s.inputFrame??s.frame};}
  f.dir=[dx,dy];const value=(dy<0?'↑':dy>0?'↓':'')+(dx<0?'←':dx>0?'→':'');if(value&&value!==f.lastDir){f.motions.push({dx,dy,t:s.frame,face:f.face});f.motions=f.motions.filter(m=>s.frame-m.t<75).slice(-14);f.history.push({text:value,t:s.frame});if(f.history.length>18)f.history.shift();}f.lastDir=value;
 }
 function press(s,side,button){if(s.cinematic||!['P','K','S'].includes(button)||s.phase==='match')return;const f=s.f[side];if(f.confusion>0)return;f.history.push({text:button,t:s.frame});if(f.history.length>18)f.history.shift();f.queue.push({button,t:s.frame,dir:[...f.dir],motions:f.motions.map(m=>({...m}))});f.queue=f.queue.slice(-3);}
 function motion(f,seq,time){const list=f.motions.filter(m=>time-m.t<=65);let cursor=seq.length-1,face=f.face;for(let i=list.length-1;i>=0&&cursor>=0;i--){const m=list[i],symbol=m.dy>0?'D':m.dx*face>0?'F':m.dx*face<0?'B':null;if(symbol===seq[cursor])cursor--;else if(symbol&&symbol!==seq[cursor+1])return false;}return cursor<0;}
 function dragonMotion(f,time){const list=f.motions.filter(m=>time-m.t<=65),face=f.face;let cursor=2;const seq=['F','D','DF'];for(let i=list.length-1;i>=0&&cursor>=0;i--){const m=list[i],symbol=m.dx*face>0&&m.dy>0?'DF':m.dy>0&&m.dx===0?'D':m.dx*face>0&&m.dy===0?'F':'other';if(symbol===seq[cursor])cursor--;else if(symbol!==seq[cursor+1])return false;}return cursor<0;}
 const regular=m=>m.type==='basic'||m.type==='skill'&&m.cost<100;
 function spawnProjectile(s,side,m){const f=s.f[side],face=m.originFace,air=!!m.antiAir;const radius=air?48:m.kind==='fist'?28:20;s.projectiles.push({x:f.x+face*(m.airSpecial?36:combat[f.id].punch.x-16),y:440+f.y+(m.airSpecial?-130:combat[f.id].punch.y),vx:face*(air?7:m.kind==='fist'?9:7),vy:air?-7:0,side,life:100,rx:radius*f.reach,ry:(air?44:m.kind==='fist'?24:20)*f.reach,airOnly:air,m:{...m,hit:[],gained:0}});}
 function choose(s,side,button){const f=s.f[side],e=s.f[1-side],skills=chars[f.id].skills;let index=-1;
  if(button==='S'){if(motion(f,['F','D','B'],s.frame))index=2;else if(motion(f,['B','D','F'],s.frame))index=3;else if(f.dir[0]!==0&&f.dir[1]===0){f.motions=[];const air=f.y<0;return {name:air?'空中投げ':'投げ',type:'throw',kind:'throw',start:4,end:32,hits:[6],damage:air?24:16,range:air?112:80,air,throwDx:f.dir[0],swap:f.dir[0]*f.face<0,unblockable:true,frame:0,hit:[],originFace:f.face};}else{emit(s,'hint','打ち上げは斜め前下＋K / 投げは左右＋S',side);return null;}}
  else if(button==='K'&&f.y===0&&f.dir[1]>0&&f.dir[0]*f.face>0){f.motions=[];f.chain=0;f.lastBasic=s.frame;return {name:f.id===0?'定規斬り上げ':'打ち上げ',type:'basic',kind:'kick',launcher:true,rulerArt:f.id===0,tipX:f.id===0?144:96,tipY:-145,rx:28,ry:54,start:8,end:32,hits:[10],damage:10,range:124,frame:0,hit:[],originFace:f.face};}
  else if(button==='K'&&f.id===0&&f.y===0&&motion(f,['D','F'],s.frame)){f.motions=[];return {name:'定規抜刀',type:'skill',kind:'rulerDraw',cost:0,index:5,feint:true,start:6,end:30,hits:[8],damage:12,range:184,verticalRange:100,frame:0,hit:[],originFace:f.face};}
  else if(button==='P'&&dragonMotion(f,s.frame))index=4;
  else if(button==='P'&&motion(f,['D','F'],s.frame))index=0;
  else if(button==='K'&&motion(f,['D','B'],s.frame))index=1;
  if(index>=0){const m=skills[index];if(f.meter<m.cost){emit(s,'hint',m.cost>=100?'ゲージMAXで発動できます':'スキルゲージが足りません',side);return null;}f.meter-=m.cost;f.motions=[];const airSpecial=f.y<0&&index<2,airFinish=airSpecial&&index===1,closeRush=f.id===2&&index===1&&!airSpecial,airBarrage=f.id===2&&airSpecial&&index===0;return {...m,...(airFinish?{start:f.id===0?6:7,end:f.id===0?30:34,hits:[f.id===0?8:9],damage:24,range:f.id===0?190:140,verticalRange:150,speed:0}:{}),...(airBarrage?{start:5,end:30,hits:[7,13,19],damage:6,range:120,verticalRange:135}:{}),...(closeRush?{speed:4,rushStep:true,wallCarry:true}:{}),rulerArt:airFinish&&f.id===0,airBarrage,airFinish,name:airFinish?comboStyles[f.id].finisher:airBarrage?'空中プラグイン連打':(airSpecial?'空中':'')+m.name,type:'skill',index,airSpecial,feint:f.y===0&&(f.id===1&&index===1||f.id===2&&index===0),frame:0,hit:[],originFace:f.face,connected:false};}
  const chain=s.frame-f.lastBasic<48?f.chain%3+1:1;f.chain=chain;f.lastBasic=s.frame;const kick=button==='K';const low=f.dir[1]>0&&f.y===0,high=f.y<0;
  if(high)f.airChain=(f.airChain||0)+1;
  if(high&&kick&&f.dir[1]>0)return {name:'空中叩き落とし',type:'basic',kind:'kick',high:true,airSpike:true,tipX:110,tipY:-65,rx:32,ry:48,start:7,end:32,hits:[9],damage:16,range:142,frame:0,hit:[],originFace:f.face};
  const geometry=basicGeometry(f.id,kick,low,high,chain);if(f.id===0&&high&&kick)Object.assign(geometry,{tipX:148,tipY:-145,rx:26,ry:40});const quickPalm=f.id===2&&high&&!kick;
  return {...geometry,launcher:false,rulerArt:f.id===0&&high&&kick,name:f.id===0&&high&&kick?'空中定規斬り':(low?'しゃがみ':high?'ジャンプ':'')+(kick?'キック':'パンチ')+(chain>1?' '+chain:' '),type:'basic',kind:kick?'kick':'punch',start:quickPalm?4:chain===3?8:5,end:quickPalm?18:chain===3?30:21,hits:[quickPalm?6:chain===3?10:7],damage:(kick?9:6)+(chain-1)*2,range:geometry.tipX+geometry.rx,low,high,frame:0,hit:[],originFace:f.face};
 }
 function startMove(s,side,m){const f=s.f[side];if(!m)return;f.action=m;m.serial=++s.inputSeq;f.jumpCancelUntil=0;f.dash=0;f.lastMove=m.name;emit(s,m.type==='skill'&&m.cost>=100?'super':'move',m.name,side);if(m.kind==='power')f.power=1.5;if(m.kind==='reach')f.reach=1.6;
  if(f.id===0&&m.type==='skill'&&m.kind==='orbit'){s.cinematic={kind:'rei-moonlight',side,frame:0,duration:78};s.f.forEach(p=>{p.dir=[0,0];p.queue=[];p.motions=[];p.tap=null;});m.trail=[];}
  if(m.type==='skill'&&m.cost>=100&&(f.id===1&&m.kind==='giant'||f.id===2&&m.kind==='data')){s.cinematic={kind:f.id===1?'nuts-shell':'chappy-data',side,frame:0,duration:f.id===1?60:66};s.f.forEach(p=>{p.dir=[0,0];p.queue=[];p.motions=[];p.tap=null;});}
  if(s.mode==='training'&&side===0){const target={special1:0,special2:1,super1:2,super2:3,antiAir:4}[s.drill];if(target===m.index&&m.type==='skill')s.complete=true;}
 }
 function feintCancel(s,side){const f=s.f[side],m=f.action;if(!m?.feint||f.y!==0||locked(f))return false;
  if(s.frame<f.feintReadyAt||(f.feintUsed&&s.f[1-side].stun>0&&s.frame<=f.comboUntil)){emit(s,'hint','固有キャンセルは1コンボ1回・再使用まで少し待ちます',side);return false;}
  f.feintUsed=true;f.feintReadyAt=s.frame+45;f.chain=0;f.lastBasic=-100;f.motions=[];f.queue=[];f.jumpRequestUntil=0;
  startMove(s,side,{name:['定規抜刀キャンセル','回転キャンセル','プラグイン解除'][f.id],type:'feint',rulerFrom:m.frame,kind:f.id===0?'rulerSheathe':'feint',start:0,end:6,hits:[],damage:0,frame:0,hit:[],originFace:f.face});
  if(s.mode==='training'&&side===0&&s.drill==='cancel')s.complete=true;return true;
 }
 function canGuard(f,from,m){return !m.unblockable&&f.y===0&&!f.action&&f.guard>0&&f.confusion===0&&f.stun===0&&f.down===0&&f.wakeup===0&&f.dir[0]*(from.x>f.x?-1:1)>0&&(m.low?f.dir[1]>0:m.high?f.dir[1]<=0:true);}
 const superReach=m=>m.kind==='giant'?180+420*clamp((m.frame-20)/24,0,1):m.range;
 function hit(s,side,m,range=m.range,projectile=null){const f=s.f[side],e=s.f[1-side];if(e.hp<=0||e.down>0)return false;const dx=e.x-f.x,omni=['shock','orbit','data'].includes(m.kind),reach=regular(m)?f.reach:1;let contact,from=projectile?{x:e.x-Math.sign(projectile.vx||projectile.v||m.originFace)*100}:f;
  if(projectile){if(projectile.airOnly&&e.y===0)return false;const body=hurtbox(e),box=projectile.sweepBox||{left:projectile.x-(projectile.rx||20),right:projectile.x+(projectile.rx||20),top:projectile.y-(projectile.ry||20),bottom:projectile.y+(projectile.ry||20)};if(!overlaps(box,body))return false;contact={x:clamp(projectile.x,body.left,body.right),y:clamp(projectile.y,body.top,body.bottom)};}
  else if(m.type==='basic'){const box=attackbox(f,m),body=hurtbox(e);if(!overlaps(box,body))return false;contact={x:clamp(box.x,body.left,body.right),y:clamp(box.y,body.top,body.bottom)};}
  else if(m.kind==='throw'){const comboThrow=m.air&&e.stun>0&&f.combo>0&&s.frame<=f.comboUntil&&(e.juggleHits||0)>0&&!e.down&&!e.wakeup&&!e.guardStun&&!e.confusion;if(Math.abs(dx)>range||m.air!==(f.y<0)||m.air!==(e.y<0)||Math.abs(f.y-e.y)>(m.air?105:10)||locked(e)&&!comboThrow||e.action?.type==='throw')return false;}
  else if(skillbox(f,m)){const box=skillbox(f,m),body=hurtbox(e);if(!overlaps(box,body))return false;contact={x:clamp(f.x+m.originFace*range,body.left,body.right),y:clamp((box.top+box.bottom)/2,body.top,body.bottom)};}
  else if(Math.abs(dx)>range*reach||(!omni&&dx*m.originFace<-15)||Math.abs(f.y-e.y)>(m.verticalRange??(m.kind==='orbit'?180:100)))return false;
  const continuing=e.stun>0&&s.frame<=f.comboUntil,guard=canGuard(e,from,m);
  // One shared budget covers normals, skills and projectiles, even across landings.
  if(!guard&&continuing&&(f.combo>=balance.comboMax||(f.comboAirHits||0)>=balance.juggleMax)&&m.kind!=='throw')return false;
  if(!guard&&e.y<0&&(e.juggleHits||0)>=balance.juggleMax&&m.kind!=='throw')return false;
  const baseDamage=damageFor(m,regular(m)?f.power:1),scaling=continuing&&f.combo>=5&&m.kind!=='data'?Math.max(.4,1-(f.combo-4)*.09):1;
  const damage=guard?0:Math.max(1,Math.round(baseDamage*scaling));
  e.hp=clamp(e.hp-damage*100/balance.maxHp,0,100);e.damageTaken+=damage;e.stun=guard?0:m.type==='basic'?26:28;e.action=null;e.queue=[];e.dash=0;e.wakeup=0;
  if(guard){e.guard=clamp(e.guard-Math.max(6,Math.round(m.damage*1.2)),0,balance.guardMax);e.guardDelay=balance.guardRecoverDelay;e.guardStun=7;if(e.guard===0){e.confusion=balance.guardBreakFrames;e.guardStun=0;e.dir=[0,0];e.motions=[];e.tap=null;emit(s,'guardBreak','GUARD BREAK · 2秒間混乱',1-side);}}
  if(!guard){m.confirmed=true;if(f.action&&m.serial&&f.action.serial===m.serial)f.action.confirmed=true;if(m.type==='basic'||m.airSpecial&&!m.airFinish)f.jumpCancelUntil=s.frame+24;if(!continuing){f.comboAirHits=0;f.feintUsed=false;f.wallBounceUsed=false;}e.wallBounceFrom=null;e.wallBounceUntil=0;if(e.y<0||m.launcher)f.comboAirHits=(f.comboAirHits||0)+1;f.combo=continuing?f.combo+1:1;f.comboDamage=continuing?f.comboDamage+damage:damage;f.comboUntil=s.frame+65;
   if(m.kind==='throw'){const oldX=f.x,enemyX=e.x,sign=Math.sign(dx||f.face);if(m.swap){f.x=clamp(enemyX,arena.left,arena.right);e.x=clamp(oldX-sign*42,arena.left,arena.right);}else e.x=clamp(enemyX+sign*110,arena.left,arena.right);e.down=30;e.stun=0;e.vy=m.air?6:0;e.airVx=0;f.face=e.x>=f.x?1:-1;e.face=-f.face;m.originFace=f.face;contact={x:e.x,y:440+e.y-45};}
   else e.x=clamp(e.x+Math.sign(projectile?(projectile.vx||projectile.v):dx||f.face)*(m.type==='basic'?5:12),arena.left,arena.right);
  }
  if(!guard&&m.launcher){f.airComboHits=0;f.launchedComboUntil=s.frame+220;e.y=Math.min(e.y,-1);e.vy=-airMovement.launch;e.airVx=m.originFace*1.1;e.stun=48;e.juggleHits=(e.juggleHits||0)+1;}
  else if(!guard&&regular(m)&&m.kind!=='throw'&&e.y<0){e.juggleHits=(e.juggleHits||0)+1;e.vy=-comboStyles[f.id].rise;e.airVx=m.originFace*(f.id===2?.4:.7);e.stun=36;if((m.high||m.airSpecial)&&f.y<0){f.vy=-comboStyles[f.id].rise;f.airDashFrames=0;f.airVx=m.originFace*(f.id===2?(Math.abs(e.x-f.x)>85?2.3:.9):1.4);if(continuing&&s.frame<=f.launchedComboUntil){f.airComboHits=(f.airComboHits||0)+1;if(s.mode==='training'&&side===0&&s.drill==='airCombo'&&f.airComboHits>=2)s.complete=true;}}}
  if(!guard&&m.wallCarry){if(e.y===0){e.juggleHits=(e.juggleHits||0)+1;f.comboAirHits=(f.comboAirHits||0)+1;}e.y=Math.min(e.y,-1);e.vy=-7;e.airVx=m.originFace*9;e.stun=44;if(!f.wallBounceUsed){e.wallBounceFrom=side;e.wallBounceUntil=s.frame+50;}}
  if(m.kind==='impact'&&!m.connected&&!guard){e.x=f.face>0?arena.right-10:arena.left+10;m.connected=true;}
  if(m.kind==='orbit'&&!guard&&m.frame===m.hits.at(-1)){const sign=Math.sign(dx||m.originFace);e.x=clamp(e.x+sign*38,arena.left,arena.right);e.vy=-6;e.airVx=sign*4.6;e.down=22;e.stun=0;}
  if(m.kind==='giant'&&!guard){const sign=Math.sign(dx||m.originFace);e.x=clamp(e.x+sign*50,arena.left,arena.right);e.vy=-7;e.airVx=sign*6;e.down=28;e.stun=0;}
  if(m.kind==='data'){f.slow=.65;m.collected=true;}
  if(!guard&&m.kind!=='throw'&&(m.airSpike||m.airFinish||f.combo>=balance.comboMax||(f.comboAirHits||0)>=balance.juggleMax)){e.down=30;e.stun=0;e.vy=e.y<0?8:0;e.airVx=m.originFace*2.5;f.jumpCancelUntil=0;emit(s,'move',m.airSpike?'空中叩き落とし':m.airFinish?'空中必殺技で締め':'コンボ上限・ダウン',side);}
  if(!guard&&s.mode==='training'&&side===0&&s.drill==='airThrow'&&m.kind==='throw'&&m.air&&continuing)s.complete=true;
  if(m.type==='basic')f.meter=clamp(f.meter+(guard?3:12),0,100);else if(m.type==='skill'&&m.cost<100){const gain=Math.min(6,18-(m.gained||0));m.gained=(m.gained||0)+gain;f.meter=clamp(f.meter+gain,0,100);}
  s.hitStopFrames=Math.max(s.hitStopFrames||0,guard?tempo.guardStop:m.airBarrage?tempo.multiStop:m.launcher||m.rulerArt||m.type==='skill'||m.kind==='throw'?tempo.heavyStop:tempo.lightStop);
  const effectLife=['giant','data'].includes(m.kind)?36:m.airBarrage||m.rushStep?12:20;s.effects.push({x:contact?.x??e.x,y:contact?.y??440+e.y-132,kind:guard?'guard':m.kind,spark:impactStyle(f,m,guard),face:m.originFace||f.face,heavy:!!(m.launcher||m.rulerArt||m.kind==='rulerDraw'||m.airFinish||m.cost>=100||m.kind==='throw'),seed:m.serial||s.inputSeq,compact:!!(m.airBarrage||m.rushStep||m.airFinish&&f.id===2),life:effectLife,ttl:effectLife,side});emit(s,guard?'guard':'hit',guard?'GUARD':damage+' DAMAGE',1-side);
  if(s.mode==='training'&&side===0){if(s.drill==='combo'&&f.combo>=3)s.complete=true;if(s.drill==='throw'&&m.kind==='throw')s.complete=true;}
  return true;
 }
 function cpu(s){const f=s.f[1],e=s.f[0];if(s.mode==='training'&&s.dummy!=='cpu'){direction(s,1,s.dummy==='guard'?-f.face:0,s.dummy==='jump'&&f.y===0?f.dir[1]<0?0:-1:0);return;}
  if(s.frame<f.aiAt)return;f.aiAt=s.frame+12+Math.floor(random(s)*12);const dist=Math.abs(e.x-f.x);if(e.action&&random(s)<.32){direction(s,1,-f.face,e.action.low?1:0);return;}
  direction(s,1,dist>105?f.face:0,0);if(f.action||locked(f))return;
  if(e.y<0&&dist<450&&f.meter>=30&&random(s)<.65){f.meter-=30;startMove(s,1,{...chars[f.id].skills[4],type:'skill',index:4,frame:0,hit:[],originFace:f.face});return;}
  if(f.id===0&&dist>170&&dist<620&&f.meter>=30&&random(s)<.2){f.meter-=30;startMove(s,1,{...chars[f.id].skills[0],type:'skill',index:0,frame:0,hit:[],originFace:f.face});return;}
  if(dist<180&&f.meter>=100&&random(s)<.12){const i=Math.floor(random(s)*2)+2;f.meter-=100;startMove(s,1,{...chars[f.id].skills[i],type:'skill',index:i,frame:0,hit:[],originFace:f.face});return;}
  if(dist<170&&f.meter>=30&&random(s)<.2){const i=random(s)<.5?0:1;f.meter-=30;startMove(s,1,{...chars[f.id].skills[i],type:'skill',index:i,frame:0,hit:[],originFace:f.face});return;}
  if(dist<65&&f.y===0&&e.y===0&&random(s)<.15){direction(s,1,random(s)<.5?f.face:-f.face,0);press(s,1,'S');return;}
  if(dist<155&&random(s)<.8)press(s,1,random(s)<.5?'P':'K');if(dist>160&&random(s)<.12)direction(s,1,f.face,-1);
 }
 function resetRound(s){const wins=s.f.map(f=>f.wins);s.f=[fighter(s.ids[0],435),fighter(s.ids[1],765)];s.f.forEach((f,i)=>f.wins=wins[i]);s.time=99;s.projectiles=[];s.effects=[];s.cinematic=null;s.hitStopFrames=0;s.phase='intro';s.phaseTicks=90;s.round=wins[0]+wins[1]+1;}
 function endRound(s){const a=s.f[0],b=s.f[1];const winner=a.hp===b.hp?null:a.hp>b.hp?0:1;s.winner=winner;if(winner!==null)s.f[winner].wins++;s.phase=s.f.some(f=>f.wins>=2)?'match':'round';s.phaseTicks=150;s.f.forEach(f=>f.slow=1);emit(s,'round',winner===null?'DRAW':chars[s.f[winner].id].name+' WIN',winner);}
 function orbitOffset(frame){const points=[[12,-145,0],[18,-110,0],[26,160,-20],[34,110,0],[42,165,-135],[50,0,-130],[58,-160,-80],[66,-105,0],[74,-175,-130],[82,105,-65],[92,130,0],[104,130,0]];for(let i=1;i<points.length;i++){if(frame<=points[i][0]){const a=points[i-1],b=points[i],t=clamp((frame-a[0])/(b[0]-a[0]),0,1);return {x:a[1]+(b[1]-a[1])*t,y:a[2]+(b[2]-a[2])*t};}}return {x:130,y:0};}
 function step(s){if(s.cinematic){s.frame++;const cut=s.cinematic;cut.frame++;const cue=cut.kind==='nuts-shell'?26:cut.kind==='chappy-data'?30:40;if(cut.frame===cue)emit(s,cut.kind==='nuts-shell'?'shellCrack':cut.kind==='chappy-data'?'scan':'release',cut.kind==='nuts-shell'?'殻を破る':cut.kind==='chappy-data'?'データ解析':'月光解放',cut.side);if(cut.frame>=cut.duration){s.cinematic=null;s.f.forEach(f=>{f.queue=[];f.motions=[];f.tap=null;});}return;}s.frame++;s.effects=s.effects.filter(e=>--e.life>0);if(s.phase==='match')return;if(s.phase==='intro'){if(--s.phaseTicks<=0)s.phase='fight';return;}if(s.phase==='round'){if(--s.phaseTicks<=0)resetRound(s);return;}
  if(s.mode!=='friend')cpu(s);if(s.cinematic)return;if(s.mode!=='training')s.time=Math.max(0,s.time-1/60);
  for(let side=0;side<2;side++){const f=s.f[side],e=s.f[1-side];f.face=f.action?f.action.originFace:e.x>=f.x?1:-1;f.meter=clamp(f.meter+1/60,0,100);if(s.mode==='training'&&s.infinite&&side===0)f.meter=100;f.stun=Math.max(0,f.stun-1);f.guardStun=Math.max(0,f.guardStun-1);f.guardDelay=Math.max(0,f.guardDelay-1);if(f.confusion>0){f.dir=[0,0];f.queue=[];if(--f.confusion===0){f.guard=balance.guardMax;f.guardDelay=balance.guardRecoverDelay;}}else if(f.guardDelay===0&&f.guardStun===0&&f.stun===0&&f.down===0&&!f.action)f.guard=clamp(f.guard+balance.guardRecoverPerFrame,0,balance.guardMax);f.wakeup=Math.max(0,f.wakeup-1);if(f.down>0&&f.y===0&&--f.down===0)f.wakeup=10;f.pink=Math.max(f.hp,f.pink-(s.frame%2?.2:.45));
   if(s.mode==='training'&&e.hp<100&&!locked(e)&&!f.action&&s.frame>f.comboUntil){e.hp=e.pink=100;}
   const profile=combat[f.id];f.walking=false;f.landing=Math.max(0,(f.landing||0)-1);
   const jumpEdge=f.dir[1]<0&&f.previousY>=0;if(jumpEdge)f.jumpRequestUntil=s.frame+tempo.jumpBuffer;
   const jumpConfirmed=f.action?.confirmed&&(f.action.type==='basic'&&!f.action.airSpike||f.action.airSpecial&&!f.action.airFinish);
   if(!locked(f)&&jumpConfirmed&&s.frame<=f.jumpCancelUntil&&s.frame<=f.jumpRequestUntil&&(f.y===0||(f.airJumps||0)<1)){if(f.y<0)f.airJumps=(f.airJumps||0)+1;else f.airJumps=0;f.action=null;f.queue=[];f.vy=-airMovement.jumpCancel;f.dash=0;f.airDashFrames=0;if(e.y<0&&e.stun>0&&s.frame<=f.comboUntil)e.vy=Math.min(e.vy,-airMovement.jumpCancel);f.airVx=f.dir[0]*profile.jumpSpeed;f.airChain=0;f.jumpCancelUntil=0;f.jumpRequestUntil=0;emit(s,'move','ジャンプキャンセル',side);}
   if(!locked(f)&&!f.action){const frozenDummy=s.mode==='training'&&side===1&&s.dummy!=='cpu';
    if(f.jumpRequestUntil>0&&s.frame<=f.jumpRequestUntil&&(f.y===0&&f.vy===0||f.y<0&&f.airJumps<1)){const air=f.y<0;f.vy=-(air?airMovement.doubleJump:airMovement.jump);f.dash=0;f.airDashFrames=0;f.airVx=f.dir[0]*profile.jumpSpeed;f.airChain=0;f.jumpRequestUntil=0;if(air){f.airJumps++;emit(s,'move','二段ジャンプ',side);}else{f.airDashed=false;f.airJumps=0;}}
    if(!frozenDummy){const crouch=f.dir[1]>0&&f.y===0,velocity=f.dash>0?f.dashDx*7.5*f.slow:f.y<0?(f.dir[0]?f.dir[0]*profile.jumpSpeed:f.airVx)*f.slow:crouch?0:f.dir[0]*profile.speed*f.slow;const beforeX=f.x;f.x=clamp(f.x+velocity,arena.left,arena.right);if(f.y===0&&f.vy===0&&!crouch&&Math.abs(f.x-beforeX)>.01){f.walking=true;f.walkPhase=(f.walkPhase+Math.abs(f.x-beforeX)/22)%4;}}
   }else f.dash=0;
   if(f.y<0&&f.action&&!locked(f))f.x=clamp(f.x+(f.airVx||0)*f.slow,arena.left,arena.right);
   f.dash=Math.max(0,f.dash-1);f.previousY=f.dir[1];if((f.down>0||f.stun>0)&&f.y<0){f.x=clamp(f.x+(f.airVx||0),arena.left,arena.right);f.airVx*=.96;}if(f.wallBounceFrom!==null){const owner=s.f[f.wallBounceFrom];if(s.frame>f.wallBounceUntil||f.y===0||f.down>0||!owner||owner.wallBounceUsed){f.wallBounceFrom=null;}else if(f.x<=arena.left||f.x>=arena.right){const sign=f.x<=arena.left?1:-1;owner.wallBounceUsed=true;f.wallBounceFrom=null;f.airVx=sign*4.5;f.vy=-9;f.stun=40;s.effects.push({x:f.x,y:440+f.y-130,kind:'shock',life:24,ttl:24,side:1-side});emit(s,'move','壁バウンド・追撃チャンス',1-side);}}const wasAir=f.y<0;if(f.airDashFrames>0&&!locked(f)){f.airDashFrames--;f.vy=0;}else{f.airDashFrames=0;f.vy+=airMovement.gravity;}f.y=Math.min(0,f.y+f.vy);if(f.y===0){f.vy=0;f.airVx=0;f.airDashed=false;f.airDashFrames=0;f.airJumps=0;f.airChain=0;f.juggleHits=0;if(wasAir){f.airComboHits=0;f.launchedComboUntil=0;f.landing=6;if(f.action?.high||f.action?.airSpecial)f.action=null;}}
   f.queue=f.queue.filter(q=>s.frame-q.t<tempo.inputBuffer);if(f.queue[0]?.button==='S'&&f.action?.feint&&!locked(f)){f.queue.shift();feintCancel(s,side);}const qLauncher=f.y===0&&f.queue[0]?.button==='K'&&f.queue[0].dir?.[1]>0&&f.queue[0].dir?.[0]*f.face>0;const queuedThrow=f.y<0&&f.queue[0]?.button==='S'&&f.queue[0]?.dir?.[0]!==0,queuedSpecial=f.queue[0]&&((f.queue[0].button==='P'&&motion({...f,motions:f.queue[0].motions||[]},['D','F'],s.frame))||(f.queue[0].button==='K'&&(motion({...f,motions:f.queue[0].motions||[]},['D','B'],s.frame)||f.id===0&&f.y===0&&motion({...f,motions:f.queue[0].motions||[]},['D','F'],s.frame))));const cancellable=f.action?.type==='basic'&&!f.action.launcher&&!f.action.airSpike&&(f.y<0?f.action.confirmed&&f.action.frame>=(f.id===2?7:8)&&((f.airChain||0)<4||queuedThrow||queuedSpecial):f.action.frame>=12&&(f.chain<3||qLauncher&&f.action.confirmed||queuedSpecial&&f.action.confirmed));
   if(f.queue.length&&!locked(f)&&(!f.action||cancellable)){const q=f.queue.shift(),currentDir=f.dir,currentMotions=f.motions;if(q.dir)f.dir=q.dir;if(q.motions)f.motions=q.motions;const move=choose(s,side,q.button);f.dir=currentDir;f.motions=move?.type==='skill'||move?.type==='throw'||move?.launcher?currentMotions.filter(m=>m.t>q.t):currentMotions;startMove(s,side,move);}
   if(s.cinematic)return;
   const m=f.action;if(m){m.frame++;if(m.speed&&m.frame>=m.start&&m.frame<m.end-8){const distance=(e.x-f.x)*m.originFace,travel=m.rushStep?Math.min(m.speed,Math.max(0,distance-64)):m.speed;f.x=clamp(f.x+m.originFace*travel,arena.left,arena.right);}
    if(m.kind==='orbit'&&m.frame>=m.start&&m.frame<m.end-8){const offset=orbitOffset(m.frame);f.x=clamp(e.x+offset.x,arena.left,arena.right);f.y=Math.min(0,e.y+offset.y);f.vy=0;f.face=m.originFace=e.x>=f.x?1:-1;m.orbitTilt=m.frame>=42&&m.frame<=58?1.15:m.frame>=74&&m.frame<=85?-.35:0;m.trail=(m.trail||[]).concat({x:f.x,y:f.y,face:f.face}).slice(-4);}
    if(['giant','data'].includes(m.kind)&&m.frame>=m.hits[0]&&m.frame<=m.activeUntil&&!m.contactDone){if(hit(s,side,m,superReach(m))){m.contactDone=true;m.impactFrame=m.frame;}}
    if(!['giant','data'].includes(m.kind))for(const at of m.hits){if(m.frame>=at&&m.frame<at+activeFrames(m)&&!m.hit.includes(at)){if(m.projectile||m.kind==='bomb'){m.hit.push(at);spawnProjectile(s,side,m);}else if(hit(s,side,m,m.kind==='impact'&&m.connected?arena.width:m.range))m.hit.push(at);}}
    if(m.frame>=m.end)f.action=null;
   }
  }
  // Body collision keeps fighters apart on the ground, while jumps allow cross-ups.
  const a=s.f[0],b=s.f[1];if(Math.abs(a.x-b.x)<50&&a.y===0&&b.y===0&&!a.action?.kind?.includes('orbit')&&!b.action?.kind?.includes('orbit')){const push=(50-Math.abs(a.x-b.x))/2,sign=a.x<=b.x?1:-1;a.x=clamp(a.x-sign*push,arena.left,arena.right);b.x=clamp(b.x+sign*push,arena.left,arena.right);if(Math.abs(a.x-b.x)<50){if(a.x<=arena.left||a.x>=arena.right)b.x=clamp(a.x+sign*50,arena.left,arena.right);else a.x=clamp(b.x-sign*50,arena.left,arena.right);}}
  for(const p of s.projectiles){const oldX=p.x,oldY=p.y;p.x+=p.vx??p.v;p.y+=p.vy||0;p.life--;const enemy=s.f[1-p.side],body=hurtbox(enemy),rx=p.rx||20,ry=p.ry||20,box={left:Math.min(oldX,p.x)-rx,right:Math.max(oldX,p.x)+rx,top:Math.min(oldY,p.y)-ry,bottom:Math.max(oldY,p.y)+ry};p.sweepBox=box;if((!p.airOnly||enemy.y<0)&&overlaps(box,body)&&hit(s,p.side,p.m,p.m.range,p)){p.life=0;p.contactDone=true;}if(p.life<=0&&!p.contactDone)s.effects.push({x:p.x,y:p.y,kind:p.m.kind,life:24,side:p.side});}s.projectiles=s.projectiles.filter(p=>p.life>0&&p.x>-70&&p.x<arena.width+70&&p.y>-1800&&p.y<520);
  if(s.mode!=='training'&&(s.time<=0||s.f.some(f=>f.hp<=0)))endRound(s);
 }
 return {balance,reachGuide,impactStyle,tempo,advance,activeFrames,activeNow,attackboxes,skillbox,airMovement,comboStyles,arena,superReach,damageFor,dragonMotion,spawnProjectile,combat,basicGeometry,hurtbox,attackbox,chars,create,direction,press,step,choose,startMove,feintCancel,canGuard,hit,resetRound,orbitOffset};
})();


