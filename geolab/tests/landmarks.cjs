'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),d3=require('../assets/d3.min.js');
const a=require('../landmarks.js'),models=a.buildModels();
assert.deepStrictEqual(models.map(m=>m.id),['pyramid','eiffel','liberty','kremlin','taj','opera','christ','wall','colosseum','burj','moai','fuji','machu','baiterek']);
for(const m of models){assert(m.mesh.faces.length>100);assert(m.lon>=-180&&m.lon<=180&&m.lat>=-90&&m.lat<=90);for(const f of m.mesh.faces){assert(f.points.length>=3);for(const p of f.points)assert(p.length===3&&p.every(Number.isFinite));}}
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const cardIds=[...html.matchAll(/data-landmark="([^"]+)"/g)].map(m=>m[1]);
assert.deepStrictEqual(cardIds,models.map(m=>m.id),'Some miniatures are missing from the accessible collection');
const paris=models.find(m=>m.id==='eiffel'),rome=models.find(m=>m.id==='colosseum');
const footprint=m=>Math.max(...m.mesh.faces.flatMap(f=>f.points.map(p=>Math.hypot(p[0],p[1]))));
const distance=Math.hypot(...a.worldPoint([0,0,0],paris.frame).map((v,i)=>v-a.worldPoint([0,0,0],rome.frame)[i]));
assert(distance>(footprint(paris)+footprint(rome))*1.1,'Paris/Rome footprints are too close');
assert(rome.lon===12.4922&&paris.lon===2.2945,'Geographic anchors moved to create artificial spacing');
const opera=models.find(m=>m.id==='opera');const shells=opera.mesh.faces.filter(f=>f.color==='#fff9eb');assert(shells.length>100&&shells.every(f=>f.points.every(p=>p[2]>=.057-1e-9)),'Opera roofs intersect their foundation');assert(!opera.mesh.faces.some(f=>f.color==='#8bb9c2'),'Flood-like water disc returned');
const ctx={save(){},restore(){},setLineDash(){},beginPath(){},moveTo(x,y){assert(Number.isFinite(x+y))},lineTo(x,y){assert(Number.isFinite(x+y))},closePath(){},fill(){},ellipse(){},stroke(){}};
for(const [lon,lat] of [[-20,10],[0,0],[80,30],[-120,-20]]){
 const c=a.camera(lon,lat),p=d3.geoOrthographic().rotate([-lon,-lat]).scale(250*1.004).translate([480,360]);
 for(const m of models){const x=a.projectPoint(a.worldPoint([0,0,0],m.frame),c,480,360,250),y=p([m.lon,m.lat]);assert(Math.hypot(x[0]-y[0],x[1]-y[1])<1e-8,'Miniature and globe coordinates diverge');}
 const b=a.drawMiniatures(ctx,models,{cx:480,cy:360,r:250,lon,lat});assert(b.every(b=>[b.x0,b.x1,b.y0,b.y1,...b.anchor].every(Number.isFinite)));
}
const overview=a.drawMiniatures(ctx,models,{cx:480,cy:360,r:250,lon:-20,lat:10});assert(['pyramid','eiffel','liberty'].every(id=>overview.some(b=>b.id===id)),'Original three lost from the overview');
for(const m of models){assert(a.drawMiniatures(ctx,[m],{cx:480,cy:360,r:250,lon:m.lon,lat:Math.max(-80,Math.min(60,m.lat-42))}).length===1,'Selected miniature not visible: '+m.id);assert(a.drawMiniatures(ctx,[m],{cx:480,cy:360,r:250,lon:m.lon+180,lat:-m.lat}).length===0,'Backside miniature not hidden: '+m.id);}
console.log('PASS: all fourteen 3D models have finite geometry, match globe coordinates and hide on the far side');
const elements=new Map();function el(){return{hidden:false,style:{},classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return[]},setAttribute(){}}}
const document={querySelector(s){if(!elements.has(s))elements.set(s,el());return elements.get(s)},querySelectorAll(){return[]}};
const window={location:{hash:'',pathname:'/geolab/',search:''},history:{replaceState(a,b,url){window.location.hash=url==='#globe'?url:''}},scrollTo(){}};
let created=0,refreshed=0;const context=vm.createContext({document,window,d3,localStorage:{getItem:()=>null},console,confirm:()=>true,startLandmarkGlobe:()=>{created++;return{refresh(){refreshed++}}}});
let code=fs.readFileSync(path.join(__dirname,'../app.js'),'utf8');code=code.slice(0,code.indexOf("$$('[data-home]')"));vm.runInContext(code,context);
context.payload=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/atlas-data.json')));vm.runInContext("DATA=payload;objects=DATA.objects;territories=DATA.territories;WORLD={features:[]};renderMap=()=>{};renderPanel=()=>{};renderStrip=()=>{};openLandmarks();",context);
assert(elements.get('#landmarksPage').hidden===false&&elements.get('#homePage').hidden===true&&elements.get('#atlasPage').hidden===true);assert(window.location.hash==='#globe');
vm.runInContext('goHome()',context);assert(elements.get('#landmarksPage').hidden===true&&elements.get('#homePage').hidden===false);assert(window.location.hash==='');
vm.runInContext("openLandmarks();openRegion('kz');",context);assert(elements.get('#landmarksPage').hidden===true&&elements.get('#atlasPage').hidden===false);assert(created===1&&refreshed===1);
console.log('PASS: separate-section navigation, home/atlas return, deep-link state and reuse without reinitialization');
