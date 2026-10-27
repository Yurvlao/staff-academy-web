(function(){
'use strict';
const views=new Map(),ids=['theory','cocktails','testing'];let active=null;
function show(id){if(!views.has(id))return;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();if(active&&active!==id)views.get(active).pause?.();active=id;for(const [key,v] of views){v.element.hidden=key!==id;const b=document.getElementById('nav-'+key);b.classList.toggle('active',key===id);b.setAttribute('aria-pressed',String(key===id));}views.get(id).resume?.();}
window.StaffNav={register(id,view){views.set(id,view);document.getElementById('sectionHost').append(view.element);view.element.hidden=true;},show,suspend(){if(active)views.get(active).pause?.();},resume(){if(active&&document.visibilityState!=='hidden')views.get(active).resume?.();},current:()=>active};
for(const id of ids)document.getElementById('nav-'+id).onclick=()=>show(id);
document.addEventListener('visibilitychange',()=>{if(!active)return;if(document.visibilityState==='hidden')views.get(active).pause?.();else views.get(active).resume?.();});
window.addEventListener('staff-progress-imported',()=>{for(const v of views.values())v.imported?.();if(active)show(active);});
})();
