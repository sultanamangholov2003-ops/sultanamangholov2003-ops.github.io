'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const a=require('../landmarks.js');
assert.strictEqual(a.TOUR_STOPS.length,a.LANDMARKS.length);
assert.deepStrictEqual(a.TOUR_STOPS.map(s=>s.id).sort(),a.LANDMARKS.map(m=>m.id).sort());
for(const stop of a.TOUR_STOPS){assert(stop.fact.length>40&&stop.fact.length<230);assert(/^https:\/\//.test(stop.source)&&stop.credit)}
const visits=[],tour=a.createLandmarkTour(s=>visits.push(s.id));
tour.start();assert.strictEqual(tour.state().stop.id,'baiterek');tour.advance(3000);tour.pause();tour.advance(60000);assert.strictEqual(tour.state().elapsed,3000);tour.resume();tour.advance(4999);assert.strictEqual(tour.state().index,0);tour.advance(1);assert.strictEqual(tour.state().index,1);
tour.pause();tour.next();assert.strictEqual(tour.state().status,'paused');assert.strictEqual(tour.state().elapsed,0);tour.previous();assert.strictEqual(tour.state().index,1);tour.revisit();assert.strictEqual(tour.state().status,'running');
tour.start();for(let i=0;i<14;i++)tour.advance(8000);assert.strictEqual(tour.state().status,'finished');assert.strictEqual(tour.state().index,13);tour.advance(60000);assert.strictEqual(tour.state().index,13);tour.previous();assert.strictEqual(tour.state().index,12);assert.strictEqual(tour.state().status,'paused');tour.stop();tour.advance(99999);assert.strictEqual(tour.state().status,'idle');tour.start();assert.strictEqual(tour.state().index,0);
console.log('PASS: 14 unique stops, sourced facts, pause/resume, previous/next, finish and restart');
// Exercise the real scene handlers and animation loop without a browser or network.
function scene(reduce=false){
 const elements=new Map(),cards=a.LANDMARKS.map(m=>element(m.id));let clock=0,raf=null;
 function element(id){return{id,hidden:false,style:{},dataset:{landmark:id},attributes:{},events:{},clientWidth:0,clientHeight:0,offsetTop:0,offsetHeight:0,scrollTop:0,textContent:'',classList:{toggle(){},remove(){}},setAttribute(k,v){this.attributes[k]=v},addEventListener(k,fn){this.events[k]=fn},focus(){},scrollIntoView(){this.scrolls=(this.scrolls||0)+1},setPointerCapture(){},getContext(){return null}}}
 function get(id){if(!elements.has(id))elements.set(id,element(id));return elements.get(id)}
 const document={hidden:false,getElementById:get,querySelectorAll:()=>cards,querySelector(s){if(s==='.landmark-page'||s==='.landmark-list')return get(s);const m=s.match(/data-landmark="([^"]+)"/);return m?cards.find(c=>c.id===m[1]):null},addEventListener(){}};
 const chain=new Proxy({}, {get:()=>()=>chain});
 const window={},context={window,document,console,innerWidth:375,devicePixelRatio:1,performance:{now:()=>clock},matchMedia:()=>({matches:reduce}),requestAnimationFrame:fn=>raf=fn,ResizeObserver:class{observe(){}},d3:{select:()=>chain,geoOrthographic:()=>chain}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../landmarks.js'),'utf8'),context);
 const api=window.startLandmarkGlobe({features:[]});
 function advance(ms){for(let n=0;n<ms;n+=40){clock+=40;raf(clock)}}
 const click=id=>get(id).onclick();return{get,document,click,advance,cards,api};
}
const s=scene();s.click('tourStart');assert.strictEqual(s.get('tourTitle').textContent,'Байтерек');assert.strictEqual(s.get('tourIntro').hidden,true);
s.advance(1000);s.click('tourPause');s.advance(30000);assert.strictEqual(s.get('tourCounter').textContent,'01 / 14');assert.strictEqual(s.get('tourStatus').textContent,'Путешествие на паузе');
s.click('tourPause');s.advance(9400);assert.strictEqual(s.get('tourCounter').textContent,'02 / 14');
s.document.hidden=true;s.advance(60000);assert.strictEqual(s.get('tourCounter').textContent,'02 / 14');s.document.hidden=false;
s.get('landmarksPage').hidden=true;s.advance(60000);assert.strictEqual(s.get('tourCounter').textContent,'02 / 14');s.get('landmarksPage').hidden=false;
s.click('tourPause');s.click('tourNext');assert.strictEqual(s.get('tourTitle').textContent,'Великая китайская стена');assert.strictEqual(s.get('tourStatus').textContent,'Путешествие на паузе');s.advance(20000);assert.strictEqual(s.get('tourCounter').textContent,'03 / 14');
s.click('tourPrevious');assert.strictEqual(s.get('tourTitle').textContent,'Тадж-Махал');s.click('tourPause');s.advance(500);s.get('landmarkStage').events.keydown({key:'ArrowLeft',preventDefault(){}});assert.strictEqual(s.get('tourStatus').textContent,'Путешествие на паузе');s.click('tourPause');s.advance(10000);assert.strictEqual(s.get('tourCounter').textContent,'03 / 14');
s.api.select('opera');assert.strictEqual(s.get('tourIntro').hidden,false);s.advance(30000);assert.strictEqual(s.get('landmarkNote').textContent,a.LANDMARKS.find(m=>m.id==='opera').note);
s.click('tourStart');s.advance(160000);assert.strictEqual(s.get('tourStatus').textContent,'Путешествие завершено');assert.strictEqual(s.get('tourRestart').hidden,false);assert.strictEqual(s.get('tourProgress').style.width,'100%');s.click('tourRestart');assert.strictEqual(s.get('tourCounter').textContent,'01 / 14');s.click('tourClose');assert.strictEqual(s.get('tourIntro').hidden,false);
s.click('tourStart');s.click('landmarkReset');assert.strictEqual(s.get('tourIntro').hidden,false);
const r=scene(true);r.click('tourStart');assert.strictEqual(r.get('tourStatus').textContent,'Остановимся и посмотрим');r.advance(8040);assert.strictEqual(r.get('tourCounter').textContent,'02 / 14');r.click('landmarkPause');r.advance(60000);assert.strictEqual(r.get('tourCounter').textContent,'02 / 14');assert.strictEqual(r.get('landmarkTour').scrolls,1,'Automatic stops must not scroll the page');
console.log('PASS: real scene controls, paused flights, hidden tabs/sections, manual interruption, reset, finish, mobile scrolling and reduced motion');
