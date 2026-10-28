/* Decorative low-poly models, authored for GEOlab. Coordinates locate their bases. */
(function(root){
 'use strict';
 const RAD=Math.PI/180;
 const LANDMARKS=[
  {id:'pyramid',name:'Пирамида Хеопса',place:'Гиза, Египет',lon:31.1342,lat:29.9792,color:'#d6ad6d',note:'Тёплый песчаник и строгая геометрия — маленький символ древнего Египта.'},
  {id:'eiffel',name:'Эйфелева башня',place:'Париж, Франция',lon:2.2945,lat:48.8584,color:'#aa836b',note:'Ажурная башня над Парижем — теперь и на нашем маленьком глобусе.'},
  {id:'liberty',name:'Статуя Свободы',place:'Нью-Йорк, США',lon:-74.0445,lat:40.6892,color:'#7cae9b',note:'Корона, факел и зелёная патина — узнаваемый силуэт на берегу Атлантики.'},
  {id:'kremlin',name:'Московский Кремль',place:'Москва, Россия',lon:37.6215,lat:55.7525,color:'#b67a68',note:'Красные стены, часы Спасской башни, зелёный шатёр и звезда — миниатюрный Кремль над Москвой.'},
  {id:'taj',name:'Тадж-Махал',place:'Агра, Индия',lon:78.0421,lat:27.1751,color:'#c2b692',note:'Белый купол и четыре стройных минарета — маленькая мраморная сказка на берегу Ямуны.'},
  {id:'opera',name:'Сиднейская опера',place:'Сидней, Австралия',lon:151.2153,lat:-33.8568,color:'#8faeb7',note:'Скульптурные белые паруса на тёплом подиуме — силуэт Сиднейской оперы у воды.'},
  {id:'christ',name:'Христос-Искупитель',place:'Рио-де-Жанейро, Бразилия',lon:-43.2105,lat:-22.9519,color:'#a0b99a',note:'Распростёртые руки над зелёной вершиной Корковаду — знакомый силуэт Рио.'},
  {id:'wall',name:'Великая китайская стена',place:'Бадалин, Китай',lon:116.0167,lat:40.3555,color:'#ab9b76',note:'Декоративный фрагмент стены с зубцами и сторожевыми башнями, идущий по зелёному горному гребню у Бадалина.'},
  {id:'colosseum',name:'Колизей',place:'Рим, Италия',lon:12.4922,lat:41.8902,color:'#b89d78',note:'Открытая овальная арена, ярусы арок и неровный край древних стен — маленький Колизей на своём месте в Риме.'}
 ];
 const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(v,n)=>v.map(x=>x*n);
 const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=v=>mul(v,1/(Math.hypot(...v)||1));
 function camera(lon,lat){const a=lon*RAD,b=lat*RAD;return{right:[Math.cos(a),0,-Math.sin(a)],up:[-Math.sin(b)*Math.sin(a),Math.cos(b),-Math.sin(b)*Math.cos(a)],front:[Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)]}}
 function frame(lon,lat){const a=lon*RAD,b=lat*RAD;return{normal:[Math.cos(b)*Math.sin(a),Math.sin(b),Math.cos(b)*Math.cos(a)],east:[Math.cos(a),0,-Math.sin(a)],north:[-Math.sin(b)*Math.sin(a),Math.cos(b),-Math.sin(b)*Math.cos(a)]}}
 function worldPoint(p,f){return add(mul(f.normal,1.004+p[2]),add(mul(f.east,p[0]),mul(f.north,p[1])))}
 function projectPoint(p,c,cx,cy,r){return[cx+r*dot(p,c.right),cy-r*dot(p,c.up),dot(p,c.front)]}
 function model(){return{faces:[]}}
 function face(m,points,color,alpha=1){m.faces.push({points,color,alpha})}
 function box(m,x,y,z,w,d,h,color){const a=[[x-w/2,y-d/2,z],[x+w/2,y-d/2,z],[x+w/2,y+d/2,z],[x-w/2,y+d/2,z]],b=a.map(p=>[p[0],p[1],z+h]);face(m,[...b],color);for(let i=0;i<4;i++)face(m,[a[i],a[(i+1)%4],b[(i+1)%4],b[i]],color)}
 function frustum(m,x,y,z,w0,d0,w1,d1,h,color){const a=[[x-w0/2,y-d0/2,z],[x+w0/2,y-d0/2,z],[x+w0/2,y+d0/2,z],[x-w0/2,y+d0/2,z]],b=[[x-w1/2,y-d1/2,z+h],[x+w1/2,y-d1/2,z+h],[x+w1/2,y+d1/2,z+h],[x-w1/2,y+d1/2,z+h]];face(m,b,color);for(let i=0;i<4;i++)face(m,[a[i],a[(i+1)%4],b[(i+1)%4],b[i]],color)}
 function beam(m,a,b,width,color){const v=norm(sub(b,a)),u=mul(norm(cross(v,Math.abs(v[2])<.9?[0,0,1]:[0,1,0])),width/2),w=mul(norm(cross(v,u)),width/2),corners=p=>[add(add(p,u),w),add(sub(p,u),w),sub(sub(p,u),w),add(sub(p,w),u)];const aa=corners(a),bb=corners(b);face(m,bb,color);for(let i=0;i<4;i++)face(m,[aa[i],aa[(i+1)%4],bb[(i+1)%4],bb[i]],color)}
 function sphere(m,center,r,color,segments=8,rings=5,stretch=1){const point=(i,j)=>{const p=-Math.PI/2+Math.PI*j/rings,a=Math.PI*2*i/segments;return[center[0]+r*Math.cos(p)*Math.cos(a),center[1]+r*Math.cos(p)*Math.sin(a),center[2]+r*Math.sin(p)*stretch]};for(let j=0;j<rings;j++)for(let i=0;i<segments;i++)face(m,[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],color)}
 function disk(m,r,z,color,alpha=1){for(let i=0;i<28;i++){const a=i*Math.PI/14,b=(i+1)*Math.PI/14;face(m,[[0,0,z],[r*Math.cos(a),r*Math.sin(a),z],[r*Math.cos(b),r*Math.sin(b),z]],color,alpha)}}
 function pyramid(m,x,y,size,height,z=0){const base=[[x-size/2,y-size/2,z],[x+size/2,y-size/2,z],[x+size/2,y+size/2,z],[x-size/2,y+size/2,z]],tip=[x,y,z+height];for(let i=0;i<4;i++)face(m,[base[i],base[(i+1)%4],tip],['#e5c48a','#c69e60','#edcf98','#cfa866'][i]);for(let row=1;row<7;row++){const t=row/7,span=size*(1-t);beam(m,[x-span/2,y-span/2-.0006,z+height*t],[x+span/2,y-span/2-.0006,z+height*t],.0009,'#d6b277')}}
 function buildPyramid(){const m=model();disk(m,.151,.002,'#445b4c',.13);disk(m,.142,.004,'#d9cba4');pyramid(m,-.015,-.015,.175,.155,.006);pyramid(m,-.108,.064,.103,.094,.007);pyramid(m,.073,.086,.072,.066,.007);return m}
 function buildEiffel(){const m=model(),metal='#aa8265',light='#c2a183';disk(m,.08,.002,'#384f4b',.14);box(m,0,0,.004,.13,.11,.009,'#c4c6af');const levels=[[.013,.073],[.095,.042],[.168,.026],[.29,.011],[.355,.004]];
 for(let side=0;side<4;side++){const a=side*Math.PI/2,b=(side+1)*Math.PI/2;for(let l=0;l<levels.length-1;l++){const [z0,r0]=levels[l],[z1,r1]=levels[l+1];const p=[r0*Math.cos(a+Math.PI/4),r0*Math.sin(a+Math.PI/4),z0],q=[r1*Math.cos(a+Math.PI/4),r1*Math.sin(a+Math.PI/4),z1];beam(m,p,q,l===0?.008:.004,metal);if(l>0){const pp=[r0*Math.cos(b+Math.PI/4),r0*Math.sin(b+Math.PI/4),z0],qq=[r1*Math.cos(b+Math.PI/4),r1*Math.sin(b+Math.PI/4),z1];beam(m,p,qq,.0023,light);beam(m,pp,q,.0023,light);const mid=(z0+z1)/2,rm=(r0+r1)/2;beam(m,[rm*Math.cos(a+Math.PI/4),rm*Math.sin(a+Math.PI/4),mid],[rm*Math.cos(b+Math.PI/4),rm*Math.sin(b+Math.PI/4),mid],.0025,metal)}}}
 // Four lower arches leave the centre open.
 for(let side=0;side<4;side++){const a=side*Math.PI/2;let prev;for(let i=0;i<=12;i++){const t=i/12,u=(t-.5)*.099,z=.017+.058*Math.sqrt(Math.max(0,1-((t-.5)*2)**2));const p=[Math.cos(a)*u-Math.sin(a)*.045,Math.sin(a)*u+Math.cos(a)*.045,z];if(prev)beam(m,prev,p,.0033,metal);prev=p}}
 for(const [z,w] of [[.095,.084],[.168,.055],[.29,.026]]){box(m,0,0,z,w,w,.006,metal);box(m,0,0,z+.006,w*.96,w*.96,.002,light)}
 beam(m,[0,0,.35],[0,0,.411],.0028,'#b08b70');box(m,0,0,.34,.015,.015,.012,metal);return m}
 function buildLiberty(){const m=model(),green='#7eaf9b',dark='#62927f',light='#9ac4af';disk(m,.101,.002,'#40594c',.15);box(m,0,0,.005,.131,.112,.016,'#c6c7ac');box(m,0,0,.021,.102,.088,.025,'#d8caac');frustum(m,0,0,.046,.083,.074,.062,.056,.065,'#c6b38f');box(m,0,0,.111,.08,.069,.013,'#ded0ad');
 frustum(m,0,0,.124,.075,.055,.042,.034,.13,green);frustum(m,0,0,.254,.043,.035,.055,.035,.028,green);
 for(let i=-2;i<=2;i++)beam(m,[i*.013,-.029,.13],[i*.007,-.019,.25],.0024,i%2?light:dark);
 beam(m,[0,0,.274],[0,0,.298],.018,green);sphere(m,[0,0,.311],.021,light,10,6,1.18);
 // Left arm and the tablet; right arm rises to the torch.
 beam(m,[-.023,0,.272],[-.039,-.007,.232],.014,green);beam(m,[-.039,-.007,.232],[-.027,-.032,.223],.012,green);box(m,-.031,-.036,.211,.032,.012,.055,dark);box(m,-.031,-.043,.216,.026,.002,.045,green);
 beam(m,[.023,0,.271],[.048,0,.307],.015,green);beam(m,[.048,0,.307],[.055,0,.35],.012,light);sphere(m,[.055,0,.35],.0085,green,6,4);
 frustum(m,.055,0,.351,.016,.016,.025,.025,.018,'#a5895a');beam(m,[.055,0,.367],[.055,0,.382],.01,'#b89450');sphere(m,[.055,0,.39],.012,'#e8b64e',7,5,1.8);sphere(m,[.052,-.003,.397],.006,'#f8d58a',6,4,1.6);
 // Crown band and seven rays.
 for(let i=0;i<7;i++){const a=2*Math.PI*i/7;const p=[.018*Math.cos(a),.018*Math.sin(a),.322],tip=[.039*Math.cos(a),.039*Math.sin(a),.342];beam(m,p,tip,.0038,light)}
 return m}
 function lathe(m,x,y,z,r,h,profile,color,segments=10){
  const at=(i,j)=>[x+r*profile[j][1]*Math.cos(i*Math.PI*2/segments),y+r*profile[j][1]*Math.sin(i*Math.PI*2/segments),z+h*profile[j][0]];
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++)face(m,[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)],color);
  if(profile.at(-1)[1]>0)face(m,Array.from({length:segments},(_,i)=>at(i,profile.length-1)),color);
 }
 function dome(m,x,y,z,r,h,color){lathe(m,x,y,z,r,h,[[0,.69],[.18,.95],[.42,1],[.65,.85],[.86,.45],[1,0]],color,12)}
 function pointedArch(m,x,y,z,w,h,color){const pts=[[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y,z+h*.63],[x+w*.28,y,z+h*.86],[x,y,z+h],[x-w*.28,y,z+h*.86],[x-w/2,y,z+h*.63]];face(m,pts,color)}
 function star(m,x,y,z,r,color){const pts=[];for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,rr=i%2?r*.43:r;pts.push([x+Math.cos(a)*rr,y,z+Math.sin(a)*rr])}for(let i=0;i<10;i++)face(m,[[x,y-.001,z],pts[i],pts[(i+1)%10]],color)}
 function buildKremlin(){
  const m=model(),brick='#b8715e',shadeBrick='#985847',stone='#ddcdb1',green='#567a67';disk(m,.154,.002,'#435a49',.14);disk(m,.145,.004,'#a6b58e');
  // A little courtyard, crenellated walls and corner towers.
  box(m,0,.015,.007,.24,.14,.013,'#c6b994');
  for(const y of [-.057,.082]){box(m,0,y,.018,.25,.018,.045,brick);for(let i=0;i<12;i++)box(m,-.115+i*.021,y,.063,.011,.02,.014,stone)}
  for(const x of [-.12,.12]){box(m,x,.012,.018,.018,.145,.045,brick);for(let i=0;i<7;i++)box(m,x,-.052+i*.021,.063,.02,.011,.014,stone)}
  for(const x of [-.12,.12])for(const y of [-.057,.082]){box(m,x,y,.014,.034,.034,.069,brick);frustum(m,x,y,.083,.043,.043,0,0,.055,green);beam(m,[x,y,.138],[x,y,.15],.0028,'#c9b37a')}
  // White church and golden cupolas behind the Spasskaya Tower.
  box(m,-.016,.039,.021,.09,.064,.071,'#e4dfc8');for(const [x,y,r] of [[-.016,.039,.024],[-.05,.041,.013],[.019,.041,.013]]){lathe(m,x,y,.092,r*.65,.026,[[0,1],[1,1]],'#d8ceac',8);dome(m,x,y,.118,r,r*1.3,'#d8b764');beam(m,[x,y,.118+r*1.3],[x,y,.133+r*1.3],.002,'#c7a45a')}
  // Tall clock tower: deliberately schematic, with a readable south clock face.
  box(m,.015,-.057,.018,.065,.06,.148,brick);box(m,.015,-.057,.166,.074,.069,.009,stone);box(m,.015,-.057,.175,.057,.052,.065,brick);box(m,.015,-.057,.24,.069,.064,.009,stone);
  box(m,.015,-.057,.249,.046,.042,.032,stone);frustum(m,.015,-.057,.281,.067,.059,.008,.008,.088,green);beam(m,[.015,-.057,.369],[.015,-.057,.393],.0035,'#bfa368');star(m,.015,-.057,.4,.014,'#bd6650');
  const clock=(radius,color,y)=>{const p=Array.from({length:20},(_,i)=>[.015+radius*Math.cos(i*Math.PI/10),y,.207+radius*Math.sin(i*Math.PI/10)]);face(m,p,color)};clock(.019,'#d4b66f',-.084);clock(.0155,'#4f5145',-.085);
  beam(m,[.015,-.086,.207],[.015,-.086,.219],.0023,'#ecd492');beam(m,[.015,-.086,.207],[.024,-.086,.204],.0023,'#ecd492');
  pointedArch(m,.015,-.087,.024,.022,.046,'#644c3e');for(const x of [-.002,.031])pointedArch(m,x,-.084,.119,.009,.028,'#734d41');
  return m;
 }
 function buildTaj(){
  const m=model(),white='#eee7d6',light='#faf4e4',edge='#d6c8ad',gold='#c9ae70';disk(m,.171,.002,'#536248',.12);box(m,0,0,.004,.285,.22,.012,'#a9b68c');box(m,0,0,.016,.245,.175,.013,edge);box(m,0,.009,.029,.157,.12,.077,white);box(m,0,.009,.106,.172,.132,.007,light);
  box(m,0,-.005,.113,.085,.077,.025,white);lathe(m,0,-.005,.138,.036,.016,[[0,1],[1,1]],edge,12);dome(m,0,-.005,.154,.048,.072,light);beam(m,[0,-.005,.226],[0,-.005,.251],.0027,gold);sphere(m,[0,-.005,.244],.004,gold,6,4);
  for(const x of [-.058,.058])for(const y of [-.028,.048]){lathe(m,x,y,.113,.014,.018,[[0,1],[1,1]],white,8);dome(m,x,y,.131,.018,.023,light);beam(m,[x,y,.154],[x,y,.165],.002,gold)}
  for(const x of [-.108,.108])for(const y of [-.073,.073]){lathe(m,x,y,.029,.01,.128,[[0,1.2],[.3,1],[.65,.88],[1,.75]],white,8);for(const z of [.066,.111,.154])lathe(m,x,y,z,.013,.004,[[0,1],[1,1]],edge,8);lathe(m,x,y,.158,.008,.022,[[0,1],[1,1]],white,8);dome(m,x,y,.18,.014,.018,light);beam(m,[x,y,.198],[x,y,.211],.002,gold)}
  // Arched front, smaller portals and a garden pool.
  pointedArch(m,0,-.052,.031,.041,.065,'#a1937a');pointedArch(m,0,-.053,.031,.029,.056,'#6c7469');
  for(const x of [-.055,.055])pointedArch(m,x,-.052,.036,.022,.041,'#a99f87');box(m,0,-.091,.028,.022,.036,.001,'#87b6bc');box(m,-.046,-.092,.028,.037,.026,.003,'#8fa47c');box(m,.046,-.092,.028,.037,.026,.003,'#8fa47c');
  return m;
 }
 function operaSail(m,x,y,z,length,width,height){
  // A closed vaulted shell: both long edges rest on the podium, not in water.
  const at=(i,j)=>{const t=i/8,a=j*Math.PI/12;return[x+length*t,y+width*(1-.62*t)*Math.cos(a),z+height*Math.sin(t*Math.PI/2)*Math.sin(a)]};
  for(let i=0;i<8;i++)for(let j=0;j<12;j++){const pts=[at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1)];if(length>0)pts.reverse();face(m,pts,'#fff9eb');}
  face(m,[at(0,0),at(0,12),at(8,12),at(8,0)],'#d8d4c6');
  // The arched front closes the volume. A white rim keeps the sail readable.
  const front=Array.from({length:13},(_,j)=>at(8,j));face(m,front,'#779a9b');
  for(let j=0;j<12;j++)beam(m,front[j],front[j+1],.0035,'#f5f0e4');
  for(const j of [6])for(let i=0;i<8;i++)beam(m,at(i,j),at(i+1,j),.0009,'#e7dfcf');
 }
 function buildOpera(){
  const m=model();
  // Raised continuous stone quay; no blue disc or roofs below the foundation.
  disk(m,.165,.002,'#64756d',.11);
  box(m,0,0,.006,.296,.207,.027,'#b79779');
  box(m,0,0,.033,.278,.192,.015,'#c9ad8a');
  box(m,0,0,.048,.26,.18,.009,'#e3cdb0');
  for(let i=0;i<4;i++)box(m,-.052,-.112+i*.006,.01+i*.01,.18,.013,.011,'#d4b99a');
  const floor=.057;
  operaSail(m,-.125,.046,floor,.112,.043,.151);
  operaSail(m,-.013,.046,floor,.078,.037,.108);
  operaSail(m,.065,.046,floor,.055,.029,.068);
  operaSail(m,-.108,-.045,floor,.1,.037,.117);
  operaSail(m,-.008,-.045,floor,.079,.032,.083);
  operaSail(m,.071,-.045,floor,.044,.024,.052);
  return m;
 }
 function buildChrist(){
  const m=model(),stone='#e4e3d8',shade='#c4ccc3',light='#f2f0e5';disk(m,.144,.002,'#46624c',.16);lathe(m,0,0,.004,.137,.058,[[0,1],[.6,.65],[1,.35]],'#9db18b',9);box(m,0,0,.062,.087,.07,.014,'#b5b8a6');frustum(m,0,0,.076,.068,.053,.046,.038,.041,'#cbd0be');box(m,0,0,.117,.061,.05,.009,light);
  frustum(m,0,0,.126,.057,.044,.044,.029,.128,stone);frustum(m,0,0,.254,.044,.029,.071,.032,.023,stone);
  for(let i=-2;i<=2;i++)beam(m,[i*.01,-.022,.13],[i*.006,-.016,.258],.0019,shade);
  for(const sign of [-1,1]){beam(m,[sign*.027,0,.267],[sign*.082,0,.27],.023,stone);beam(m,[sign*.082,0,.27],[sign*.137,0,.263],.016,light);box(m,sign*.147,-.001,.256,.025,.016,.014,light)}
  beam(m,[0,0,.272],[0,0,.293],.017,stone);sphere(m,[0,-.001,.309],.0195,stone,10,6,1.2);sphere(m,[0,.002,.321],.0175,'#aeb9af',8,4,.65);box(m,0,-.02,.303,.005,.005,.009,light);
  return m;
 }
 function buildWall(){
  const m=model(),stone='#c3b28d',edge='#deccaa',path=[[-.152,.016,.028],[-.113,.049,.05],[-.073,.046,.073],[-.032,.009,.058],[.012,-.027,.078],[.057,-.018,.105],[.105,.02,.085],[.151,.038,.056]];
  disk(m,.175,.002,'#53674c',.11);disk(m,.165,.003,'#bac6a0');
  const ridgeNormal=i=>{const a=path[Math.max(0,i-1)],b=path[Math.min(path.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy);return[-dy/n,dx/n]};
  for(let i=0;i<path.length-1;i++){
   const a=path[i],b=path[i+1],dx=b[0]-a[0],dy=b[1]-a[1],n=Math.hypot(dx,dy),px=-dy/n,py=dx/n;
   const point=(p,w,h=0)=>[p[0]+px*w,p[1]+py*w,p[2]+h];
   // The green ridge continues underneath every wall segment.
   const na=ridgeNormal(i),nb=ridgeNormal(i+1);for(const side of [-1,1])face(m,[[a[0]+na[0]*.046*side,a[1]+na[1]*.046*side,.004],[b[0]+nb[0]*.046*side,b[1]+nb[1]*.046*side,.004],[b[0],b[1],b[2]],[a[0],a[1],a[2]]],side<0?'#9eb58a':'#809d76');
   const width=.011,h=.031;face(m,[point(a,-width),point(b,-width),point(b,-width,h),point(a,-width,h)],stone);face(m,[point(b,width),point(a,width),point(a,width,h),point(b,width,h)],'#b3a17d');face(m,[point(a,-width,h),point(b,-width,h),point(b,width,h),point(a,width,h)],edge);
   for(const side of [-1,1]){face(m,[point(a,width*side,h),point(b,width*side,h),point(b,width*side,h+.011),point(a,width*side,h+.011)],'#b4a27e');for(let j=0;j<4;j++){const t=(j+.15)/4,p=a.map((v,k)=>v+(b[k]-v)*t);box(m,p[0]+px*width*side,p[1]+py*width*side,p[2]+h+.009,.0065,.0065,.009,edge)}}
  }
  for(const i of [1,4,6]){const p=path[i],z=p[2];box(m,p[0],p[1],z,.043,.038,.054,stone);box(m,p[0],p[1],z+.054,.049,.044,.005,edge);for(const x of [-1,1])for(const y of [-1,1])box(m,p[0]+x*.019,p[1]+y*.016,z+.059,.01,.01,.013,stone);box(m,p[0],p[1],z+.059,.009,.009,.004,'#a89672');pointedArch(m,p[0],p[1]-.0195,z+.009,.012,.025,'#766d55')}
  return m;
 }
 function buildColosseum(){
  const m=model(),n=16,rx=.064,ry=.046,ix=.05,iy=.033,stone='#d3bd98',light='#e6d3af';
  const at=(angle,xr,yr,z)=>[Math.cos(angle)*xr,Math.sin(angle)*yr,z];
  const ring=(a,b,z0,z1,color)=>{const ao=at(a,rx,ry,z0),bo=at(b,rx,ry,z0),ai=at(a,ix,iy,z0),bi=at(b,ix,iy,z0),A=at(a,rx,ry,z1),B=at(b,rx,ry,z1),C=at(a,ix,iy,z1),D=at(b,ix,iy,z1);face(m,[ao,bo,B,A],color);face(m,[bi,ai,C,D],'#bda786');face(m,[A,B,D,C],light);};
  // An oval arena stays genuinely open, rather than a filled cylinder.
  for(let i=0;i<28;i++){const a=i*Math.PI/14,b=(i+1)*Math.PI/14;face(m,[[0,0,.005],at(a,.073,.053,.005),at(b,.073,.053,.005)],'#c8c3aa');face(m,[[0,0,.009],at(a,ix,iy,.009),at(b,ix,iy,.009)],'#bcaa88')}
  for(let level=0;level<3;level++)for(let i=0;i<n;i++){
   if(level===2&&i>=11)continue; // The surviving high wall breaks down to two tiers.
   const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n,z=.012+level*.025,h=.025,lo=a+(b-a)*.14,hi=b-(b-a)*.14;
   ring(a,lo,z,z+h,stone);ring(hi,b,z,z+h,stone);ring(a,b,z,z+.003,light);
   const arch=t=>z+.009+.011*Math.sqrt(Math.max(0,1-(2*t-1)**2));
   for(let j=0;j<5;j++){const t=j/5,u=(j+1)/5,A=lo+(hi-lo)*t,B=lo+(hi-lo)*u,za=arch(t),zb=arch(u);
    face(m,[at(A,rx,ry,za),at(B,rx,ry,zb),at(B,rx,ry,z+h),at(A,rx,ry,z+h)],stone);
    face(m,[at(B,ix,iy,zb),at(A,ix,iy,za),at(A,ix,iy,z+h),at(B,ix,iy,z+h)],'#baa481');
    face(m,[at(A,rx,ry,za),at(A,ix,iy,za),at(B,ix,iy,zb),at(B,rx,ry,zb)],'#aa9271');
   }
   ring(a,b,z+h-.002,z+h+.002,light);
  }
  // Keep Rome compact beside Paris without moving either geographic anchor.
  for(const f of m.faces)f.points=f.points.map(p=>[p[0]*.8,p[1]*.8,p[2]]);
  return m;
 }
 function buildModels(){const builders={pyramid:buildPyramid,eiffel:buildEiffel,liberty:buildLiberty,kremlin:buildKremlin,taj:buildTaj,opera:buildOpera,christ:buildChrist,wall:buildWall,colosseum:buildColosseum};return LANDMARKS.map(l=>({...l,frame:frame(l.lon,l.lat),mesh:builders[l.id]()}))}
 function shade(hex,amount){const x=parseInt(hex.slice(1),16);return`rgb(${[x>>16,(x>>8)&255,x&255].map(v=>Math.min(255,Math.round(v*amount))).join(',')})`}
 function drawMiniatures(ctx,models,view){const {cx,cy,r,lon,lat,selected}=view,c=camera(lon,lat),light=norm([-.5,.8,1.2]),faces=[],bounds=[];
 for(const m of models){const front=dot(m.frame.normal,c.front);if(front<=.015)continue;const opacity=Math.min(1,(front-.015)/.12),points=[];
 for(const f of m.mesh.faces){const ww=f.points.map(p=>worldPoint(p,m.frame)),pp=ww.map(p=>projectPoint(p,c,cx,cy,r));const centre=ww.reduce((a,p)=>add(a,mul(p,1/ww.length)),[0,0,0]),screen=projectPoint(centre,c,cx,cy,r),rr=((screen[0]-cx)**2+(screen[1]-cy)**2)/(r*r);if(rr<1&&screen[2]<Math.sqrt(1-rr)-.012)continue;
 const n=norm(cross(sub(ww[1],ww[0]),sub(ww[2],ww[0]))),nv=[dot(n,c.right),dot(n,c.up),dot(n,c.front)];const intensity=.69+.32*Math.max(0,dot(nv,light));faces.push({points:pp,z:pp.reduce((a,p)=>a+p[2],0)/pp.length,fill:shade(f.color,intensity),alpha:f.alpha*opacity});points.push(...pp)}
 const anchor=projectPoint(worldPoint([0,0,0],m.frame),c,cx,cy,r);if(points.length){bounds.push({id:m.id,x0:Math.min(...points.map(p=>p[0]))-8,x1:Math.max(...points.map(p=>p[0]))+8,y0:Math.min(...points.map(p=>p[1]))-8,y1:Math.max(...points.map(p=>p[1]))+8,anchor});if(m.id===selected){ctx.save();ctx.strokeStyle='rgba(192,158,93,.8)';ctx.lineWidth=1.4;ctx.setLineDash([3,4]);ctx.beginPath();ctx.ellipse(anchor[0],anchor[1],r*.105,r*.035,0,0,Math.PI*2);ctx.stroke();ctx.restore()}}}
 faces.sort((a,b)=>a.z-b.z);for(const f of faces){ctx.save();ctx.globalAlpha=f.alpha;ctx.fillStyle=f.fill;ctx.beginPath();ctx.moveTo(f.points[0][0],f.points[0][1]);for(let i=1;i<f.points.length;i++)ctx.lineTo(f.points[i][0],f.points[i][1]);ctx.closePath();ctx.fill();ctx.restore()}return bounds}
 function createEarth(canvas,onReady=()=>{}){const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});if(!gl)return null;try{
 const vertex='attribute vec2 a; varying vec2 p;void main(){p=a;gl_Position=vec4(a,0.,1.);}';
 const fragment=`precision mediump float;varying vec2 p;uniform sampler2D tex;uniform float longitude;uniform float latitude;uniform float aspect;uniform float radius;
 void main(){vec2 xy=vec2(p.x*aspect,p.y)/radius;float rr=dot(xy,xy);if(rr>1.14){gl_FragColor=vec4(0.);return;}if(rr>1.){gl_FragColor=vec4(.57,.77,.88,pow((1.14-rr)/.14,2.)*.17);return;}float z=sqrt(1.-rr);float lat=asin(clamp(xy.y*cos(latitude)+z*sin(latitude),-1.,1.));float lon=atan(xy.x,z*cos(latitude)-xy.y*sin(latitude))+longitude;vec3 color=texture2D(tex,vec2(fract(lon/6.2831853+.5),lat/3.14159265+.5)).rgb;float light=.86+.17*dot(normalize(vec3(-.5,.6,1.)),vec3(xy,z));color=mix(color*light,vec3(.59,.8,.9),pow(1.-z,4.)*.25);gl_FragColor=vec4(color,1.-smoothstep(.994,1.,rr));}`;
 const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s},program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Landmark globe shader');gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([111,164,178]));for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
 const img=new Image();img.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);onReady()};img.src='assets/relief.jpg';
 const loc=Object.fromEntries(['longitude','latitude','aspect','radius'].map(n=>[n,gl.getUniformLocation(program,n)]));
 return{draw(w,h,ratio,lon,lat,r){const ww=Math.round(w*ratio),hh=Math.round(h*ratio);if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh}gl.viewport(0,0,ww,hh);gl.uniform1f(loc.longitude,lon*RAD);gl.uniform1f(loc.latitude,lat*RAD);gl.uniform1f(loc.aspect,w/h);gl.uniform1f(loc.radius,2*r/h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)}};
 }catch(e){return null}}
 function startLandmarkGlobe(world){
  const page=document.getElementById('landmarksPage'),stage=document.getElementById('landmarkStage'),earthCanvas=document.getElementById('landmarkEarth'),modelsCanvas=document.getElementById('landmarkModels'),ctx=modelsCanvas.getContext('2d'),pause=document.getElementById('landmarkPause'),models=buildModels();
  let lon=-20,lat=10,zoom=1,spinning=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=null,last=0,lastDraw=0,bounds=[],selected=null,flight=null,dirty=true;
  const earth=createEarth(earthCanvas,()=>{dirty=true}),fallback=document.getElementById('landmarkEarthFallback');let fp,paths,svg;
  if(!earth){earthCanvas.style.display='none';fallback.style.display='block';svg=d3.select(fallback);svg.append('defs').html('<radialGradient id="wonder-ocean" cx="30%" cy="25%"><stop stop-color="#8ab9cc"/><stop offset="1" stop-color="#447c9d"/></radialGradient><radialGradient id="wonder-shade" cx="30%" cy="20%" r="80%"><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#233b59" stop-opacity=".35"/></radialGradient>');svg.append('circle').attr('class','wonder-sphere').attr('fill','url(#wonder-ocean)');fp=d3.geoOrthographic();paths=svg.append('g').selectAll('path').data(world.features).join('path').attr('fill',(d,i)=>['#a7c493','#c9ce9b','#ccbc94','#a6bea0'][i%4]).attr('stroke','#688a77').attr('stroke-width',.4);svg.append('circle').attr('class','wonder-sphere').attr('fill','url(#wonder-shade)').attr('pointer-events','none')}
  function syncPause(){pause.innerHTML=spinning?'Ⅱ <span>Пауза</span>':'▶ <span>Вращать</span>';pause.setAttribute('aria-label',spinning?'Остановить вращение':'Включить вращение');pause.setAttribute('aria-pressed',String(spinning))}
  function render(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;const ratio=Math.min(devicePixelRatio||1,2),r=Math.min(w,h)*.355*zoom,cx=w/2,cy=h/2;
   if(earth)earth.draw(w,h,ratio,lon,lat,r);else{svg.attr('viewBox',`0 0 ${w} ${h}`);svg.selectAll('.wonder-sphere').attr('cx',cx).attr('cy',cy).attr('r',r);fp.scale(r).translate([cx,cy]).rotate([-lon,-lat]);paths.attr('d',d3.geoPath(fp))}
   if(modelsCanvas.width!==Math.round(w*ratio)||modelsCanvas.height!==Math.round(h*ratio)){modelsCanvas.width=Math.round(w*ratio);modelsCanvas.height=Math.round(h*ratio)}ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);bounds=drawMiniatures(ctx,models,{cx,cy,r,lon,lat,selected});dirty=false;
  }
  function setSelection(id){const m=LANDMARKS.find(x=>x.id===id);if(!m)return;selected=id;zoom=Math.max(zoom,1.12);spinning=false;syncPause();document.querySelectorAll('[data-landmark]').forEach(b=>{b.classList.toggle('active',b.dataset.landmark===id);b.setAttribute('aria-pressed',String(b.dataset.landmark===id))});document.getElementById('landmarkNote').textContent=m.note;if(innerWidth<660)stage.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});else document.querySelector(`[data-landmark="${id}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'nearest'});const delta=((m.lon-lon)%360+540)%360-180;if(matchMedia('(prefers-reduced-motion: reduce)').matches){lon=m.lon;lat=Math.max(-80,Math.min(60,m.lat-42));flight=null}else flight={start:performance.now(),lon,lat,dx:delta,dy:Math.max(-80,Math.min(60,m.lat-42))-lat};dirty=true}
  function reset(){selected=null;flight=null;lon=-20;lat=10;zoom=1;spinning=!matchMedia('(prefers-reduced-motion: reduce)').matches;syncPause();document.querySelectorAll('[data-landmark]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});document.getElementById('landmarkNote').textContent='Миниатюры увеличены для красоты. Их основания находятся у настоящих мест на Земле.';dirty=true}
  pause.onclick=()=>{spinning=!spinning;flight=null;syncPause()};document.getElementById('landmarkReset').onclick=reset;document.getElementById('landmarkZoomIn').onclick=()=>{zoom=Math.min(1.4,zoom+.1);dirty=true};document.getElementById('landmarkZoomOut').onclick=()=>{zoom=Math.max(.8,zoom-.1);dirty=true};document.querySelectorAll('[data-landmark]').forEach(b=>b.onclick=()=>setSelection(b.dataset.landmark));
  stage.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,lon,lat,moved:false};flight=null;spinning=false;syncPause();stage.setPointerCapture(e.pointerId)});
  stage.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;lon=drag.lon-dx*.32;lat=Math.max(-80,Math.min(70,drag.lat+dy*.28));dirty=true});
  stage.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(!moved){const r=stage.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;const hit=bounds.filter(b=>x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1).sort((a,b)=>Math.hypot(x-(a.x0+a.x1)/2,y-(a.y0+a.y1)/2)-Math.hypot(x-(b.x0+b.x1)/2,y-(b.y0+b.y1)/2))[0];if(hit)setSelection(hit.id)}});stage.addEventListener('pointercancel',()=>drag=null);
  stage.addEventListener('keydown',e=>{const keys={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,5],ArrowDown:[0,-5]};if(keys[e.key]){e.preventDefault();spinning=false;flight=null;lon+=keys[e.key][0];lat=Math.max(-80,Math.min(70,lat+keys[e.key][1]));syncPause();dirty=true}});
  new ResizeObserver(()=>{dirty=true;if(!page.hidden)render()}).observe(stage);
  function tick(time){const dt=Math.min(80,time-last);last=time;if(!page.hidden&&!document.hidden){if(flight){const t=Math.min(1,(time-flight.start)/850),k=t*t*(3-2*t);lon=flight.lon+flight.dx*k;lat=flight.lat+flight.dy*k;dirty=true;if(t===1)flight=null}else if(spinning&&!drag){lon=(lon+dt*.0024+540)%360-180;dirty=true}if(dirty&&time-lastDraw>=32){render();lastDraw=time}}requestAnimationFrame(tick)}syncPause();render();requestAnimationFrame(tick);return{refresh(){dirty=true;render()},select:setSelection};
 }
 const api={LANDMARKS,buildModels,camera,frame,worldPoint,projectPoint,drawMiniatures};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.GeoLabLandmarks=api;root.startLandmarkGlobe=startLandmarkGlobe}
})(typeof window!=='undefined'?window:globalThis);
