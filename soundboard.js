'use strict';
(() => {
const $=id=>document.getElementById(id), storageKey='nattsun-labo-soundboard-v1';
const presets=[['正解','◎','q','correct'],['不正解','×','w','wrong'],['決定','✓','e','confirm'],['通知','♪','r','notice'],['ドラムロール','◌','a','roll'],['ファンファーレ','✦','s','fanfare'],['カウントダウン','3→1','d','count'],['タイムアップ','⌛','f','time'],['ひらめき','✧','z','idea'],['登場','↗','x','enter'],['退場','↘','c','exit'],['きらきら','☆','v','sparkle']];
let ctx,master,settings={};
const sources=new Set(), playingButtons=new Map(), customAudios=new Set();
try{settings=JSON.parse(localStorage.getItem(storageKey)||'{}')||{};}catch{}
for(const id of ['se-volume','bgm-volume'])if(Number.isFinite(settings[id]))$(id).value=Math.max(0,Math.min(100,settings[id]));
for(const id of ['overlap','keys','loop'])if(typeof settings[id]==='boolean')$(id).checked=settings[id];
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(['se-volume','bgm-volume','overlap','keys','loop'].map(id=>[id,$(id).type==='checkbox'?$(id).checked:Number($(id).value)]))));}catch{}};
function volumes(){const se=Number($('se-volume').value)/100,bgm=Number($('bgm-volume').value)/100;$('se-value').textContent=Math.round(se*100)+'%';$('bgm-value').textContent=Math.round(bgm*100)+'%';if(master)master.gain.value=se;for(const a of customAudios)a.volume=se;$('bgm').volume=bgm;$('bgm').loop=$('loop').checked;}
for(const id of ['se-volume','bgm-volume','overlap','keys','loop'])$(id).addEventListener('input',()=>{volumes();save();});volumes();
async function audioReady(){const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)throw Error('このブラウザでは標準効果音を再生できません。');if(!ctx){ctx=new AudioCtor();master=ctx.createGain();master.gain.value=Number($('se-volume').value)/100;const limit=ctx.createDynamicsCompressor();limit.threshold.value=-12;limit.ratio.value=8;master.connect(limit);limit.connect(ctx.destination);}if(ctx.state!=='running')await ctx.resume();if(ctx.state!=='running')throw Error('音声を開始できませんでした。もう一度ボタンを押してください。');}
function note(freq,start,duration,kind='sine',level=.2,endFreq){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind;osc.frequency.setValueAtTime(freq,start);if(endFreq)osc.frequency.exponentialRampToValueAtTime(endFreq,start+duration);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain);gain.connect(master);sources.add(osc);osc.onended=()=>{sources.delete(osc);osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.02);}
function noise(start,duration,level=.18){const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1800;gain.gain.setValueAtTime(level,start);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);source.connect(filter);filter.connect(gain);gain.connect(master);sources.add(source);source.onended=()=>{sources.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};source.start(start);source.stop(start+duration);}
function synth(type){const t=ctx.currentTime+.015;let duration=1;switch(type){
case 'correct':note(784,t,.24);note(1047,t+.17,.5);duration=.7;break;
case 'wrong':note(155,t,.6,'sawtooth',.12,105);duration=.65;break;
case 'confirm':note(520,t,.08,'triangle');note(900,t+.07,.18,'triangle');duration=.3;break;
case 'notice':note(660,t,.32);note(880,t+.19,.45);duration=.7;break;
case 'roll':for(let i=0;i<36;i++){const at=t+i*.055;noise(at,.065,.11+i*.003);note(130,at,.04,'triangle',.12);}duration=2.1;break;
case 'fanfare':[523,659,784,1047].forEach((f,i)=>note(f,t+i*.16,.4,'triangle',.16));duration=1;break;
case 'count':for(let i=0;i<3;i++)note(700,t+i,.16,'sine',.2);note(1200,t+3,.45,'triangle',.2);duration=3.5;break;
case 'time':for(let i=0;i<3;i++)note(220,t+i*.25,.18,'square',.09);duration=.8;break;
case 'idea':note(1200,t,.65,'sine',.2);note(1800,t+.03,.5,'sine',.07);duration=.7;break;
case 'enter':note(220,t,.65,'triangle',.2,900);duration=.7;break;
case 'exit':note(800,t,.65,'triangle',.18,140);duration=.7;break;
case 'sparkle':[1050,1570,1320,2100,1760,2400].forEach((f,i)=>note(f,t+i*.1,.4,'sine',.12));duration=1;break;
}return duration;}
function mark(button,duration){const old=playingButtons.get(button);if(old)clearTimeout(old);button.classList.add('playing');button.setAttribute('aria-pressed','true');if(duration)playingButtons.set(button,setTimeout(()=>unmark(button),duration*1000));}
function unmark(button){clearTimeout(playingButtons.get(button));playingButtons.delete(button);button.classList.remove('playing');button.setAttribute('aria-pressed','false');}
function stopEffects(){for(const source of sources){try{source.stop();}catch{}}sources.clear();for(const a of customAudios){a.pause();a.currentTime=0;}for(const button of [...playingButtons.keys()])unmark(button);}
async function playPreset(p,button){try{if(!$('overlap').checked)stopEffects();await audioReady();const seconds=synth(p[3]);mark(button,seconds+.1);$('status').textContent=p[0]+'を再生中';}catch(e){$('status').textContent=e.message;}}
function makePad(label,symbol,key){const b=document.createElement('button');b.className='pad';b.type='button';b.setAttribute('aria-pressed','false');const icon=document.createElement('span');icon.className='symbol';icon.textContent=symbol;const name=document.createElement('span');name.textContent=label;const hint=document.createElement('small');hint.textContent=key?key.toUpperCase():'端末内の音源';b.append(icon,name,hint);return b;}
presets.forEach(p=>{const b=makePad(p[0],p[1],p[2]);b.onclick=()=>playPreset(p,b);$('pads').append(b);});
$('stop-se').onclick=()=>{stopEffects();$('status').textContent='効果音を停止しました。';};
function stopBGM(){$('bgm').pause();$('bgm').currentTime=0;}
$('stop-all').onclick=()=>{stopEffects();stopBGM();$('status').textContent='すべての音を停止しました。';};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){stopEffects();stopBGM();$('status').textContent='すべての音を停止しました。';return;}if(!$('keys').checked||e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.target.closest('input,textarea,select,button,[contenteditable]'))return;const i=presets.findIndex(p=>p[2]===e.key.toLowerCase());if(i>=0){e.preventDefault();playPreset(presets[i],$('pads').children[i]);}});
$('bgm-start').onclick=async()=>{try{await $('bgm').play();$('bgm-status').textContent='BGMを再生中';}catch{$('bgm-status').textContent='BGMを再生できません。ファイル形式や通信状況をご確認ください。';}};
$('bgm-pause').onclick=()=>{$('bgm').pause();$('bgm-status').textContent='一時停止しました。';};$('bgm-stop').onclick=()=>{stopBGM();$('bgm-status').textContent='BGMを停止しました。';};
$('track').onchange=()=>{stopBGM();$('bgm').src=$('track').value;$('bgm').load();$('bgm-status').textContent='曲を切り替えました。「BGMを再生」で開始します。';};
$('bgm').onerror=()=>{$('bgm-status').textContent='この音源を再生できません。対応形式・通信状況をご確認ください。';};
const validFile=f=>f.type.startsWith('audio/')||/\.(mp3|wav|m4a|ogg|aac|flac)$/i.test(f.name);
const library=new Map();
let dbPromise, ready=false, busy=false;
function openLibrary(){
 if(dbPromise)return dbPromise;
 dbPromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('このブラウザでは音源を保存できません。'));return;}
  const req=window.indexedDB.open('nattsun-labo-audio',1);
  const timer=setTimeout(()=>reject(Error('音源の保存先を開けません。ほかのタブを閉じて再読み込みしてください。')),8000);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('sounds'))req.result.createObjectStore('sounds',{keyPath:'id'});};
  req.onsuccess=()=>{clearTimeout(timer);req.result.onversionchange=()=>req.result.close();resolve(req.result);};
  req.onerror=()=>{clearTimeout(timer);reject(req.error);};
 });return dbPromise;
}
async function dbAction(action){
 const db=await openLibrary();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('sounds',action==='read'?'readonly':'readwrite'),store=tx.objectStore('sounds');let result,error;
  tx.oncomplete=()=>resolve(result);tx.onabort=()=>reject(error||tx.error||Error('保存に失敗しました。'));tx.onerror=()=>{};
  if(action==='read'){const req=store.getAll();req.onsuccess=()=>{result=req.result;};return;}
  if(action.remove){for(const id of action.remove)store.delete(id);return;}
  const req=store.getAll();req.onsuccess=()=>{
   const files=req.result,r=action.add;
   if(files.filter(f=>f.kind===r.kind).length>=(r.kind==='bgm'?10:12)){error=Error('保存できる件数の上限です。不要な音源を削除してください。');tx.abort();return;}
   if(files.reduce((n,f)=>n+f.size,0)+r.size>100*1024*1024){error=Error('音源の保存は合計100MBまでです。不要な音源を削除してください。');tx.abort();return;}
   store.put(r);
  };
 });
}
function refreshLibrary(){
 const rows=[...library.values()],bytes=rows.reduce((n,r)=>n+r.size,0);
 $('storage-status').textContent='このブラウザに保存：BGM '+rows.filter(r=>r.kind==='bgm').length+'曲 / 効果音 '+rows.filter(r=>r.kind==='se').length+'個 · '+(bytes/1024/1024).toFixed(1)+' / 100MB';
 $('delete-track').disabled=busy||!rows.some(r=>r.kind==='bgm'&&r.url===$('track').value);
}
function setBusy(value){busy=value;$('bgm-file').disabled=$('se-file').disabled=value||!ready;refreshLibrary();}
function storageError(e){return e?.name==='QuotaExceededError'?'端末の保存容量が足りません。不要な音源を削除してから追加してください。':(e?.message||'保存できませんでした。ブラウザの保存設定をご確認ください。');}
function attachSound(r){
 r.url=URL.createObjectURL(r.blob);library.set(r.id,r);
 if(r.kind==='bgm'){
  const o=document.createElement('option');o.value=r.url;o.textContent=r.name+'（保存済み）';$('track').append(o);r.element=o;return;
 }
 const a=new Audio(r.url),b=makePad(r.name,'♫'),wrap=document.createElement('div'),del=document.createElement('button');
 wrap.className='saved-pad';del.className='remove-sound';del.type='button';del.textContent='削除';del.setAttribute('aria-label',r.name+'を保存から削除');
 a.preload='none';a.volume=Number($('se-volume').value)/100;customAudios.add(a);r.audio=a;r.button=b;r.element=wrap;
 b.onclick=async()=>{try{if(!$('overlap').checked)stopEffects();a.currentTime=0;await a.play();mark(b);playingButtons.set(b,null);$('status').textContent=r.name+'を再生中';}catch{unmark(b);$('custom-status').textContent='この音源を再生できません。対応形式をご確認ください。';}};
 a.onended=()=>unmark(b);a.onerror=()=>{unmark(b);$('custom-status').textContent=r.name+'を読み込めませんでした。';};
 del.onclick=()=>removeSaved([r.id],'custom-status');wrap.append(b,del);$('custom-pads').append(wrap);
}
function detachSound(r){
 if(r.audio){r.audio.pause();unmark(r.button);r.audio.removeAttribute('src');r.audio.load();customAudios.delete(r.audio);}
 if(r.kind==='bgm'&&$('track').value===r.url){stopBGM();$('track').value='nattsun-bgm01.mp3';$('bgm').src='nattsun-bgm01.mp3';$('bgm').load();$('bgm-status').textContent='標準BGMに戻しました。';}
 r.element.remove();URL.revokeObjectURL(r.url);library.delete(r.id);
}
async function removeSaved(ids,status){
 if(busy)return;setBusy(true);
 try{await dbAction({remove:ids});for(const id of ids){const r=library.get(id);if(r)detachSound(r);}refreshLibrary();$(status).textContent='保存した音源を削除しました。元のファイルは残ります。';}
 catch(e){$(status).textContent=storageError(e);}finally{setBusy(false);}
}
async function importSounds(input,kind,status){
 if(!ready||busy)return;setBusy(true);let added=0,errors=[];
 const files=[...input.files];input.value='';
 try{for(const f of files){
  if(!validFile(f)||f.size>(kind==='bgm'?50:10)*1024*1024){errors.push(f.name+'：形式または容量上限を確認してください。');continue;}
  const r={id:kind+'-'+Date.now()+'-'+Math.random().toString(36).slice(2),kind,name:f.name,size:f.size,blob:f,created:Date.now()};
  try{await dbAction({add:r});attachSound(r);added++;}catch(e){errors.push(f.name+'：'+storageError(e));}
 }refreshLibrary();$(status).textContent=added+'件をこのブラウザに保存しました。'+(kind==='bgm'&&added?' 曲の選択から切り替えてください。':'')+(errors.length?' '+errors.join(' '):'');}
 finally{setBusy(false);}
}
$('bgm-file').onchange=()=>importSounds($('bgm-file'),'bgm','bgm-status');
$('se-file').onchange=()=>importSounds($('se-file'),'se','custom-status');
$('delete-track').onclick=()=>{const r=[...library.values()].find(r=>r.kind==='bgm'&&r.url===$('track').value);if(r)removeSaved([r.id],'bgm-status');};
$('track').addEventListener('change',refreshLibrary);
$('clear-custom').onclick=()=>{const ids=[...library.values()].filter(r=>r.kind==='se').map(r=>r.id);if(ids.length&&window.confirm('このブラウザに保存した効果音をすべて削除しますか？ 元のファイルは削除しません。'))removeSaved(ids,'custom-status');};
$('bgm-file').disabled=$('se-file').disabled=true;
(async()=>{try{const records=await dbAction('read');records.sort((a,b)=>a.created-b.created).forEach(attachSound);ready=true;$('bgm-file').disabled=$('se-file').disabled=false;refreshLibrary();}
catch(e){$('storage-status').textContent=storageError(e)+' 標準効果音と標準BGMは使えます。';}})();
})();
