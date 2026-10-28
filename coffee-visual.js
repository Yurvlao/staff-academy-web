(function(root){'use strict';let serial=0;
function cup(r,actions){const M=typeof module==='object'&&module.exports?require('./coffee-core'):StaffCoffee,id='cv'+(++serial),layers=M.layers(r.id,actions);let volume=0,liquid='';for(const l of layers){const low=232-M.heightForVolume(volume/r.capacity)*174;volume+=l.ml;const high=232-M.heightForVolume(volume/r.capacity)*174;liquid+=`<rect x="74" y="${high}" width="194" height="${low-high+.4}" fill="url(#${id}-${l.kind})"/>`;}
const y=232-M.heightForVolume(volume/r.capacity)*174,last=layers.at(-1),color=last?.kind==='milk'?'#fff7df':last?.kind==='syrup'?'#4b2615':'#c69351';if(volume)liquid+=`<ellipse cx="170" cy="${y}" rx="98" ry="13" fill="${color}" opacity=".9"/><ellipse cx="170" cy="${y-1}" rx="90" ry="9" fill="#fff0c3" opacity=".25"/>`;
const cream=actions.includes('cream'),crumb=actions.includes('chocolate'),creamMl=r.id==='viennese'?120:50,creamTop=cream?(r.id==='viennese'?32:232-M.heightForVolume((volume+creamMl)/r.capacity)*174):y;
let topping='';if(cream)topping+=`<path d="M80 ${y} Q84 ${creamTop+14} 118 ${creamTop+10} Q142 ${creamTop-21} 167 ${creamTop} Q210 ${creamTop-14} 231 ${creamTop+14} Q260 ${creamTop+12} 264 ${y}Z" fill="url(#${id}-cream)"/><path d="M104 ${creamTop+24}Q170 ${creamTop+2} 238 ${creamTop+24}M96 ${creamTop+39}Q170 ${creamTop+17} 247 ${creamTop+39}M90 ${creamTop+58}Q170 ${creamTop+34} 253 ${creamTop+58}M86 ${creamTop+77}Q170 ${creamTop+52} 258 ${creamTop+77}" fill="none" stroke="#dfcdb0" stroke-width="4" opacity=".5"/>`;
if(crumb)for(let i=0;i<24;i++){const x=107+(i*37%130),cy=(cream?creamTop+12:y-2)+(i*13%16);topping+=`<path d="M${x} ${cy}l5 -3 5 5 -6 3Z" fill="${i%2?'#53301f':'#805033'}"/>`;}
return `<svg class="coffee-glass" viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
<linearGradient id="${id}-glass" x1="0" x2="1"><stop stop-color="#fff" stop-opacity=".8"/><stop offset=".12" stop-color="#9d998b" stop-opacity=".2"/><stop offset=".35" stop-color="#fff" stop-opacity=".05"/><stop offset=".82" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#6b655b" stop-opacity=".45"/></linearGradient>
<linearGradient id="${id}-edge"><stop stop-color="#554c40"/><stop offset=".12" stop-color="#fffdf5"/><stop offset=".45" stop-color="#b9b3a7"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#544b3f"/></linearGradient>
<linearGradient id="${id}-coffee" x2=".3" y2="1"><stop stop-color="#875025"/><stop offset=".2" stop-color="#3c1d0d"/><stop offset="1" stop-color="#170c06"/></linearGradient>
<linearGradient id="${id}-water" x2="0" y2="1"><stop stop-color="#b17438"/><stop offset="1" stop-color="#46210d"/></linearGradient>
<linearGradient id="${id}-milk" x2="0" y2="1"><stop stop-color="#fffdf4"/><stop offset=".12" stop-color="#fff5de"/><stop offset="1" stop-color="#dcc5a5"/></linearGradient>
<linearGradient id="${id}-syrup"><stop stop-color="#271209"/><stop offset=".5" stop-color="#693019"/><stop offset="1" stop-color="#24120b"/></linearGradient>
<linearGradient id="${id}-cream" x2=".3" y2="1"><stop stop-color="#fffef9"/><stop offset="1" stop-color="#dfc9a9"/></linearGradient>
<radialGradient id="${id}-shadow"><stop stop-color="#49341d" stop-opacity=".35"/><stop offset="1" stop-color="#49341d" stop-opacity="0"/></radialGradient>
<clipPath id="${id}-mask"><path d="M78 56 L98 218 Q170 247 242 218 L262 56Z"/></clipPath></defs>
<ellipse cx="179" cy="263" rx="132" ry="18" fill="url(#${id}-shadow)"/>
<path d="M266 83 C356 41 345 205 254 213 L257 188 C312 188 331 86 268 106Z" fill="url(#${id}-glass)" stroke="url(#${id}-edge)" stroke-width="8"/><path d="M275 89 C330 63 332 178 269 198" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/>
<path d="M72 49 L92 224 Q170 270 248 224 L268 49Z" fill="url(#${id}-glass)" stroke="url(#${id}-edge)" stroke-width="4"/>
<g clip-path="url(#${id}-mask)" class="coffee-fluid">${liquid}</g><g class="coffee-topping">${topping}</g>
<path d="M72 49 L92 224 Q170 270 248 224 L268 49Z" fill="url(#${id}-glass)" opacity=".35"/>
<path d="M98 219 Q170 252 242 219 L241 232 Q170 270 99 232Z" fill="url(#${id}-edge)" opacity=".85"/>
<ellipse cx="170" cy="49" rx="98" ry="23" fill="none" stroke="url(#${id}-edge)" stroke-width="5"/><ellipse cx="170" cy="48" rx="92" ry="19" fill="#fff" fill-opacity=".06" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>
<path d="M87 66L107 213Q111 223 117 223L101 68Z" fill="#fff" opacity=".55"/><path d="M235 65L222 216" stroke="#fff" stroke-width="7" opacity=".35"/><path d="M85 62L102 210M258 63L240 215" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></svg>`;
}
function ingredient(key){const M=typeof module==='object'&&module.exports?require('./coffee-core'):StaffCoffee;if(key==='cream'||key==='chocolate'||key==='syrup'){const fill=key==='cream'?'#fff4db':key==='syrup'?'#582a15':'#653b23';let inside=key==='cream'?'<path d="M34 42Q34 27 52 29Q50 18 61 13Q55 31 77 33L89 46Z" fill="#fff9eb" stroke="#dbc9ad"/>':key==='chocolate'?Array.from({length:15},(_,i)=>`<path d="M${31+i*17%54} ${30+i*7%20}l8 -6 7 8 -9 5Z" fill="${i%2?'#51301e':'#805238'}"/>`).join(''):'';return `<svg viewBox="0 0 120 80" aria-hidden="true"><ellipse cx="60" cy="69" rx="39" ry="6" fill="#513c2418"/><path d="M22 40Q27 72 60 72Q93 72 98 40Z" fill="#fff" fill-opacity=".4" stroke="#a89e8a"/><ellipse cx="60" cy="41" rx="37" ry="13" fill="${fill}"/>${inside}<path d="M25 45Q60 68 95 45" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/></svg>`;}
const r={id:'espresso',capacity:50},action=key==='espresso'?['espresso']:[];let svg=cup(r,action);if(key==='water')svg=svg.replace('class="coffee-glass"','class="coffee-glass ingredient-water"');if(key.startsWith('milk'))svg=cup({id:'cappuccino',capacity:150},['milk120']);return svg;
}
const api={cup,ingredient};if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffCoffeeVisual=api;
})(typeof globalThis!=='undefined'?globalThis:this);
