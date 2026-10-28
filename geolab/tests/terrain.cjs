'use strict';
const assert=require('assert'),d3=require('../assets/d3.min.js');
const {TerrainTiles,planTiles,tileURL}=require('../terrain.js');
const view={k:1,x:0,y:0},scale=1000,translate=[-800,2100];
const projected=d3.geoMercator().scale(scale).translate(translate);
// Geographic points lie in exactly the same pixels in the vector and tile layers.
for(const coord of [[71.43,51.17],[76.89,43.24],[86.59,49.81],[0,0],[-77,39],[150,-35]]){
 for(const k of [1,4,16,32]){
  const v={k,x:-400,y:180},p=planTiles(scale,translate,v,900,600,2),z=p.zoom,n=2**z;
  const lon=coord[0]*Math.PI/180,lat=coord[1]*Math.PI/180;
  const u=(lon+Math.PI)/(2*Math.PI),a=Math.log(Math.tan(Math.PI/4+lat/2)),t=(Math.PI-a)/(2*Math.PI);
  const fromTile=[p.left+u*n*p.size,p.top+t*n*p.size],fromVector=projected(coord).map((x,i)=>x*k+(i?v.y:v.x));
  assert(Math.abs(fromTile[0]-fromVector[0])<1e-8&&Math.abs(fromTile[1]-fromVector[1])<1e-8,'Tile/vector misalignment');
 }
}
const coarse=planTiles(1000,[400,300],view,900,600,1),fine=planTiles(1000,[400,300],{k:8,x:-2800,y:-2100},900,600,1);
assert(fine.zoom>=coarse.zoom+3,'Zoom does not request sharper source data');
for(const [w,h,dpr] of [[360,440,1],[900,600,2],[1920,1080,2],[3840,2160,3]]){
 const p=planTiles(3500,[-2000,6000],view,w,h,dpr);
 assert(p.tiles.length<=128,`Too many tiles ${p.tiles.length}`);
 assert(p.tiles.every(t=>t.x>=0&&t.x<2**t.z&&t.y>=0&&t.y<2**t.z));
 for(const t of p.tiles){const x=p.left+t.x*p.size,y=p.top+t.y*p.size;assert(x<w&&x+p.size>0&&y<h&&y+p.size>0,'Offscreen prefetch')}
}
assert(!planTiles(10,[0,0],{k:1,x:100000,y:100000},900,600,1).tiles.length,'Out-of-world requests');
assert(tileURL(7,92,44).endsWith('/7/44/92.jpg'),'WMTS row/column order');
console.log('PASS: tile/vector alignment at 4 zoom scales, sharper sources on zoom, HiDPI and 128-tile budget, visible-only requests, WMTS URL order');
function makeLayer(){const layer={children:[],ownerDocument:{createElementNS(){return{attributes:{},setAttribute(k,v){this.attributes[k]=v},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this)}}}},appendChild(node){if(node.parent)node.remove();this.children.push(node);node.parent=this}};return layer}
const images=[],states=[];
function makeImage(){const im={naturalWidth:256,onload:null,onerror:null,_src:'',set src(x){this._src=x},get src(){return this._src}};images.push(im);return im}
const m=new TerrainTiles({createImage:makeImage,onStatus:s=>states.push(s),pixelRatio:()=>1});
const options={scale:1000,translate:[400,300],width:900,height:600,transform:view};
m.mount(makeLayer(),options);m.flush();assert(m.active<=6&&m.active>0);
for(let i=0;i<images.length;i++)if(images[i].onload)images[i].onload();
assert(states.at(-1).state==='ready');assert(m.nodes.size===m.plan.tiles.length);const made=images.length;
m.mount(makeLayer(),options);m.flush();assert(images.length===made,'Cache lost on answer/category rerender');
m.update({k:2,x:-400,y:-300});m.flush();assert(m.nodes.size>0,'Ready parents disappeared during zoom');
for(let i=made;i<images.length;i++)if(images[i].onload)images[i].onload();
assert(states.at(-1).state==='ready');
m.update({k:4,x:-1200,y:-900});m.flush();assert(m.active<=6);const canceled=images.filter(i=>i.onload).slice();m.mount(null,{});assert(m.active===0);assert(canceled.every(i=>i.src===''),'Obsolete downloads continue');assert(states.at(-1).state==='inactive');
console.log('PASS: six concurrent downloads, shared cache, parent tiles kept while zooming, cancellation when switching layers or returning home');
const badImages=[],badStates=[];const bad=new TerrainTiles({createImage:()=>{const im=makeImage();badImages.push(im);return im},onStatus:s=>badStates.push(s),pixelRatio:()=>1});
bad.mount(makeLayer(),options);bad.flush();for(let i=0;i<badImages.length;i++)if(badImages[i].onerror)badImages[i].onerror();
assert(badStates.at(-1).state==='error');assert(bad.nodes.size===0,'Broken tiles should not obscure the overview');const failed=badImages.length;bad.flush();assert(badImages.length===failed,'Retry loop without backoff');bad.retry();assert(badImages.length>failed,'Manual retry failed');
bad.mount(null,{});m.mount(null,{});
console.log('PASS: graceful failure without broken images, retry backoff, explicit retry');
