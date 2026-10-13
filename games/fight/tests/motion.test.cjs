const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const images=[],root={window:{},Image:class{constructor(){this.complete=true;this.naturalWidth=1536;images.push(this);}addEventListener(){}}};vm.createContext(root);const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');vm.runInContext(read('engine.js'),root);vm.runInContext(read('render.js'),root);const E=root.window.LaboFight,R=root.window.LaboFightRender;
for(let id=0;id<3;id++){
 const s=E.create('training',[id,1]);s.phase='fight';s.f[0].x=200;s.f[1].x=800;E.direction(s,0,1,0);const frames=new Set();for(let n=0;n<40;n++){E.step(s);frames.add(R.motionFrame(s.f[0]));}assert.equal(frames.size,4,'walking uses four distinct frames');const phase=s.f[0].walkPhase;E.direction(s,0,0,0);E.step(s);assert.equal(R.motionFrame(s.f[0]),null,'standing does not animate walk');assert.equal(s.f[0].walkPhase,phase);
 const f=s.f[0];f.x=895;E.direction(s,0,1,0);E.step(s);assert.equal(R.motionFrame(f),null,'wall does not count as movement');
 for(const button of ['P','K']){
  f.dir=[0,1];f.action=E.choose(s,0,button);f.action.frame=8;assert(f.action.low);assert.equal(R.motionFrame(f),button==='P'?4:5);const layout=R.motionLayouts[id][R.motionFrame(f)];assert(layout.scale>.4,'crouch artwork stays at normal scale');assert( E.hurtbox(f).bottom-E.hurtbox(f).top>=160,'crouch body is not collapsed');
  let balance=0,draws=[],scales=[];const c=new Proxy({canvas:{width:960,height:540},save(){balance++;},restore(){balance--;},drawImage(...a){draws.push(a);},scale(...a){scales.push(a);},createLinearGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true;}});R.draw(c,s);assert.equal(balance,0);assert(draws.some(a=>a[0].src.includes('motion-v1.png')),'dedicated crouch artwork rendered');assert(!scales.some(a=>a[1]===.35),'whole sprite is never squashed');
  f.action=null;
 }
}
{const s=E.create('training');s.phase='fight';E.direction(s,0,0,1);E.press(s,0,'K');E.direction(s,0,0,0);E.step(s);assert(s.f[0].action.low,'quick crouch+attack preserves direction at button press');s.f[0].action.frame=8;assert.equal(R.motionFrame(s.f[0]),5);}
console.log('Motion: four-frame walking, idle/wall stop, dedicated crouch P/K and full body proportions passed');
