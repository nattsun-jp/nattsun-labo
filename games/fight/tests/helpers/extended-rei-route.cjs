const {E,runHuman}=require('./human-routes.cjs');
function runExtendedRei({enemy=2,sign=1,finishAt=248,startMeter=0,jitter=0}={}){const s=E.create('training',[0,enemy]);s.phase='fight';s.infinite=false;s.f[0].meter=startMeter;s.f[0].x=sign>0?360:740;s.f[1].x=s.f[0].x+sign*90;s.f[0].face=sign;s.f[1].face=-sign;
const commands=runHuman({enemy,sign}).commands.filter(q=>q.n<144),d=(n,x,y)=>commands.push({n,dir:[x*sign,y]}),b=(n,button)=>commands.push({n,button});
function qcf(n,button='P'){d(n,0,1);d(n+4,1,1);d(n+8,1,0);b(n+8,button);d(n+9,0,0);}
qcf(144);d(177,1,0);d(180,0,0);d(183,1,0);b(184,'P');b(196,'K');qcf(208,'K');
// Second ground launch after the falling slash.
if(finishAt){b(finishAt,'P');b(finishAt+13,'K');d(finishAt+26,1,1);b(finishAt+26,'K');d(finishAt+38,1,-1);b(finishAt+42,'P');d(finishAt+48,-1,0);d(finishAt+52,0,1);d(finishAt+56,1,0);b(finishAt+56,'S');d(finishAt+57,0,0);}
if(jitter)for(let i=0;i<commands.length;i++)if(commands[i].button&&commands[i].button!=='S'&&!commands.some(q=>q!==commands[i]&&q.dir&&q.n===commands[i].n))commands[i].n+=((i%3)-1)*jitter;
commands.sort((a,b)=>a.n-b.n);let next=0,last=0;const hits=[],frames=[],inputs=[];for(let real=0;real<1400;real++){while(next<commands.length&&commands[next].n<=s.frame){let q=commands[next++];if(q.dir)E.direction(s,0,...q.dir);else E.press(s,0,q.button);inputs.push({...q,real});}E.advance(s);if(s.f[0].combo>last){last=s.f[0].combo;hits.push({n:real,sim:s.frame,count:last,name:s.f[0].action?.name,damage:s.f[0].comboDamage,down:s.f[1].down,pos:s.f.map(f=>[Math.round(f.x),Math.round(f.y)]),meter:Math.round(s.f[0].meter)});}frames.push(JSON.parse(JSON.stringify(s)));if(s.frame>600)break;}return {s,hits,frames,commands,inputs};}
module.exports={E,runExtendedRei};
