(function(root){'use strict';let serial=0;const A=typeof module==='object'&&module.exports?require('./coffee-assets'):root.StaffCoffeeAssets,base='./assets/coffee/v23/';
const family=r=>r.id==='latte'?'TALL':r.id==='irish'?'IRISH':r.size==='M'?'M':'L';
function surface(r,ml){const g=A.geometry[family(r)],f=Math.max(0,Math.min(1,ml/r.capacity)),curve=g.fill_curve;for(let i=1;i<curve.length;i++){const a=curve[i-1],b=curve[i];if(f<=b.volume_fraction){const t=(f-a.volume_fraction)/(b.volume_fraction-a.volume_fraction);return {y:a.surface_y+(b.surface_y-a.surface_y)*t,w:a.surface_half_width+(b.surface_half_width-a.surface_half_width)*t};}}return {y:g.top_y,w:g.top_half_width};}
function image(path,attrs=''){return `<image href="${base+path}.webp" x="0" y="0" width="1024" height="1024" ${attrs}/>`;}
// Read-only presentation: the existing recipe grader remains authoritative.
function flatWhiteState(actions){
 const espresso=actions.filter(k=>k==='espresso').length,milk=actions.filter(k=>k==='milk90').length,invalid=actions.some(k=>!['espresso','milk90'].includes(k))||espresso>2||milk>1;
 const partial=espresso>=2?'double':espresso===1?'single':'empty';
 if(invalid)return {key:partial,status:'invalid',caption:'Неверный состав · отмени лишний ингредиент'};
 if(espresso===2&&milk===1)return {key:'ready',status:'ready',caption:''};
 if(milk)return {key:partial,status:'incomplete',caption:'Сборка ещё не завершена'};
 return {key:partial,status:actions.length?'building':'empty',caption:''};
}
function flatWhiteCup(actions){const s=flatWhiteState(actions),M=typeof module==='object'&&module.exports?require('./coffee-core'):root.StaffCoffee,ml=actions.reduce((n,k)=>n+(M.parts[k]?.ml||0),0);return `<svg class="coffee-glass coffee-frame-cup" data-frame="${s.key}" data-frame-status="${s.status}" data-liquid-ml="${ml}" viewBox="0 160 1254 960" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><image href="${A.flatWhiteFrames[s.key]}" x="0" y="0" width="1254" height="1254" preserveAspectRatio="xMidYMid meet"/></svg>`;}
function cup(r,actions){if(r.id==='flat-white')return flatWhiteCup(actions);const M=typeof module==='object'&&module.exports?require('./coffee-core'):root.StaffCoffee,k=family(r),g=A.geometry[k],id='cv'+(++serial);let layers=M.layers(r.id,actions).map(l=>({...l}));
// Water and espresso mix; whiskey remains a separate, measured component.
if(actions.includes('water')&&actions.includes('espresso')&&!actions.some(a=>a.startsWith('milk'))){const combined=layers.filter(l=>l.kind==='coffee'||l.kind==='water').reduce((n,l)=>n+l.ml,0);layers=[{kind:'water',ml:combined},...layers.filter(l=>l.kind!=='coffee'&&l.kind!=='water')];}
// Reserve foam from the existing milk volume rather than adding volume twice.
let foam=0;if(r.id==='latte'&&actions.includes('espresso')&&actions.some(a=>a.startsWith('milk'))){const milk=layers.filter(l=>l.kind==='milk').reduce((n,l)=>n+l.ml,0),coffee=layers.filter(l=>l.kind==='coffee').reduce((n,l)=>n+l.ml,0);foam=Math.min(12,milk*.1);layers=[...layers.filter(l=>l.kind!=='milk'&&l.kind!=='coffee'),{kind:'milk',ml:milk-foam},{kind:'coffee',ml:coffee},{kind:'foam',ml:foam}];}
let volume=0,liquid='';for(const l of layers){const bottom=surface(r,volume);volume+=l.ml;const top=surface(r,volume);liquid+=`<rect data-kind="${l.kind}" data-ml="${l.ml}" x="0" y="${top.y}" width="1024" height="${Math.max(0,bottom.y-top.y)+.6}" fill="url(#${id}-${l.kind})"/>`;}
const top=surface(r,volume),last=layers.at(-1);if(volume)liquid+=`<ellipse cx="${g.center_x}" cy="${top.y}" rx="${top.w}" ry="12" fill="${last?.kind==='milk'||last?.kind==='foam'?'#fff5df':'#b87a42'}" opacity=".85"/>`;
const hasMilk=actions.some(a=>a.startsWith('milk')),cream=actions.includes('cream'),chocolate=actions.includes('chocolate'),beanCount=actions.filter(a=>a==='beans').length;
let topping='',foamArt='',creamBody='';if(hasMilk&&volume&&!cream){foamArt=`<g mask="url(#${id}-mask)"><ellipse cx="${g.center_x}" cy="${top.y}" rx="${top.w}" ry="${r.id==='latte'?6:14}" fill="#fff9e9" opacity=".95"/></g>`;}
if(cream){const h=surface(r,volume),creamScale=.58,creamOffset=g.top_y*(1-creamScale);creamBody=`<g mask="url(#${id}-mask)"><path d="M0 ${g.top_y-3}H1024V${h.y+10}H0Z" fill="url(#${id}-cream)"/></g>`;topping+=`<g mask="url(#${id}-foam-mask)">${image('toppings/'+k+'_cream_3',`class="coffee-cream-cap" transform="translate(0 ${creamOffset}) scale(1 ${creamScale})"`)}</g>`;}
if(chocolate){const target=cream?g.top_y:top.y+35;topping+=image('toppings/'+k+'_chocolate',`transform="translate(0 ${target-g.top_y})"`);}
if(beanCount){const shift=cream?Math.max(0,g.foam_top_y+14-(g.top_y-108)):top.y-g.top_y+105;for(let i=0;i<Math.min(beanCount,30);i++){// The supplied garnish contains three beans. Reveal one source bean per action.
const n=i%3,cx=g.center_x+[-52,4,60][n],cy=g.top_y+[-90,-108,-90][n];topping+=`<svg x="${cx-21+(i>=3?(Math.floor(i/3)*15):0)}" y="${cy-14+shift}" width="42" height="28" viewBox="${cx-21} ${cy-14} 42 28">${image('toppings/'+k+'_beans')}</svg>`;}}
return `<svg class="coffee-glass" data-cup="${k}" data-liquid-ml="${volume}" viewBox="0 0 1024 970" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
<linearGradient id="${id}-coffee" x2=".3" y2="1"><stop stop-color="#875025"/><stop offset=".2" stop-color="#5e301a"/><stop offset="1" stop-color="#30180d"/></linearGradient>
<linearGradient id="${id}-water" x2="0" y2="1"><stop stop-color="#ac7747"/><stop offset="1" stop-color="#785035"/></linearGradient>
<linearGradient id="${id}-whiskey"><stop stop-color="#d79b52"/><stop offset="1" stop-color="#a76c33"/></linearGradient>
<linearGradient id="${id}-milk" x2="0" y2="1"><stop stop-color="#f7ead0"/><stop offset="1" stop-color="#d9bd94"/></linearGradient>
<linearGradient id="${id}-syrup"><stop stop-color="#31160d"/><stop offset="1" stop-color="#62351e"/></linearGradient>
<linearGradient id="${id}-foam"><stop stop-color="#fff9e8"/><stop offset="1" stop-color="#eee0c2"/></linearGradient>
<linearGradient id="${id}-cream" x2=".2" y2="1"><stop stop-color="#fff9e9"/><stop offset="1" stop-color="#e5d3b4"/></linearGradient>
<mask id="${id}-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024" style="mask-type:luminance">${image('masks/'+k+'_interior')}</mask>
<mask id="${id}-foam-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1024" height="1024" style="mask-type:luminance">${image('masks/'+k+'_foam_region')}</mask>
<clipPath id="${id}-bounds"><rect width="1024" height="1024"/></clipPath></defs>
${image('cups/'+k+'_shadow')}${image('cups/'+k+'_back')}<g mask="url(#${id}-mask)" class="coffee-fluid">${liquid}</g>${creamBody}${image('cups/'+k+'_front')}${foamArt}<g class="coffee-topping">${topping}</g></svg>`;}
function ingredient(key){const path=A.ingredientIcons[key];if(!path)return '';return `<svg viewBox="0 0 512 512" aria-hidden="true"><image href="${path}" x="0" y="0" width="512" height="512"/></svg>`;}
const preloaded=new Set();function preload(recipeId){if(!root.Image)return;const M=root.StaffCoffee,idx=M.recipes.findIndex(r=>r.id===recipeId),cups=new Set([family(M.recipes[Math.max(0,idx)]),family(M.recipes[(Math.max(0,idx)+1)%M.recipes.length])]);for(const file of A.files){const frame=file.includes('/flat-white-frames-v30/');if(frame&&![M.recipes[Math.max(0,idx)].id,M.recipes[(Math.max(0,idx)+1)%M.recipes.length].id].includes('flat-white'))continue;if(!frame&&!file.includes('/icons-v24/')&&![...cups].some(k=>file.includes('/'+k+'_')))continue;if(preloaded.has(file))continue;preloaded.add(file);const im=new root.Image();im.src=file;}}
const api={cup,ingredient,surface,family,preload,flatWhiteState};if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffCoffeeVisual=api;
})(typeof globalThis!=='undefined'?globalThis:this);
