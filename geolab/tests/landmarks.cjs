'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),d3=require('../assets/d3.min.js');
const a=require('../landmarks.js'),models=a.buildModels();
assert.deepStrictEqual(models.map(m=>m.id),['pyramid','eiffel','liberty','kremlin','taj','opera','christ']);
for(const m of models){assert(m.mesh.faces.length>100);assert(m.lon>=-180&&m.lon<=180&&m.lat>=-90&&m.lat<=90);for(const f of m.mesh.faces){assert(f.points.length>=3);for(const p of f.points)assert(p.length===3&&p.every(Number.isFinite));}}
const ctx={save(){},restore(){},setLineDash(){},beginPath(){},moveTo(x,y){assert(Number.isFinite(x+y))},lineTo(x,y){assert(Number.isFinite(x+y))},closePath(){},fill(){},ellipse(){},stroke(){}};
for(const [lon,lat] of [[-20,10],[0,0],[80,30],[-120,-20]]){
 const c=a.camera(lon,lat),p=d3.geoOrthographic().rotate([-lon,-lat]).scale(250*1.004).translate([480,360]);
 for(const m of models){const x=a.projectPoint(a.worldPoint([0,0,0],m.frame),c,480,360,250),y=p([m.lon,m.lat]);assert(Math.hypot(x[0]-y[0],x[1]-y[1])<1e-8,'Miniature and globe coordinates diverge');}
 const b=a.drawMiniatures(ctx,models,{cx:480,cy:360,r:250,lon,lat});assert(b.every(b=>[b.x0,b.x1,b.y0,b.y1,...b.anchor].every(Number.isFinite)));
}
const overview=a.drawMiniatures(ctx,models,{cx:480,cy:360,r:250,lon:-20,lat:10});assert(['pyramid','eiffel','liberty'].every(id=>overview.some(b=>b.id===id)),'Original three lost from the overview');
for(const m of models){assert(a.drawMiniatures(ctx,[m],{cx:480,cy:360,r:250,lon:m.lon,lat:Math.max(-80,Math.min(60,m.lat-42))}).length===1,'Selected miniature not visible: '+m.id);assert(a.drawMiniatures(ctx,[m],{cx:480,cy:360,r:250,lon:m.lon+180,lat:-m.lat}).length===0,'Backside miniature not hidden: '+m.id);}
console.log('PASS: all seven 3D models have finite geometry, match globe coordinates and hide on the far side');
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
