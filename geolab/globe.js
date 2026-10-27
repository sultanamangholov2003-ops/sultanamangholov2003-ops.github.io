'use strict';
window.startHeroGlobe=function(world){
 const canvas=document.getElementById('heroGlobe'),fallback=document.getElementById('heroFallback'),pause=document.getElementById('heroPause');
 let lon=50*Math.PI/180,lat=17*Math.PI/180,spinning=!matchMedia('(prefers-reduced-motion: reduce)').matches,drag=false,last=0,drawGlobe=()=>{};
 const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(gl){try{
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a; varying vec2 p; void main(){p=a;gl_Position=vec4(a,0.0,1.0);}'));
  gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`precision mediump float;
   varying vec2 p;uniform sampler2D tex;uniform float longitude;uniform float latitude;uniform float aspect;
   void main(){vec2 xy=vec2(p.x*aspect,p.y)/0.86;float rr=dot(xy,xy);if(rr>1.19){gl_FragColor=vec4(0.0);return;}
   if(rr>1.0){float a=pow(max(0.0,(1.19-rr)/.19),2.0)*.15;gl_FragColor=vec4(.53,.73,.87,a);return;}
   float z=sqrt(1.0-rr);float phi=asin(clamp(xy.y*cos(latitude)+z*sin(latitude),-1.0,1.0));
   float lambda=atan(xy.x,z*cos(latitude)-xy.y*sin(latitude))+longitude;
   vec2 uv=vec2(fract(lambda/6.28318530718+.5),phi/3.14159265359+.5);
   vec3 color=texture2D(tex,uv).rgb;float light=.82+.21*dot(normalize(vec3(-.5,.6,1.0)),vec3(xy,z));
   color=color*light;float rim=pow(1.0-z,4.0);color=mix(color,vec3(.54,.78,.9),rim*.27);
   gl_FragColor=vec4(color,(1.0-smoothstep(.993,1.0,rr)));}`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Globe shader');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,1,1,0,gl.RGB,gl.UNSIGNED_BYTE,new Uint8Array([100,153,167]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const image=new Image();image.onload=()=>{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);drawGlobe()};image.src='assets/relief.jpg';
  const ulon=gl.getUniformLocation(program,'longitude'),ulat=gl.getUniformLocation(program,'latitude'),aspect=gl.getUniformLocation(program,'aspect');
  drawGlobe=()=>{const r=canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;const dpr=Math.min(devicePixelRatio||1,2),w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h);gl.uniform1f(ulon,lon);gl.uniform1f(ulat,lat);gl.uniform1f(aspect,w/h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)};
 }catch(e){useFallback()}}else useFallback();
 function useFallback(){canvas.style.display='none';fallback.style.display='block';const s=d3.select(fallback);s.append('defs').html('<radialGradient id="fallbackSea" cx="30%" cy="25%"><stop stop-color="#86b9d0"/><stop offset="1" stop-color="#4883ae"/></radialGradient><radialGradient id="fallbackShade" cx="30%" cy="25%" r="80%"><stop offset=".4" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#264472" stop-opacity=".4"/></radialGradient>');s.append('circle').attr('cx',250).attr('cy',250).attr('r',217).attr('fill','url(#fallbackSea)');const proj=d3.geoOrthographic().scale(217).translate([250,250]),path=d3.geoPath(proj),countries=s.append('g').selectAll('path').data(world.features).join('path').attr('fill',(d,i)=>['#b1ca8a','#c2ce93','#cbbd8a','#9ebd8e'][i%4]).attr('stroke','#759a86').attr('stroke-width',.5);s.append('circle').attr('cx',250).attr('cy',250).attr('r',217).attr('fill','url(#fallbackShade)').attr('pointer-events','none');drawGlobe=()=>{proj.rotate([-lon*180/Math.PI,-lat*180/Math.PI]);countries.attr('d',path)}}
 pause.textContent=spinning?'Ⅱ':'▶';pause.setAttribute('aria-label',spinning?'Остановить вращение глобуса':'Включить вращение глобуса');pause.onclick=()=>{spinning=!spinning;pause.textContent=spinning?'Ⅱ':'▶';pause.setAttribute('aria-label',spinning?'Остановить вращение глобуса':'Включить вращение глобуса')};
 let startX=0,startY=0,initialLon=0,initialLat=0;
 const art=document.querySelector('.hero-art');art.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;startX=e.clientX;startY=e.clientY;initialLon=lon;initialLat=lat;art.setPointerCapture(e.pointerId)});
 art.addEventListener('pointermove',e=>{if(!drag)return;lon=initialLon-(e.clientX-startX)*.006;lat=Math.max(-1.2,Math.min(1.2,initialLat+(e.clientY-startY)*.005));drawGlobe()});art.addEventListener('pointerup',()=>drag=false);art.addEventListener('pointercancel',()=>drag=false);
 new ResizeObserver(()=>drawGlobe()).observe(art);
 function animate(time){if(time-last>32){if(!document.getElementById('homePage').hidden&&!document.hidden){if(spinning&&!drag)lon+=Math.min(time-last,70)*.00007;drawGlobe()}last=time}requestAnimationFrame(animate)}drawGlobe();requestAnimationFrame(animate);
};
