const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.join(__dirname,'..'),digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
async function run(fail){
 const requests=[],blobs=[],revoked=[];
 class AssetImage{constructor(){this.complete=false;this.naturalWidth=0}get src(){return this.source}set src(value){this.source=value;if(value.startsWith('blob:')){this.complete=true;this.naturalWidth=1254;queueMicrotask(()=>this.onload?.())}}addEventListener(){}}
 const sandbox={window:{},Image:AssetImage,Blob,URL:{createObjectURL(blob){blobs.push(blob);return 'blob:'+blobs.length},revokeObjectURL(url){revoked.push(url)}},fetch:async file=>{requests.push(file);if(fail)return {ok:false,status:404};const b=fs.readFileSync(path.join(root,file));return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}}};
 vm.createContext(sandbox);for(const name of ['engine.js','animation-data.js','ruler-animation.js','vertical-animation.js','render.js'])vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),sandbox);
 const E=sandbox.window.LaboFight,R=sandbox.window.LaboFightRender,s=E.create('training',[0,0]);s.phase='fight';const c=new Proxy({canvas:{width:960,height:540},createLinearGradient(){return {addColorStop(){}}}},{get(t,p){return p in t?t[p]:()=>{}},set(t,p,v){t[p]=v;return true}});
 R.draw(c,s);await settle();await settle();const count=requests.length;R.draw(c,s);await settle();assert.equal(requests.length,count,'repeated frames do not repeat successful or failed fetches');
 const sheets=sandbox.window.LaboFighterAnimations.sheets.filter(x=>x.character==='rei');assert.equal(count,sheets.reduce((n,x)=>n+x.parts.length,0),'only the selected character is fetched');
 if(fail){assert.equal(blobs.length,0);return}
 const expected=new Set(sheets.map(sheet=>digest(Buffer.concat(sheet.parts.map(file=>fs.readFileSync(path.join(root,file)))))));
 assert.equal(blobs.length,sheets.length);assert.equal(revoked.length,sheets.length);
 for(const blob of blobs){assert.equal(blob.type,'image/webp');const bytes=Buffer.from(await blob.arrayBuffer());assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert(expected.has(digest(bytes)),'all part bytes are reconstructed in their original order')}
}
(async()=>{await run(false);await run(true);console.log('Animation assets: lossless WebP parts assemble byte-for-byte, load once per character, revoke URLs and avoid error retry loops')})().catch(error=>{console.error(error);process.exitCode=1});
