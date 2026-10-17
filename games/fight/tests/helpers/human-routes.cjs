const {E,runRei}=require('./character-routes.cjs');
function runHuman({id=0,enemy=2,sign=1,finish='special',jitter=0}={}){
 const s=E.create('training',[id,enemy]);s.phase='fight';s.infinite=false;s.f[0].meter=100;s.f[0].x=id===2?(sign>0?980:220):(sign>0?360:740);s.f[1].x=s.f[0].x+sign*90;s.f[0].face=sign;s.f[1].face=-sign;
 let commands=[];const d=(n,x,y)=>commands.push({n,dir:[x*sign,y]}),b=(n,button)=>commands.push({n,button});
 if(id===0){commands=runRei({enemy,sign,special:-1}).commands.map(q=>({...q,dir:q.dir&&[...q.dir]}));for(const q of commands){if(q.n===38)q.n=32;if(q.n===39)q.n=36;if(q.n===148)q.n=144;if(q.n===149)q.n=147;}d(186,0,1);d(190,-1,1);d(194,-1,0);b(194,'K');d(195,0,0);}
 else{d(0,0,1);d(4,-1,1);d(8,-1,0);b(8,'K');d(9,0,0);d(50,0,-1);b(54,'P');b(62,'K');d(71,0,0);d(72,0,-1);b(73,'P');b(81,'K');d(91,0,1);d(95,1,1);d(99,1,0);b(99,'P');d(100,0,0);d(121,1,0);d(124,0,0);d(127,1,0);b(128,'P');b(137,'K');if(finish==='special'){d(147,0,1);d(151,-1,1);d(155,-1,0);b(155,'K');d(156,0,0);}else{d(155,1,0);b(155,'S');}}
 // A small deterministic offset tests input variation without changing direction paths.
 if(jitter)for(let i=0;i<commands.length;i++)if((commands[i].button==='P'||commands[i].button==='K')&&!commands.some(q=>q!==commands[i]&&q.dir&&q.n===commands[i].n))commands[i].n+=((i%3)-1)*jitter;
 commands.sort((a,b)=>a.n-b.n);const frames=[],hits=[],inputs=[];let next=0,last=0;
 for(let real=0;real<850;real++){while(next<commands.length&&commands[next].n<=s.frame){const q=commands[next++];if(q.dir)E.direction(s,0,...q.dir);if(q.button)E.press(s,0,q.button);inputs.push({...q,real});}E.advance(s);if(s.f[0].combo>last){last=s.f[0].combo;hits.push({n:real,sim:s.frame,count:last,name:s.f[0].action?.name,damage:s.f[0].comboDamage,down:s.f[1].down});}frames.push(JSON.parse(JSON.stringify(s)));if(s.frame>=(id===0?290:250))break;}
 return {s,frames,hits,inputs,commands};
}
module.exports={E,runHuman};
