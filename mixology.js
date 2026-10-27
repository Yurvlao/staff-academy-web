(function(){
'use strict';
const $=id=>document.getElementById(id),recipes=STAFF_COCKTAILS;
const svg=paths=>'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
$('openProgressMenu').innerHTML=svg('<path d="M8 19v-5M12 19V9M16 19V5"/>');
const trigger=document.createElement('button');trigger.type='button';trigger.className='progress-menu-button';trigger.setAttribute('aria-label','Открыть Коктейли');trigger.setAttribute('aria-haspopup','dialog');trigger.innerHTML=svg('<path d="M8 22h8M12 11v11M2 2l10 10L22 2Z"/>');document.querySelector('.top').prepend(trigger);
const panel=document.createElement('dialog');panel.className='progress-drawer mix-panel';panel.setAttribute('aria-label','Коктейли');panel.innerHTML='<div class="drawer-heading"><button id="mixBack" aria-label="Назад в Коктейли"></button><h2>Коктейли</h2><div class="mix-header-actions"><button id="mixHelp" aria-label="Справка о формуле"></button><button id="mixProgress" aria-label="Прогресс составов"></button><button id="mixClose" aria-label="Закрыть Коктейли">×</button></div></div><nav class="mix-nav" aria-label="Разделы Коктейлей"></nav><label id="mixSelectorLabel"><select id="mixRecipe" aria-label="Название коктейля"></select></label><div id="mixBody"></div><p id="mixStatus" role="status"></p>';document.querySelector('main').append(panel);
const HELP_KEY='staff.mixology.formulaHelp.v1';let mode='Главная',recipe=recipes[0],selected=new Set(),options=[],checked=false,revealed=true,result=null,timer=null,generation=0,paused=false;
const selector=$('mixRecipe');for(const r of recipes){const o=document.createElement('option');o.value=r.id;o.textContent=r.name;selector.append(o);}selector.onchange=()=>{recipe=recipes.find(r=>r.id===selector.value);reset();};
const nav=panel.querySelector('nav');for(const label of ['Изучение','Тренировка']){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{mode=label;reset();};nav.append(b);}
function cancel(){generation++;if(timer!==null)clearTimeout(timer);timer=null;if(StaffUI.setBusy)StaffUI.setBusy(false);}
function reset(){cancel();selected=new Set();checked=false;result=null;paused=false;revealed=mode==='Изучение';options=StaffMix.choices(recipe,recipes,.5+Math.random()*.2);render();}
function home(){mode='Главная';reset();}
function close(){cancel();panel.close();}
function nextRecipe(){const ready=recipes.filter(r=>r.ready),i=ready.findIndex(r=>r.id===recipe.id);recipe=ready[(i+1)%ready.length];selector.value=recipe.id;reset();}
function schedule(ms){if(timer!==null)clearTimeout(timer);const token=++generation;timer=setTimeout(()=>{timer=null;if(token!==generation||!checked||!panel.open)return;if(document.visibilityState==='hidden'){paused=true;render();return;}nextRecipe();},ms);}
trigger.onclick=()=>{if($('progressDrawer').open)$('progressDrawer').close();panel.showModal();home();};$('openProgressMenu').addEventListener('click',()=>{if(panel.open)close();});$('mixClose').onclick=close;$('mixBack').innerHTML=svg('<path d="m12 19-7-7 7-7M5 12h14"/>');$('mixBack').onclick=home;
panel.addEventListener('close',cancel);panel.addEventListener('cancel',cancel);panel.onclick=e=>{if(e.target===panel&&e.clientX>panel.getBoundingClientRect().right)close();};let touch=null;panel.addEventListener('touchstart',e=>{touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});panel.addEventListener('touchend',e=>{if(touch&&touch.x-e.changedTouches[0].clientX>70&&Math.abs(touch.y-e.changedTouches[0].clientY)<60)close();touch=null;},{passive:true});
$('mixHelp').innerHTML=svg('<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 1c0 2-3 2-3 4M12 17h.01"/>');$('mixProgress').innerHTML=svg('<path d="M8 19v-5M12 19V9M16 19V5"/>');
function helpRead(){try{return localStorage.getItem(HELP_KEY)==='read';}catch(_){return false;}}
function helpStyle(){$('mixHelp').hidden=helpRead();}
$('mixHelp').onclick=()=>{cancel();mode='Справка';render();};$('mixProgress').onclick=()=>{cancel();mode='Прогресс составов';render();};helpStyle();
function submit(){
 if(checked)return;checked=true;
 result=StaffMix.check(recipe,[...selected]);const data=StaffUI.load();data.mixes=data.mixes||{};
 data.mixes[recipe.id]=mode==='Изучение'?StaffMix.recordStudy(data.mixes[recipe.id],result):StaffMix.record(data.mixes[recipe.id],result);
 if(!StaffUI.save(data)){checked=false;result=null;$('mixStatus').textContent='Не удалось сохранить ответ. Попробуйте ещё раз.';return;}
 if(StaffUI.setBusy)StaffUI.setBusy(true);render();schedule(result.ok?1250:Math.max(3000,1000+(result.missing.length+result.extra.length)*500));
}
function render(){
 const homeScreen=mode==='Главная',card=['Изучение','Тренировка'].includes(mode);panel.classList.toggle('mix-home',homeScreen);panel.classList.toggle('cocktail-card',card);nav.hidden=!homeScreen;$('mixBack').hidden=homeScreen;$('mixSelectorLabel').hidden=!card;helpStyle();
 const body=$('mixBody');body.replaceChildren();$('mixStatus').textContent='';const node=(tag,text,parent=body)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};const button=(text,fn,parent=body)=>{const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;};
 if(homeScreen)return;
 if(mode==='Справка'){
 node('h3','Как устроен коктейль?');
 node('p','Каждый коктейль собирается по формуле:');
 node('p','Алкогольная часть + Сладкая часть + Противовес + Безалкогольная часть');
 node('p','За сладость отвечают сиропы, пюре, джемы, ликёры и другие подслащивающие компоненты.');
 node('p','Противовесом чаще всего выступает кислая часть (фреш лимона/лайма), горькая часть (биттеры) и другие вкусовые противовесы.');
 node('p','Б/А часть: содовая, тоник, соки и другие компоненты, формирующие объём.');
 button('Прочитано',()=>{try{localStorage.setItem(HELP_KEY,'read');mode='Главная';render();}catch(_){$('mixStatus').textContent='Не удалось сохранить прочтение. Попробуйте ещё раз.';}});return;
 }
 if(mode==='Прогресс составов'){
 const data=StaffUI.load().mixes||{};for(const r of recipes){const v=data[r.id],d=node('details','');node('summary',r.name+' · '+(v?.status||'Новый'),d);node('p',v?'Попыток: '+v.attempts+' · Верных: '+v.successes:'Ответов пока нет',d);if(v){node('p','Повторить: '+new Date(v.due).toLocaleString('ru-RU'),d);node('p','Изучение: '+(v.studyAttempts||0)+' · Верных: '+(v.studySuccesses||0),d);for(const e of v.errors.slice(-10).reverse())node('p','Пропущено: '+e.missing.join(', ')+' · Лишнее: '+e.extra.join(', '),d);}if(r.ready&&(!v||v.due<=Date.now()))button('Повторить',()=>{recipe=r;selector.value=r.id;mode='Тренировка';reset();},d);}return;
 }
 const img=document.createElement('img');img.src=recipe.displayImage||'./images/cocktail-missing.svg';img.alt=recipe.name;img.className='mix-image';body.append(img);
 if(!recipe.ready){node('p','Состав уточняется');return;}
 if(mode==='Изучение'&&!checked){const reveal=button(revealed?'Скрыть состав':'Показать состав',()=>{revealed=!revealed;render();});reveal.className='composition-toggle';if(revealed)node('p',recipe.ingredients.map(i=>i.name).join(' · ')).className='short-composition';}
 const grid=node('div','');grid.className='mix-options';for(const i of options){const b=button(i.name,()=>{if(checked)return;selected.has(i.id)?selected.delete(i.id):selected.add(i.id);render();},grid);b.setAttribute('aria-pressed',String(selected.has(i.id)));b.disabled=checked;}
 const footer=node('div','');footer.className='cocktail-footer';
 if(!checked){const done=button('Готово',submit,footer);done.className='cocktail-done';}
 else {node('strong',result.ok?'Верно!':'Неверно',footer);if(!result.ok){const names=ids=>ids.map(id=>options.find(i=>i.id===id)?.name||id).join(', ');node('p',[result.missing.length?'Пропущено: '+names(result.missing):'',result.extra.length?'Лишнее: '+names(result.extra):''].filter(Boolean).join('. '),footer);}button(paused?'Продолжить':'Задержать переход',()=>{paused=!paused;if(paused){if(timer!==null)clearTimeout(timer);timer=null;generation++;}else schedule(result.ok?1250:3000);render();},footer);}
}
window.addEventListener('staff-progress-imported',()=>{cancel();if(panel.open)reset();});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&checked){cancel();paused=true;if(panel.open)render();}});
})();
