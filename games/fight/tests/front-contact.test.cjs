const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const c={window:{},Image:class{constructor(){this.complete=false}}};vm.createContext(c);for(const file of ['engine.js','render.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),c);const E=c.window.LaboFight,R=c.window.LaboFightRender;
function scene(id=0,enemy=1,sign=1,distance=200){const s=E.create('friend',[id,enemy]);s.phase='fight';s.f[0].x=sign>0?350:850;s.f[1].x=s.f[0].x+sign*distance;s.f[0].face=sign;s.f[1].face=-sign;s.f[0].meter=100;return s;}
function quarter(s,button){const f=s.f[0],sign=f.face;f.dir=[sign,0];f.motions=[{dx:0,dy:1,t:0},{dx:sign,dy:0,t:1}];s.frame=1;return E.choose(s,0,button);}
for(const id of [0,1,2])for(const sign of [-1,1]){
 const s=scene(0,id,sign),e=s.f[1],neutral=E.hurtboxes(e);assert.equal(neutral.length,3);assert.deepEqual(Array.from(neutral,b=>b.part),['head','torso','legs']);const front=b=>sign>0?e.x-b.left:b.right-e.x;
 assert(neutral.every(b=>front(b)>0),'receiving shapes cover the visible facing side');e.dir=[0,1];const crouch=E.hurtboxes(e);assert(crouch[0].top>neutral[0].top);assert(front(crouch[1])>front(neutral[1]));e.dir=[0,0];e.y=-100;const air=E.hurtboxes(e);assert(air[2].right-air[2].left!==neutral[2].right-neutral[2].left);e.y=0;e.action=E.choose(s,1,'P');assert(front(E.hurtboxes(e)[1])>front(neutral[1]),'attacking lean exposes the forward body');
}
for(const sign of [-1,1]){
 const visible=scene(0,1,sign,200);assert(E.hit(visible,0,E.choose(visible,0,'P')),'recorded standing P reaches the visible front of Nuts at distance 200');
 for(const air of [false,true])for(const button of ['P','K']){
  const s=scene(0,1,sign,320);if(air)s.f.forEach(f=>f.y=-100);if(!air&&button==='P')continue;const m=quarter(s,button);assert(m.rulerArt||m.kind==='rulerDraw');assert(E.hit(s,0,m),'ruler can pick up a target well beyond the former 176/184 range');assert(!m.projectile);assert.equal(s.f[0].meter,air&&button==='P'?76:100);const miss=scene(0,1,sign,450);if(air)miss.f.forEach(f=>f.y=-100);assert(!E.hit(miss,0,quarter(miss,button)),'long ruler still has a finite forward limit');
 }
 const s=scene(2,0,sign,390),m=quarter(s,'P');assert.equal(m.range,350);assert.equal(s.f[0].meter,70);assert(E.hit(s,0,m),'plugin reaches beyond the previous cable end');const miss=scene(2,0,sign,450);assert(!E.hit(miss,0,quarter(miss,'P')));const back=scene(2,0,sign,-250);assert(!E.hit(back,0,quarter(back,'P')),'forward cable cannot hit behind the caster');
 const f=scene().f[0];for(const [kind,grip] of [['up',[85,-275]],['down',[50,-80]]]){f.action={type:'basic',kind:'kick',rulerArt:true,launcher:kind==='up',high:kind==='down',tipX:270,tipY:-145,frame:10,start:8,hits:[10]};const b=R.rulerBlade(f,f.action);assert.equal(b.handX,grip[0]);assert.equal(b.handY,grip[1]);assert(Math.hypot(b.tipX-b.handX,b.tipY-b.handY)>150,'long ruler stays rooted in the dedicated swing hand');}
}
console.log('Front contact: mirrored head/torso/leg receiving shapes, crouch/air/attack poses, recorded P at distance 200, long ruler pickup/whiff and plugin forward-only edge/cost, and weapon grip alignment passed');
