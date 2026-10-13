/* Browser Gamepad API adapter. No accounts, network calls or paid drivers. */
window.LaboGamepad=(()=>{
 'use strict';
 const defaults={P:0,K:1,S:2,menu:9,left:14,right:15,up:12,down:13,axisX:0,axisY:1};
 const fields=['P','K','S','menu','left','right','up','down','axisX','axisY'];
 function validate(value){const out={...defaults};for(const field of fields){const v=value?.[field];if(Number.isInteger(v)&&v>=-1&&v<(field.startsWith('axis')?16:64))out[field]=v;}return out;}
 function read(pad,config=defaults){const c=validate(config),pressed=i=>i>=0&&!!(pad.buttons[i]?.pressed||pad.buttons[i]?.value>.5),axis=i=>i>=0?(pad.axes[i]||0):0;
  const horizontal=(pressed(c.right)?1:0)-(pressed(c.left)?1:0),vertical=(pressed(c.down)?1:0)-(pressed(c.up)?1:0),x=axis(c.axisX),y=axis(c.axisY);
  return {dir:[horizontal||Math.abs(x)>.4&&Math.sign(x)||0,vertical||Math.abs(y)>.4&&Math.sign(y)||0],buttons:{P:pressed(c.P),K:pressed(c.K),S:pressed(c.S),menu:pressed(c.menu)}};
 }
 function create(hooks){let device=null,lastDir=[0,0],lastButtons={},lastList='',lastStatus='',nextStatus=0,configuration={...defaults};const $=id=>document.getElementById(id);
  function load(id){try{return validate(JSON.parse(localStorage.getItem('labo-pad:'+id)||'null'));}catch{return {...defaults};}}
  function devices(){try{return Array.from(navigator.getGamepads?.()||[]).filter(p=>p&&p.connected);}catch{return [];}}
  function refresh(list){const signature=list.map(p=>p.index+':'+p.id).join('|');if(signature===lastList)return;lastList=signature;const select=$('controllerDevice'),wanted=device?.index;select.replaceChildren();for(const p of list){const o=document.createElement('option');o.value=String(p.index);o.textContent=p.id;select.append(o);}if(!list.length){const o=document.createElement('option');o.value='';o.textContent='コントローラ未検出';select.append(o);}if(list.some(p=>p.index===wanted))select.value=String(wanted);}
  function choose(list){const index=Number($('controllerDevice').value),p=list.find(p=>p.index===index)||list[0];if(p?.id!==device?.id||p?.index!==device?.index){device=p||null;configuration=device?load(device.id):{...defaults};lastButtons={};lastDir=[0,0];hooks.direction(0,0);showConfig();}return device;}
  function showConfig(){for(const field of fields)$('pad'+field).value=String(configuration[field]);}
  for(const field of fields){const select=$('pad'+field);for(let i=-1;i<(field.startsWith('axis')?16:64);i++){const o=document.createElement('option');o.value=String(i);o.textContent=i<0?'使わない':field.startsWith('axis')?'軸 '+i:'ボタン '+i;select.append(o);}}
  showConfig();$('controllerDevice').onchange=()=>{device=null;choose(devices());};
  $('controllerSave').onclick=()=>{configuration=validate(Object.fromEntries(fields.map(f=>[f,Number($('pad'+f).value)])));try{if(device)localStorage.setItem('labo-pad:'+device.id,JSON.stringify(configuration));$('controllerStatus').textContent=device?'割り当てを保存しました。':'割り当てを適用しました。接続後に保存できます。';}catch{$('controllerStatus').textContent='割り当てを適用しました（このブラウザでは保存できません）。';}lastButtons={};};
  $('controllerDefaults').onclick=()=>{configuration={...defaults};showConfig();$('controllerSave').click();};
  function poll(blocked=false,now=0){const list=devices();refresh(list);const p=choose(list);let output=p?read(p,configuration):{dir:[0,0],buttons:{}};
   if(now>=nextStatus){nextStatus=now+200;const message=p?'接続中：'+p.id:typeof navigator.getGamepads==='function'?'コントローラを接続し、ボタンを押してください。':'このブラウザではコントローラAPIを利用できません。';if(message!==lastStatus){lastStatus=message;$('controllerStatus').textContent=message;$('controllerBadge').textContent=p?'コントローラ接続中':'コントローラ未接続';}const held=p?Array.from(p.buttons).flatMap((b,i)=>b.pressed||b.value>.5?[i]:[]):[];const moved=p?Array.from(p.axes).flatMap((a,i)=>Math.abs(a)>.4?['軸'+i+':'+a.toFixed(2)]:[]):[];$('controllerLive').textContent='入力：'+(held.length?'ボタン '+held.join(', '):'―')+' / '+moved.join(' ');}
   const dir=blocked?[0,0]:output.dir;if(dir[0]!==lastDir[0]||dir[1]!==lastDir[1]){lastDir=dir;hooks.direction(...dir);}
   if(!blocked){for(const b of ['P','K','S'])if(output.buttons[b]&&!lastButtons[b])hooks.press(b);}
   // Menu remains available while paused, but no gamepad input operates a modal.
   if(!hooks.modal()&&output.buttons.menu&&!lastButtons.menu)hooks.menu();lastButtons=output.buttons;
  }
  return {poll,reset(){lastDir=[0,0];hooks.direction(0,0);},refresh(){const list=devices();refresh(list);choose(list);}};
 }
 return {defaults,validate,read,create};
})();
