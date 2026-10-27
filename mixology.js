(function(){
'use strict';
const $=id=>document.getElementById(id), recipes=STAFF_COCKTAILS;
const svg=paths=>'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths+'</svg>';
$('openProgressMenu').innerHTML=svg('<path d="M8 19v-5M12 19V9M16 19V5"/>');
const trigger=document.createElement('button');trigger.type='button';trigger.className='progress-menu-button';trigger.setAttribute('aria-label','Открыть Миксологию');trigger.setAttribute('aria-haspopup','dialog');trigger.innerHTML=svg('<path d="M8 22h8M12 11v11M2 2l10 10L22 2Z"/>');document.querySelector('.top').prepend(trigger);
const panel=document.createElement('dialog');panel.className='progress-drawer mix-panel';panel.setAttribute('aria-label','Миксология');panel.innerHTML='<div class="drawer-heading"><h2>Миксология</h2><div class="mix-header-actions"><button id="mixHelp" aria-label="Справка о формуле"></button><button id="mixProgress" aria-label="Прогресс составов"></button><button id="mixClose" aria-label="Закрыть Миксологию">×</button></div></div><nav class="mix-nav" aria-label="Разделы Миксологии"></nav><label id="mixSelectorLabel">Коктейль<select id="mixRecipe"></select></label><div id="mixBody"></div><p id="mixStatus" role="status"></p>' ;document.querySelector('main').append(panel);
let mode='Главная',recipe=recipes[0],selected=new Set(),options=[],checked=false,hidden=false;
const selector=$('mixRecipe');for(const r of recipes){const o=document.createElement('option');o.value=r.id;o.textContent=r.name+(r.ready?'':' · уточняется');selector.append(o);}selector.onchange=()=>{recipe=recipes.find(r=>r.id===selector.value);reset();};
const nav=panel.querySelector('nav');for(const label of ['Изучение','Тренировка']){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{mode=label;reset();};nav.append(b);}
let feedbackVisited=false;let hintCount=0,hintRole='',hintUsed=false;
function reset(){feedbackVisited=false;selected=new Set();checked=false;hidden=false;options=StaffMix.choices(recipe,recipes,mode==='Контроль'?.4+Math.random()*.3:.5+Math.random()*.2);render();}
function close(){panel.close();}
trigger.onclick=()=>{if($('progressDrawer').open)$('progressDrawer').close();panel.showModal();mode='Главная';hintCount=0;hintRole='';hintUsed=false;reset();};$('openProgressMenu').addEventListener('click',()=>{if(panel.open)panel.close();});$('mixClose').onclick=close;
panel.onclick=e=>{if(e.target===panel&&e.clientX>panel.getBoundingClientRect().right)close();};let touch=null;panel.addEventListener('touchstart',e=>{touch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});panel.addEventListener('touchend',e=>{if(touch&&touch.x-e.changedTouches[0].clientX>70&&Math.abs(touch.y-e.changedTouches[0].clientY)<60)close();touch=null;},{passive:true});
const HELP_KEY='staff.mixology.formulaHelp.v1';
$('mixHelp').innerHTML=svg('<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 1c0 2-3 2-3 4M12 17h.01"/>');
$('mixProgress').innerHTML=svg('<path d="M8 19v-5M12 19V9M16 19V5"/>');
function helpRead(){try{return localStorage.getItem(HELP_KEY)==='read';}catch(_){return false;}}
function helpStyle(){$('mixHelp').classList.toggle('help-read',helpRead());}
let helpReturn='Главная',highlight='';
$('mixHelp').onclick=()=>{helpReturn=mode;mode='Справка';highlight='';render();};
$('mixProgress').onclick=()=>{mode='Прогресс составов';reset();};
helpStyle();
function render(){panel.classList.toggle('mix-home',mode==='Главная');nav.hidden=mode!=='Главная';$('mixSelectorLabel').hidden=!['Изучение','Тренировка','Контроль'].includes(mode);helpStyle();const body=$('mixBody');body.replaceChildren();$('mixStatus').textContent='';const node=(tag,text,parent=body)=>{const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;};const button=(text,fn)=>{const b=node('button',text);b.type='button';b.onclick=fn;return b;};
if(mode==='Главная')return;
if(mode==='Справка'){
 node('h3','Как устроен коктейль?');node('p','Основа + Сладость + Баланс + Наполнитель');
 const roles=[['Основа','Алкогольная база либо безалкогольный аналог.'],['Сладость','Сиропы, пюре, джемы, сахар, ликёры и другие подслащивающие компоненты.'],['Баланс','Кислотность, горечь и другие вкусовые противовесы. Кислотность и горечь — разные свойства.'],['Наполнитель','Содовая, тоник, соки и другие компоненты, формирующие объём.']];
 for(const [name,text] of roles){const p=node('p',name+': '+text);if(highlight.includes(name))p.className='formula-highlight';}
 node('p','Это учебная эвристика, а не универсальная формула. Не все категории есть в каждом коктейле. Один ингредиент может выполнять несколько функций.');
 node('h4','Пример: Негрони');node('p','Джин Бифитер — основа. Мартини Россо — сладость, винная и травяная составляющая. Кампари — горечь и баланс. Наполнитель отсутствует. Кампари не является кислым компонентом, аналогичным лимонному или лаймовому соку.');
 button('Понятно, запомнил',()=>{try{localStorage.setItem(HELP_KEY,'read');mode=helpReturn;render();}catch(_){$('mixStatus').textContent='Не удалось сохранить прочтение. Попробуйте ещё раз.';}});button('Назад без подтверждения',()=>{mode=helpReturn;render();});return;
}
button('← Главное меню',()=>{mode='Главная';reset();});
if(mode==='Тренировка')button('Контроль без подсказок',()=>{mode='Контроль';reset();});
if(mode==='Изучение')button('Узнай коктейль',()=>{mode='Узнай коктейль';render();});
if(mode==='Узнай коктейль'){
 selector.hidden=true;
 const verified=recipes.filter(r=>r.imageStatus==='verified');
 if(verified.length<4){node('p','Нужно минимум четыре подтверждённых изображения.');return;}
 const target=verified[Math.floor(Math.random()*verified.length)];
 node('h3','Узнай коктейль');const image=document.createElement('img');image.src=target.displayImage||'./images/cocktail-missing.svg';image.alt='Определите коктейль по фотографии';image.className='mix-image';body.append(image);
 const choices=[target,...verified.filter(r=>r.id!==target.id).sort(()=>Math.random()-.5).slice(0,3)].sort(()=>Math.random()-.5);
 let answered=false;for(const r of choices)button(r.name,()=>{if(answered)return;answered=true;node('p',(r.id===target.id?'Верно. ':'Неверно. ')+target.name+' — '+target.visualDescription);button('Следующее фото',render);});
 node('p','Учебное распознавание по оригинальным фото; в итоговую аттестацию результат не входит.');return;
 }
 if(mode==='Прогресс составов'){selector.hidden=true;const data=StaffUI.load().mixes||{};for(const r of recipes){const v=data[r.id];const d=node('details','');node('summary',r.name+' · '+(v?.status||'Новый'),d);node('p',v?'Попыток: '+v.attempts+' · Полностью верных: '+v.successes+' · Повторить: '+new Date(v.due).toLocaleString('ru-RU'):'Ответов пока нет',d);if(v){node('p','Последняя сборка: '+new Date(v.last).toLocaleString('ru-RU')+' · Ошибок в сохранённой истории: '+v.errors.length,d);for(const error of v.errors.slice(-10).reverse())node('p',new Date(error.date).toLocaleString('ru-RU')+' · Пропущено: '+error.missing.join(', ')+' · Лишнее: '+error.extra.join(', '),d);}if(r.ready&&(!v||v.due<=Date.now())){const b=document.createElement('button');b.textContent='Повторить';b.onclick=()=>{recipe=r;selector.value=r.id;mode='Тренировка';reset();};d.append(b);}}node('p','История ошибок: до 100 записей на рецепт; в списке показаны последние 10. В режиме «Узнай коктейль» используются только фотографии с подтверждённым названием.');return;}
selector.hidden=false;node('h3',recipe.name);const img=document.createElement('img');img.src=recipe.displayImage||'./images/cocktail-missing.svg';img.alt=recipe.imageStatus==='missing'?'Фотография отсутствует':recipe.visualDescription;img.className='mix-image';body.append(img);node('p','Изображение: '+recipe.imageStatus+' · '+recipe.visualDescription);
if(!recipe.ready){node('p','Рецептура требует уточнения. Сборка и контроль недоступны. '+recipe.note);return;}
function composition(){node('p',recipe.note);node('p','Функциональные роли — учебная классификация; неоднозначные роли отмечены отдельно.');for(const i of recipe.ingredients)node('p',i.name+' — '+i.roles.join(', '));node('p',recipe.source);}
if(mode==='Изучение'){button(hidden?'Показать состав':'Скрыть состав',()=>{hidden=!hidden;render();});if(!hidden)composition();button('Собрать самостоятельно',()=>{mode='Тренировка';reset();});return;}
node('p','Выбрано компонентов: '+selected.size);const grid=node('div','');grid.className='mix-options';for(const i of options){const b=node('button',i.name,grid);b.type='button';b.setAttribute('aria-pressed',String(selected.has(i.id)));b.disabled=checked;b.onclick=()=>{selected.has(i.id)?selected.delete(i.id):selected.add(i.id);render();};}
if(!checked)button('Проверить состав',()=>{const result=StaffMix.check(recipe,[...selected]);const data=StaffUI.load();data.mixes=data.mixes||{};data.mixes[recipe.id]=StaffMix.record(data.mixes[recipe.id],result);if(!StaffUI.save(data)){ $('mixStatus').textContent='Ответ не записан: проверьте сообщение об ошибке хранения.';return;}checked=true;render();});
else{const result=StaffMix.check(recipe,[...selected]);node('h4',result.ok?'Состав собран верно':'Есть ошибки в составе');const names=ids=>ids.map(id=>options.find(i=>i.id===id)?.name||id).join(', ')||'Нет';node('p','Верно: '+names(result.correct));node('p','Пропущено: '+names(result.missing));node('p','Лишнее: '+names(result.extra));composition();
 if(result.ok){hintCount=0;hintUsed=true;}else if(helpRead()&&!feedbackVisited){
 const ingredient=recipe.ingredients.find(i=>result.missing.includes(i.id)&&i.roles.some(r=>!r.includes('Прочее')));
 if(ingredient){feedbackVisited=true;const role=ingredient.roles.find(r=>!r.includes('Прочее'));hintCount=hintRole===role?hintCount+1:1;hintRole=role;
 if(!hintUsed||hintCount>=3){hintUsed=true;hintCount=0;node('p','Помнишь формулу коктейля?');button('Вспомнить',()=>{helpReturn=mode;highlight=role;mode='Справка';render();});node('p','Пропущен компонент '+ingredient.name+'. Его роль: '+role+'.');}}
 }
 button(result.ok?'Ещё одна сборка':'Повторить сборку',reset);}
}
window.addEventListener('staff-progress-imported',()=>{if(panel.open)reset();});
})();
