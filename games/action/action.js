(() => {
'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const W=960,H=540,FLOOR=435,PW=36,PH=72,SAVE='nattsun_rei_action_v2',PROFILE='nattsun_rei_journal_v2';
const levels=[
 {name:'教室棟',subtitle:'掲示板の鍵と、寄り道',length:3100,bg:'classroom',par:90,
  platforms:[{x:410,y:355,w:260},{x:740,y:245,w:145},{x:1540,y:350,w:240},{x:1780,y:270,w:180},{x:2110,y:325,w:200,ax:95},{x:2570,y:245,w:160}],
  books:[{x:550,y:312},{x:1665,y:307},{x:2235,y:275}],notes:[{x:810,y:201},{x:1880,y:226},{x:2650,y:201}],
  gaps:[],hazards:[{x:1130,w:85,h:18},{x:2400,w:68,h:46,ax:85}],levers:[{x:915,y:403,name:'掲示板スイッチ'}],gate:{x:1370,requires:[0]},checkpoints:[80,1510,2550],
  hint:'掲示板スイッチで通路を開く。上のルートには思い出メモ。',ending:'「しおり、見つかったね。メモまで探してくれて……ありがとう」'},
 {name:'渡り廊下',subtitle:'動く足場と、風の通り道',length:3450,bg:'hallway',par:110,
  platforms:[{x:370,y:355,w:230},{x:550,y:245,w:150},{x:870,y:365,w:170,ax:55},{x:1220,y:350,w:235},{x:1830,y:355,w:170,ax:70},{x:1990,y:275,w:140},{x:2390,y:345,w:190,ay:75,enabledBy:0},{x:3050,y:245,w:170}],
  books:[{x:475,y:312},{x:1340,y:307},{x:2480,y:220}],notes:[{x:620,y:201},{x:2060,y:230},{x:3135,y:201}],
  gaps:[{x:770,w:260},{x:1770,w:330}],hazards:[{x:1550,w:72,h:46,ax:65},{x:2880,w:90,h:18}],levers:[{x:1470,y:403,name:'昇降台スイッチ'}],gate:{x:2730,requires:[0]},checkpoints:[80,1120,2170,2830],wind:{x:2170,w:480},
  hint:'足場は横や縦に動きます。空中の2回目のジャンプとダッシュで距離を調整。',ending:'「風が気持ちいいね。急がなくても、ちゃんと届くんだ」'},
 {name:'文化祭の準備室',subtitle:'二つの仕掛けと、最後の一枚',length:3800,bg:'classroom',par:125,
  platforms:[{x:370,y:355,w:240},{x:550,y:245,w:170},{x:1230,y:335,w:175,ax:65},{x:1740,y:350,w:240},{x:2050,y:270,w:180},{x:2310,y:315,w:200},{x:2560,y:350,w:200,ay:65},{x:2730,y:290,w:200},{x:3370,y:245,w:180}],
  books:[{x:500,y:312},{x:1850,y:307},{x:2840,y:247}],notes:[{x:635,y:201},{x:2150,y:226},{x:3460,y:201}],
  gaps:[{x:1160,w:300}],hazards:[{x:1510,w:70,h:46,ax:85},{x:2960,w:95,h:18}],levers:[{x:975,y:403,name:'準備室スイッチ'},{x:2430,y:283,name:'上階スイッチ'}],gate:{x:3160,requires:[0,1]},checkpoints:[80,1610,2630,3270],
  hint:'出口の前は二つのスイッチで開きます。上階へ寄り道して最後のメモも探そう。',ending:'「今日の放課後も、忘れないように。……次は、一緒に帰ろう？」'}
];
const memories=[
 ['机の端の落書き','消しゴムで消したはずなのに、星の輪郭だけ残っていた。麗はその小さな跡を、しおりに写した。'],
 ['名前のないリボン','準備を手伝ってくれた誰かへ。青いリボンを結びながら、麗はお礼の言葉を考えていた。'],
 ['はじめての寄り道','急いで帰る日ばかりだった。でも今日は、窓辺に置かれたメモを読む時間があった。'],
 ['風の音','渡り廊下で立ち止まると、遠くの教室から笑い声が届いた。麗の表情が少しやわらいだ。'],
 ['少し高い場所','足場の上から見る学園は、いつもと違って見えた。見慣れた場所にも、まだ知らない景色がある。'],
 ['同じ歩幅','「先に行ってもいいよ」と言ったのに、あなたは待っていた。そのことを、麗は忘れなかった。'],
 ['二人分の準備','文化祭の飾りは、一人だとなかなか終わらない。二人なら、会話のぶんだけ時間が楽しくなる。'],
 ['最後の一枚','しおりの裏に小さく書かれた日付。それは、麗が今日を大切にしたかった証だった。'],
 ['明日への約束','「また明日」。いつもの言葉が、今日だけは少し特別に聞こえた。']
];
let profile=readProfile(),stage=0,run,facing=1,time=0,camera=0,last=0,playing=false,mode='title',audioOn=true,assets={},assetsReady=false,toastAt=0,hudAt=0;
const input={left:false,right:false,jump:false,interact:false,dash:false};
function readProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE)||'null');if(!p||p.version!==2)return emptyProfile();return {version:2,unlocked:Number.isInteger(p.unlocked)?Math.max(1,Math.min(3,p.unlocked)):1,notes:Array.isArray(p.notes)?[...new Set(p.notes.filter(n=>Number.isInteger(n)&&n>=0&&n<9))]:[],records:Array.from({length:3},(_,i)=>{const r=p.records?.[i];return r&&Number.isFinite(r.best)&&r.best>0&&r.best<86400&&['S','A','B','C'].includes(r.grade)?{best:r.best,grade:r.grade,clean:r.clean===true,clears:Number.isInteger(r.clears)?Math.max(1,r.clears):1}:null})}}catch{return emptyProfile()}}
function emptyProfile(){return {version:2,unlocked:1,notes:[],records:[null,null,null]}}
function persistProfile(){try{localStorage.setItem(PROFILE,JSON.stringify(profile));return true}catch{flash('記録を保存できません。ブラウザの保存設定を確認してください。');return false}}
function fresh(){return {x:80,y:FLOOR-PH,vx:0,vy:0,hp:3,got:[false,false,false],notes:[false,false,false],levers:levels[stage].levers.map(()=>false),checkpoint:0,damage:0,elapsed:0,jumps:0,coyote:6,support:null,invuln:0,dashTicks:0,dashCooldown:0,cleared:false}}
run=fresh();
const round=(x,y,w,h,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()};
const format=n=>{const safe=Math.max(0,n),m=Math.floor(safe/60),s=Math.floor(safe%60);return m+':'+String(s).padStart(2,'0')+'.'+Math.floor((safe%1)*10)};
function flash(text){$('hint').textContent=text;toastAt=time+180}
let ac;function tone(f=620,d=.1){if(!audioOn)return;try{ac??=new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();const osc=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime;osc.type='sine';osc.frequency.setValueAtTime(f,now);osc.frequency.linearRampToValueAtTime(f*1.16,now+d);g.gain.setValueAtTime(.035,now);g.gain.exponentialRampToValueAtTime(.001,now+d);osc.connect(g).connect(ac.destination);osc.start(now);osc.stop(now+d)}catch{}}
function clearInput(){for(const k of Object.keys(input))input[k]=false;for(const k of ['left','right','jump','dash','interact'])$(k).classList.remove('pressed')}
function panel(kind,tag,heading,text,label='つづける',detail='',secondary=''){playing=false;mode=kind;clearInput();$('overlay').hidden=false;$('panelTag').textContent=tag;$('panelTitle').textContent=heading;$('panelText').textContent=text;$('panelDetails').textContent=detail;$('mainAction').textContent=label;$('mainAction').disabled=!assetsReady;$('otherAction').hidden=!secondary;$('otherAction').textContent=secondary}
function intro(){panel('title','CHAPTER '+String(stage+1).padStart(2,'0'),levels[stage].name,levels[stage].hint+'\nしおり3枚を出口へ。思い出メモ3枚は、寄り道のお楽しみ。','ここから遊ぶ','2段ジャンプ / 近くで調べる / ダッシュ')}
function startStage(i,autoplay=true){setMainAction();stage=i;run=fresh();time=0;camera=0;toastAt=0;hudAt=0;facing=1;clearInput();renderJournal();updateHud();if(autoplay)resume();else intro()}
function resume(){if(!assetsReady)return;playing=true;mode='play';$('overlay').hidden=true;clearInput();canvas.focus()}
function selectStage(i){if(i>=profile.unlocked){flash('前のステージをクリアすると解放されます');return}if(playing){panel('select','CHAPTER SELECT',levels[i].name+'へ移動する？','現在の探索は最初からになります。保存済みのセーブと記録は残ります。','移動する','', '探索に戻る');$('mainAction').onclick=()=>{setMainAction();startStage(i)};$('otherAction').onclick=()=>{setMainAction();resume()}}else startStage(i,false)}
function mainAction(){if(mode==='clear'){if(stage<2)startStage(stage+1);else startStage(stage)}else if(mode==='pause')resume();else if(mode==='retry'){run.hp=3;respawn();resume()}else startStage(stage)}
function setMainAction(){$('mainAction').onclick=mainAction;$('otherAction').onclick=()=>startStage(stage)}
setMainAction();
$('pause').onclick=()=>{if(playing)panel('pause','PAUSED','ひと休み。','時間は止まっています。準備ができたら続きをどうぞ。','探索に戻る');else if(mode==='pause')resume()};
$('restart').onclick=()=>{if(playing){panel('restart','RETRY CHAPTER','このステージをやり直す？','今回のタイムと取得数はリセット。セーブ・自己ベスト・思い出メモの記録は残ります。','やり直す','','戻る');$('otherAction').onclick=()=>{setMainAction();resume()}}else startStage(stage,false)};
$('sound').onclick=()=>{audioOn=!audioOn;$('sound').textContent=audioOn?'効果音 ON':'効果音 OFF';$('sound').setAttribute('aria-pressed',String(audioOn))};
function validSave(d){if(!d||d.version!==2||!Number.isInteger(d.stage)||d.stage<0||d.stage>2)return false;const r=d.run,l=levels[d.stage],bools=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>typeof v==='boolean');return r&&Number.isFinite(r.x)&&r.x>=0&&r.x<=l.length&&Number.isFinite(r.y)&&r.y>=-300&&r.y<=H+100&&Number.isInteger(r.hp)&&r.hp>=1&&r.hp<=3&&Number.isFinite(r.elapsed)&&r.elapsed>=0&&r.elapsed<86400&&Number.isInteger(r.damage)&&r.damage>=0&&r.damage<100000&&Number.isInteger(r.checkpoint)&&r.checkpoint>=0&&r.checkpoint<l.checkpoints.length&&bools(r.got,3)&&bools(r.notes,3)&&bools(r.levers,l.levers.length)}
$('save').onclick=()=>{if(!playing&&mode!=='pause'){flash('探索を始めてからセーブできます');return}try{localStorage.setItem(SAVE,JSON.stringify({version:2,stage,run:{x:run.x,y:run.y,hp:run.hp,got:run.got,notes:run.notes,levers:run.levers,checkpoint:run.checkpoint,damage:run.damage,elapsed:run.elapsed},time}));flash('探索をセーブしました')}catch{flash('セーブできませんでした')}};
$('load').onclick=loadGame;
function loadGame(){if(!assetsReady){flash('素材を読み込んでいます。完了してからロードしてください。');return}try{let d=JSON.parse(localStorage.getItem(SAVE)||'null');if(!d){const old=JSON.parse(localStorage.getItem('nattsun_rei_action_v1')||'null'),s=old?.state;if(old?.version===1&&s&&Number.isFinite(s.x)&&Array.isArray(s.got)&&s.got.length===3&&s.got.every(v=>typeof v==='boolean')){d={version:2,stage:0,run:{x:Math.max(40,Math.min(levels[0].length-170,s.x)),y:FLOOR-PH,hp:3,got:s.got,notes:[false,false,false],levers:[s.x>1370],checkpoint:0,damage:0,elapsed:0},time:0}}}if(!validSave(d)){flash('読み込めるセーブがありません');return}stage=d.stage;run={...fresh(),...d.run,got:[...d.run.got],notes:[...d.run.notes],levers:[...d.run.levers],invuln:60};time=Number.isFinite(d.time)&&d.time>=0?Math.min(d.time,10000000):0;camera=Math.max(0,Math.min(levels[stage].length-W,run.x-320));profile.unlocked=Math.max(profile.unlocked,stage+1);renderJournal();resume();updateHud();flash('探索をロードしました')}catch{flash('セーブを読み込めませんでした')}}
const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',KeyE:'interact',ShiftLeft:'dash',ShiftRight:'dash'};
window.addEventListener('keydown',e=>{const k=keyMap[e.code];if(!k||!playing||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName))return;if(e.code==='Space'&&e.target?.tagName==='BUTTON')return;e.preventDefault();if((k==='jump'||k==='interact'||k==='dash')&&e.repeat)return;input[k]=true});
window.addEventListener('keyup',e=>{const k=keyMap[e.code];if(k==='left'||k==='right')input[k]=false});
window.addEventListener('blur',()=>{clearInput();if(playing)panel('pause','PAUSED','ひと休み。','画面を離れたため時間を止めました。','探索に戻る')});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)panel('pause','PAUSED','ひと休み。','画面を離れたため時間を止めました。','探索に戻る')});
for(const k of ['left','right','jump','dash','interact']){const b=$(k);b.addEventListener('pointerdown',e=>{e.preventDefault();if(!playing)return;b.setPointerCapture(e.pointerId);input[k]=true;b.classList.add('pressed')});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{e.preventDefault();if(k==='left'||k==='right')input[k]=false;b.classList.remove('pressed')})}
function surfaces(at=time){return levels[stage].platforms.map((p,id)=>({...p,id,x:p.x+(p.ax||0)*Math.sin(at*.018+id),y:p.y+(p.enabledBy!==undefined&&!run.levers[p.enabledBy]?0:p.ay||0)*Math.sin(at*.017+id)}))}
function gateOpen(){return levels[stage].gate.requires.every(i=>run.levers[i])}
function intersects(a,b){return a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h}
function nearLever(){let result=-1,distance=Infinity;levels[stage].levers.forEach((s,i)=>{const d=Math.hypot(run.x+PW/2-s.x,run.y+PH/2-s.y);if(d<100&&d<distance){distance=d;result=i}});return result}
function interact(){const i=nearLever();if(i<0){flash('近くに調べられる仕掛けはありません');return}run.levers[i]=!run.levers[i];tone(run.levers[i]?650:380,.15);flash(levels[stage].levers[i].name+(run.levers[i]?'をONにしました':'をOFFにしました'));updateHud()}
function respawn(){run.x=levels[stage].checkpoints[run.checkpoint];run.y=FLOOR-PH;run.vx=run.vy=0;run.support=null;run.jumps=0;run.coyote=6;run.invuln=95;run.dashTicks=0;camera=Math.max(0,Math.min(levels[stage].length-W,run.x-320))}
function hurt(){if(run.invuln>0)return;run.damage++;run.hp--;tone(210,.17);if(run.hp<=0){panel('retry','TRY AGAIN','チェックポイントから、もう一度。','集めたしおりとメモは保持。体力を回復して探索を続けられます。','探索を続ける','ノーミス記録を目指すなら「やり直す」から再挑戦。');return}respawn();flash('チェックポイントに戻りました。落ち着いて、もう一度。')}
function collect(){const l=levels[stage];for(const kind of ['books','notes'])l[kind].forEach((item,i)=>{const got=kind==='books'?run.got:run.notes;if(got[i]||Math.abs(run.x+PW/2-item.x)>34||Math.abs(run.y+PH/2-item.y)>47)return;got[i]=true;tone(kind==='books'?730:920,.16);if(kind==='books')flash('星柄のしおり '+run.got.filter(Boolean).length+' / 3');else{const id=stage*3+i;if(!profile.notes.includes(id)){profile.notes.push(id);persistProfile();renderJournal()}flash('思い出メモ「'+memories[id][0]+'」を見つけました')}updateHud()})}
function finish(){if(run.cleared)return;run.cleared=true;const n=run.notes.filter(Boolean).length,grade=n===3&&run.damage===0&&run.elapsed<=levels[stage].par?'S':n===3||run.damage===0?'A':n>0?'B':'C',old=profile.records[stage],order={S:4,A:3,B:2,C:1};profile.records[stage]={best:old?Math.min(old.best,run.elapsed):run.elapsed,grade:old&&order[old.grade]>order[grade]?old.grade:grade,clean:run.damage===0||old?.clean===true,clears:(old?.clears||0)+1};profile.unlocked=Math.max(profile.unlocked,Math.min(3,stage+2));persistProfile();renderJournal();tone(960,.22);panel('clear','CHAPTER CLEAR · '+grade,levels[stage].name+' クリア',levels[stage].ending,stage<2?'次のステージへ':'もう一度遊ぶ','タイム '+format(run.elapsed)+' / メモ '+n+'/3 / ミス '+run.damage+'回\nS目標：メモ3枚・ノーミス・'+levels[stage].par+'秒以内','同じステージに再挑戦')}
function update(dt){if(!playing)return;const l=levels[stage],prevSurfaces=surfaces(time);time+=dt;run.elapsed+=dt/60;const plats=surfaces(time);run.invuln=Math.max(0,run.invuln-dt);run.dashCooldown=Math.max(0,run.dashCooldown-dt);run.dashTicks=Math.max(0,run.dashTicks-dt);
 if(run.support!==null){const a=prevSurfaces[run.support],b=plats[run.support];if(a&&b){run.x+=b.x-a.x;run.y+=b.y-a.y}}
 const direction=(input.right?1:0)-(input.left?1:0);if(direction)facing=direction;
 if(input.interact){input.interact=false;interact()}
 if(input.dash){input.dash=false;if(run.dashCooldown===0){run.dashTicks=13;run.dashCooldown=55;tone(440,.08)}}
 if(input.jump){input.jump=false;if(run.coyote>0){run.jumps=1;run.vy=-12.4;run.coyote=0;run.support=null;tone(380,.09)}else if(run.jumps<2){run.jumps=2;run.vy=-11.8;run.support=null;tone(520,.09)}}
 run.vx=run.dashTicks>0?facing*9.4:direction*4.5;const previousX=run.x;run.x=Math.max(8,Math.min(l.length-75,run.x+run.vx*dt));
 if(!gateOpen()){const gate={x:l.gate.x,y:125,w:32,h:FLOOR-125};if(intersects({x:run.x,y:run.y,w:PW,h:PH},gate)){run.x=previousX+PW<=gate.x?gate.x-PW:gate.x+gate.w;if(time>toastAt)flash('通路を開くには、スイッチを調べてください')}}
 const bottom=run.y+PH;run.vy=Math.min(18,run.vy+.64*dt);run.y+=run.vy*dt;run.support=null;let landed=false;
 const overGap=l.gaps.some(g=>run.x+PW/2>g.x&&run.x+PW/2<g.x+g.w);
 if(!overGap&&bottom<=FLOOR+12&&run.y+PH>=FLOOR&&run.vy>=0){run.y=FLOOR-PH;run.vy=0;landed=true}
 for(const p of plats){if(run.vy>=0&&bottom<=p.y+12&&run.y+PH>=p.y&&run.x+PW>p.x+3&&run.x<p.x+p.w-3){run.y=p.y-PH;run.vy=0;run.support=p.id;landed=true;break}}
 if(landed){run.jumps=0;run.coyote=6}else run.coyote=Math.max(0,run.coyote-dt);
 // Wind only nudges an airborne character; it never prevents crossing on the ground.
 if(l.wind&&run.support===null&&!landed&&run.x>l.wind.x&&run.x<l.wind.x+l.wind.w)run.x+=.38*dt;
 for(const [i,x] of l.checkpoints.entries())if(i>run.checkpoint&&run.x>=x&&run.y+PH<=FLOOR+5){run.checkpoint=i;flash('チェックポイントに到着')}
 if(run.y>H+90){hurt();return}
 for(const h of l.hazards){const x=h.x+(h.ax||0)*Math.sin(time*.025);if(intersects({x:run.x+5,y:run.y+10,w:PW-10,h:PH-10},{x,y:FLOOR-h.h,w:h.w,h:h.h})){hurt();break}}
 collect();if(run.x>l.length-180){if(run.got.every(Boolean)&&gateOpen()){finish();return}if(time>toastAt)flash(!gateOpen()?'出口の準備には、スイッチをすべてONにしてください':'出口へ届けるしおりが、まだ'+(3-run.got.filter(Boolean).length)+'枚あります')}
 camera+=(Math.max(0,Math.min(l.length-W,run.x-330))-camera)*Math.min(1,.14*dt);
 if(time>hudAt){updateHud();hudAt=time+6}if(time>toastAt){const lever=nearLever();const message=lever>=0?'「調べる」で'+l.levers[lever].name+'を切り替える。現在 '+(run.levers[lever]?'ON':'OFF'):l.hint;if($('hint').textContent!==message)$('hint').textContent=message}
 $('dash').classList.toggle('cooldown',run.dashCooldown>0);
}
function updateHud(){$('stageName').textContent=String(stage+1).padStart(2,'0')+' / '+levels[stage].name;$('bookCount').textContent=run.got.filter(Boolean).length+' / 3';$('noteCount').textContent=run.notes.filter(Boolean).length+' / 3';$('health').textContent='♥ '.repeat(Math.max(0,run.hp))+'♡ '.repeat(3-Math.max(0,run.hp));$('clock').textContent=format(run.elapsed)}
function renderJournal(){const tabs=$('stageTabs'),records=$('records');tabs.replaceChildren();records.replaceChildren();levels.forEach((l,i)=>{const b=document.createElement('button');b.type='button';b.disabled=i>=profile.unlocked;b.setAttribute('aria-current',String(i===stage));b.textContent=String(i+1).padStart(2,'0')+' / '+l.name;const sub=document.createElement('small');sub.textContent=b.disabled?'前のエリアをクリアして解放':l.subtitle;b.append(sub);b.onclick=()=>selectStage(i);tabs.append(b);const card=document.createElement('article');card.className='record';const heading=document.createElement('h3');heading.textContent=String(i+1).padStart(2,'0')+' / '+l.name;card.append(heading);const r=profile.records[i];for(const text of [r?'自己ベスト '+format(r.best):'自己ベスト —',r?'最高評価 '+r.grade:'最高評価 —','メモ '+profile.notes.filter(n=>Math.floor(n/3)===i).length+'/3',r?.clean?'ノーミス 達成':'ノーミス 未達成']){const p=document.createElement('p');p.textContent=text;card.append(p)}const retry=document.createElement('button');retry.textContent=r?'記録を更新しに行く':'ここから遊ぶ';retry.disabled=i>=profile.unlocked;retry.onclick=()=>selectStage(i);card.append(retry);records.append(card)});
 $('collectionCount').textContent='思い出 '+profile.notes.length+' / 9';const ach=$('achievements');ach.replaceChildren();const achievements=[['初めてのしおり便',profile.records.some(Boolean)],['学園をひとまわり',profile.records.every(Boolean)],['一度も転ばず',profile.records.some(r=>r?.clean)],['思い出を全部',profile.notes.length===9],['3つのS評価',profile.records.every(r=>r?.grade==='S')]];for(const [name,done] of achievements){const el=document.createElement('span');el.className='achievement'+(done?' done':'');el.textContent=(done?'✓ ':'○ ')+name;ach.append(el)}const list=$('memoryList');list.replaceChildren();for(let i=0;i<9;i++){const p=document.createElement('p'),b=document.createElement('b');b.textContent=profile.notes.includes(i)?String(i+1).padStart(2,'0')+' / '+memories[i][0]:String(i+1).padStart(2,'0')+' / まだ見つかっていないメモ';p.append(b);if(profile.notes.includes(i)){const text=document.createElement('span');text.textContent=memories[i][1];p.append(text)}list.append(p)}$('epilogue').hidden=profile.notes.length!==9;$('epilogue').textContent='思い出コンプリート — 麗の放課後便り\n「しおりも、メモも。全部見つけてくれたんだね。……私の放課後に付き合ってくれて、ありがとう。次は、探しものがなくても一緒に歩こう？」'}
function bookmark(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(-.08);ctx.shadowColor='#72587988';ctx.shadowBlur=8;ctx.fillStyle='#ead9ed';ctx.strokeStyle='#70527f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-14,-25);ctx.lineTo(14,-25);ctx.lineTo(14,24);ctx.lineTo(0,14);ctx.lineTo(-14,24);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#a677a3';ctx.fillRect(-12,-23,24,7);ctx.strokeStyle='#816084';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(5,-11);ctx.lineTo(7,1);ctx.lineTo(-4,6);ctx.stroke();for(const [a,b] of [[-6,-6],[5,-11],[7,1],[-4,6]]){ctx.fillStyle='#fff5cf';ctx.beginPath();ctx.arc(a,b,2.5,0,Math.PI*2);ctx.fill()}ctx.restore()}
function memo(x,y){ctx.save();ctx.translate(x,y);ctx.rotate(.09);round(-16,-20,32,39,3,'#fff1be');ctx.fillStyle='#c0947e';ctx.fillRect(-8,-7,17,2);ctx.fillRect(-8,0,14,2);ctx.fillRect(-8,7,17,2);ctx.fillStyle='#8b6b90';ctx.fillRect(-7,-25,14,8);ctx.restore()}
function backdrop(){const image=assets[levels[stage].bg];if(image){const width=H*image.naturalWidth/image.naturalHeight,shift=(camera*.13)%width;for(let x=-shift;x<W;x+=width)ctx.drawImage(image,x,0,width,H)}else{ctx.fillStyle='#d8cbb6';ctx.fillRect(0,0,W,H)}if(stage===2){ctx.fillStyle='#b67b9720';ctx.fillRect(0,0,W,H)}}
function world(){const l=levels[stage];ctx.save();ctx.translate(-camera,0);round(0,FLOOR,l.length,H-FLOOR,0,'#626877');ctx.fillStyle='#aa9aa7';ctx.fillRect(0,FLOOR,l.length,8);for(const g of l.gaps){ctx.fillStyle='#25263b';ctx.fillRect(g.x,FLOOR,g.w,H-FLOOR);ctx.strokeStyle='#c8b5a7';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(g.x,FLOOR);ctx.lineTo(g.x,H);ctx.moveTo(g.x+g.w,FLOOR);ctx.lineTo(g.x+g.w,H);ctx.stroke()}
 for(const [i,p] of surfaces().entries()){round(p.x,p.y,p.w,14,3,p.ax||p.ay?'#f1cba9':'#e6d8dc');ctx.strokeStyle='#a07f8e';ctx.lineWidth=2;ctx.strokeRect(p.x+3,p.y+2,p.w-6,12);round(p.x+8,p.y+14,p.w-16,8,2,'#7c7188');if(p.ax||p.ay){ctx.font='14px sans-serif';ctx.fillStyle='#443c55';ctx.fillText(p.ay?'↕':'↔',p.x+p.w/2-6,p.y+12)}}
 for(const h of l.hazards){const x=h.x+(h.ax||0)*Math.sin(time*.025);if(h.h>25){round(x,FLOOR-h.h,h.w,h.h-8,5,'#788194');round(x+8,FLOOR-11,12,12,6,'#3a3e56');round(x+h.w-20,FLOOR-11,12,12,6,'#3a3e56');for(let i=0;i<3;i++)round(x+9,FLOOR-h.h+7+i*8,h.w-18,5,1,['#d6b3bb','#c5bdde','#ecd7aa'][i])}else{for(let i=0;i<4;i++){ctx.save();ctx.translate(x+i*19,FLOOR-11-i%2*4);ctx.rotate((i%2?.1:-.1));round(0,-4,27,9,2,i%2?'#cbb5cc':'#f3dcc0');ctx.restore()}}}
 l.levers.forEach((s,i)=>{round(s.x-20,s.y-31,40,37,6,run.levers[i]?'#bdd6c2':'#eadbc0');ctx.strokeStyle='#50465e';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.x,s.y-7);ctx.lineTo(s.x+(run.levers[i]?10:-10),s.y-24);ctx.stroke();ctx.font='bold 13px sans-serif';ctx.fillStyle='#423e53';ctx.fillText(run.levers[i]?'ON':'OFF',s.x-13,s.y+22);ctx.fillStyle='#282b40dc';round(s.x-42,s.y+29,84,23,5,'#282b40dc');ctx.fillStyle='#fff2db';ctx.font='12px sans-serif';ctx.fillText('調べる / E',s.x-32,s.y+45)});
 if(!gateOpen()){const x=l.gate.x;round(x,125,32,FLOOR-125,4,'#75677b');ctx.strokeStyle='#ded1c4';ctx.lineWidth=2;for(let y=135;y<FLOOR;y+=25){ctx.beginPath();ctx.moveTo(x+4,y);ctx.lineTo(x+28,y+13);ctx.stroke()}round(x-40,265,115,30,5,'#38354adc');ctx.fillStyle='#fff0d5';ctx.font='13px sans-serif';ctx.fillText('スイッチ '+run.levers.filter(Boolean).length+'/'+l.levers.length,x-28,285)}else{round(l.gate.x,100,32,20,3,'#94bda2')}
 l.books.forEach((b,i)=>{if(!run.got[i])bookmark(b.x,b.y+Math.sin(time*.045+i)*3)});l.notes.forEach((n,i)=>{if(!run.notes[i])memo(n.x,n.y+Math.sin(time*.035+i)*2)});
 l.checkpoints.forEach((x,i)=>{if(i===0)return;round(x-10,FLOOR-31,24,31,4,i<=run.checkpoint?'#bad9bf':'#e8ded0');ctx.fillStyle='#66516b';ctx.font='bold 13px sans-serif';ctx.fillText('✓',x-4,FLOOR-10)});
 const exit=l.length-165;round(exit,290,95,145,7,'#6c6179');round(exit+9,302,77,133,3,run.got.every(Boolean)&&gateOpen()?'#99bea9':'#b8abbd');ctx.fillStyle='#fff5dc';ctx.font='bold 17px sans-serif';ctx.fillText('しおり便',exit+10,282);round(exit+69,383,8,8,4,'#67516d');
 if(l.wind){ctx.strokeStyle='#edf4ff55';ctx.lineWidth=2;for(let i=0;i<7;i++){const x=l.wind.x+(i*67+time*.9)%l.wind.w;ctx.beginPath();ctx.moveTo(x,290+i%3*25);ctx.lineTo(x+45,285+i%3*25);ctx.stroke()}}
 ctx.restore()}
function drawRei(){if(!assets.rei||(run.invuln>0&&Math.floor(time/5)%2))return;ctx.save();ctx.translate(run.x-camera+PW/2,run.y+PH);ctx.scale(facing,1);const height=107,width=height*assets.rei.width/assets.rei.height;if(playing&&run.vx&&run.vy===0)ctx.translate(0,Math.sin(time*.3)*1.4);if(run.dashTicks>0){ctx.globalAlpha=.25;ctx.drawImage(assets.rei,-width/2-16,-height,width,height);ctx.globalAlpha=1}ctx.drawImage(assets.rei,-width/2,-height,width,height);ctx.restore()}
function render(){ctx.clearRect(0,0,W,H);backdrop();world();drawRei()}
function frame(ms){if(!last)last=ms;const dt=Math.min(2,(ms-last)/16.667||1);last=ms;update(dt);render();requestAnimationFrame(frame)}
renderJournal();updateHud();requestAnimationFrame(frame);
Promise.all([ReiAssets.load('rei-uniform-smile.png',true),ReiAssets.load('school-classroom.png'),ReiAssets.load('school-hallway.png')]).then(([rei,classroom,hallway])=>{assets={rei,classroom,hallway};assetsReady=true;intro()}).catch(()=>{$('panelText').textContent='画像を読み込めませんでした。通信状態を確認し、ページを再読み込みしてください。';$('mainAction').textContent='読み込みエラー'});
})();
