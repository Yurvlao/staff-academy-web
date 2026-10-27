(function(){
'use strict';
const recipes=STAFF_COCKTAILS,$=id=>document.getElementById(id),panel=document.createElement('section');panel.id='cocktailsView';panel.className='section-view cocktails-view mix-panel';panel.setAttribute('aria-label','Коктейли');panel.innerHTML='<div id="mixBody"></div><p id="mixStatus" role="status" aria-live="polite"></p>';
let active=false,recipe=null,selected=new Set(),options=[],result=null,timer=null,generation=0,userPaused=false,initialized=false;
function node(tag,text,parent){const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;}
function button(text,fn,parent){const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;}
function stop(){generation++;if(timer!==null)clearTimeout(timer);timer=null;StaffUI.setBusy(false);}
function allowed(){return StaffCourse.cocktailsAllowed(StaffUI.load(),STAFF_COURSE);}
function start(){stop();const data=StaffUI.load();data.cocktailPractice=StaffMix.newRound(data.cocktailPractice,recipes);if(!StaffUI.save(data))return;loadCard();}
function loadCard(){stop();result=null;userPaused=false;selected=new Set();const p=StaffUI.load().cocktailPractice;if(!p?.round){render();return;}const r=p.round;recipe=recipes.find(x=>x.id===r.order[r.answers.length]);if(recipe)options=StaffMix.choices(recipe,recipes,.5+Math.random()*.2);initialized=true;render();}
function schedule(){if(timer!==null)clearTimeout(timer);if(!active||userPaused||!result||document.visibilityState==='hidden')return;const token=++generation;StaffUI.setBusy(true);const ms=result.ok?1250:Math.max(3000,1000+(result.missing.length+result.extra.length)*650);timer=setTimeout(()=>{timer=null;if(token!==generation||!active)return;loadCard();},ms);}
function submit(roundId,recipeId){if(result||!allowed())return;const data=StaffUI.load(),round=data.cocktailPractice?.round;if(!round||round.id!==roundId||round.order[round.answers.length]!==recipeId)return;const checked=StaffMix.check(recipe,[...selected]);const now=Date.now();data.mixes=data.mixes||{};data.mixes[recipe.id]=StaffMix.record(data.mixes[recipe.id],checked,now);data.cocktailPractice=StaffMix.answerRound(data.cocktailPractice,recipe.id,checked.ok,now);if(!StaffUI.save(data)){$('mixStatus').textContent='Не удалось сохранить ответ. Попробуйте ещё раз.';return;}result=checked;render();schedule();}
function render(){
 const body=$('mixBody');body.replaceChildren();$('mixStatus').textContent='';
 if(!allowed()){node('h2','Коктейли',body);node('p','Доступ откроется после освоения главы «Алкогольные коктейли». Глава готовится.',body);button('К теории',()=>StaffNav.show('theory'),body);return;}
 const p=StaffUI.load().cocktailPractice,r=p?.round;if(!r){node('h2','Коктейли',body);button('Начать круг',start,body);return;}
 if(!result&&r.answers.length===r.order.length){node('h2','Круг завершён',body);node('p',r.answers.filter(a=>a.ok).length+' верных составов из '+r.order.length,body);button('Новый круг',start,body).className='cocktail-done';return;}
 if(!recipe){node('p','Список доступных рецептур обновился.',body);button('Новый круг',start,body);return;}
 node('small','Коктейль '+(result?r.answers.length:r.answers.length+1)+' / '+r.order.length,body);node('h2',recipe.name,body);
 const img=document.createElement('img');img.src=recipe.displayImage||'./images/cocktail-missing.svg';img.alt=recipe.name;img.className='mix-image';body.append(img);
 const grid=node('div','',body);grid.className='mix-options';const required=new Set(recipe.ingredients.map(i=>i.id));
 for(const i of options){const b=button(i.name,()=>{if(result)return;selected.has(i.id)?selected.delete(i.id):selected.add(i.id);render();},grid);b.setAttribute('aria-pressed',String(selected.has(i.id)));b.disabled=!!result;if(result){if(required.has(i.id))b.className='answer-correct';else if(selected.has(i.id))b.className='answer-wrong';}}
 const footer=node('div','',body);footer.className='cocktail-footer';
 if(!result){const cardId=recipe.id;button('Готово',()=>submit(r.id,cardId),footer).className='cocktail-done';}else{node('strong',result.ok?'Верно!':'Неверно',footer);if(!result.ok){const names=ids=>ids.map(id=>options.find(i=>i.id===id)?.name||id).join(', ');node('p',[result.missing.length?'Пропущено: '+names(result.missing):'',result.extra.length?'Лишнее: '+names(result.extra):''].filter(Boolean).join('. '),footer);}button(userPaused?'Продолжить автоматически':'Задержать переход',()=>{userPaused=!userPaused;stop();render();schedule();},footer);}
}
StaffNav.register('cocktails',{element:panel,pause(){active=false;stop();},resume(){active=true;if(!initialized){if(StaffUI.load().cocktailPractice)loadCard();else if(allowed())start();else render();}else if(!allowed()){stop();render();}else if(result)schedule();else render();},imported(){stop();result=null;initialized=false;}});
})();
