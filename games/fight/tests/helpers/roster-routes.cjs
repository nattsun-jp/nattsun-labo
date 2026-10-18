const {E}=require('./character-routes.cjs');
function runRoute({id=2,enemy=0,sign=1,route='rush',finish='special',startMeter=100,jitter=0,low=false,startDistance=90}={}){
 const s=E.create('training',[id,enemy]);s.phase='fight';s.infinite=false;s.f[0].meter=startMeter;s.f[0].x=sign>0?360:840;s.f[1].x=s.f[0].x+sign*startDistance;s.f[0].face=sign;s.f[1].face=-sign;
 const commands=[],d=(n,x,y)=>commands.push({n,dir:[x*sign,y]}),b=(n,button)=>commands.push({n,button});
 function quarter(n,forward,button){d(n,0,1);d(n+4,forward,1);d(n+8,forward,0);b(n+8,button);d(n+9,0,0);}
 function end(n){if(finish==='special')quarter(n,-1,'K');else if(finish==='spike'){d(n,0,1);b(n,'K');}else if(finish==='super'){d(n,1,0);d(n+4,0,1);d(n+8,-1,0);b(n+8,'S');d(n+9,0,0);}else{d(n,1,0);b(n,'S');}}
 if(route==='rush'){
  for(const n of [0,13,26,71,84,97,126,145,200,224])b(n,'P');quarter(32,1,'K');b(65,'S');d(71,0,0);d(110,1,1);b(110,'K');d(122,1,-1);b(136,'K');d(143,0,0);d(144,0,-1);b(157,'K');quarter(164,1,'P');d(193,1,0);d(196,0,0);d(199,1,0);b(212,'K');b(236,'K');end(244);
 }else if(route==='giant'){
  for(const n of [0,13,26])b(n,'P');d(38,1,0);d(42,0,1);d(46,-1,0);b(46,'S');d(47,0,0);
 }else if(route==='shell'){
  quarter(0,1,'K');d(38,1,1);b(38,'K');d(50,1,-1);b(58,'P');b(68,'K');end(82);
 }else if(route==='roll'){
  quarter(0,-1,'K');b(31,'S');d(38,0,0);b(38,'P');b(51,'P');d(64,1,1);b(64,'K');d(76,1,-1);b(80,'P');b(90,'K');end(104);
 }else{
  if(low)d(0,0,1);b(0,'P');b(13,'K');d(26,1,1);b(26,'K');d(38,1,-1);b(42,'P');b(52,'K');
  if(route==='short')end(66);
  else{d(59,0,0);d(60,0,-1);b(61,'P');b(69,'K');if(route==='medium')end(84);else{d(80,1,0);d(83,0,0);d(86,1,0);b(87,'P');b(99,'K');end(112);}}
 }
 if(jitter)for(let i=0;i<commands.length;i++)if(commands[i].button!=='S'&&commands[i].button&&!commands.some(q=>q!==commands[i]&&q.dir&&q.n===commands[i].n))commands[i].n+=((i%3)-1)*jitter;
 commands.sort((a,b)=>a.n-b.n);let next=0,lastCount=0;const hits=[],frames=[],inputs=[];
 for(let n=0;n<1300;n++){while(next<commands.length&&commands[next].n<=s.frame){const q=commands[next++];if(q.dir)E.direction(s,0,...q.dir);else E.press(s,0,q.button);inputs.push({...q,real:n});}E.advance(s);const f=s.f[0];if(f.combo!==lastCount&&f.combo>0){hits.push({n,sim:s.frame,count:f.combo,name:f.action?.name,damage:f.comboDamage,down:s.f[1].down,pos:s.f.map(f=>[Math.round(f.x),Math.round(f.y)])});lastCount=f.combo;}frames.push(JSON.parse(JSON.stringify(s)));if(s.frame>420)break;}
 return {s,hits,frames,inputs,commands};
}
module.exports={E,runRoute};
