(function(){
'use strict';
const C=StaffCourse,course=STAFF_COURSE,$=id=>document.getElementById(id);
const trigger=document.createElement('button');trigger.id='openTheory';trigger.className='tab';trigger.textContent='Теория';document.querySelector('.tabs').prepend(trigger);
const panel=document.createElement('dialog');panel.id='theoryPanel';panel.setAttribute('aria-labelledby','theoryTitle');
panel.innerHTML='<header class="theory-header"><button id="theoryBack" aria-label="Назад">←</button><h2 id="theoryTitle">Теория</h2><button id="theoryClose" aria-label="Закрыть теорию">×</button></header><div id="theoryContent" class="theory-content"></div><footer id="theoryFooter" class="theory-footer"></footer><p id="theoryStatus" role="status" aria-live="polite"></p>';
document.querySelector('main').append(panel);
let view='map',lessonId=null,page=0,feedback=null,submitting=false;
function state(){return StaffUI.load().theory||C.empty();}
function persist(theory){const data=StaffUI.load();data.theory=theory;if(!StaffUI.save(data)){const e=$('theoryStatus');e.textContent='Не удалось сохранить прогресс. Попробуйте ещё раз.';e.focus();return false;}return true;}
function node(tag,text,parent){const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;}
function button(text,fn,parent){const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;}
function text(text,parent){return node('p',text,parent);}
function lesson(){return course.lessons.find(l=>l.id===lessonId);}
function map(){view='map';feedback=null;StaffUI.setBusy(false);render();}
function openLesson(id){try{const t=C.open(state(),id,course);if(!persist(t))return;lessonId=id;const r=t.lessons[id];page=Math.min(r.step,lesson().screens.length);view=r.draft?'check':r.lastResult?'result':'lesson';feedback=null;StaffUI.setBusy(view==='check');render();}catch(e){$('theoryStatus').textContent=e.message;}}
function show(){for(const d of document.querySelectorAll('dialog[open]'))if(d!==panel)d.close();window.dispatchEvent(new Event('staff-theory-opened'));if(!panel.open)panel.showModal();const t=state(),resume=C.resume(t,course);if(resume&&t.lessons[resume]&&!t.lessons[resume].completedAt)openLesson(resume);else map();}
function begin(){try{const t=C.begin(state(),lessonId,course);if(!persist(t))return;view='check';feedback=null;StaffUI.setBusy(true);render();}catch(e){$('theoryStatus').textContent=e.message;}}
function submit(choice){if(submitting||view!=='check')return;submitting=true;try{const result=C.answer(state(),lessonId,choice,course);if(!persist(result.theory))return;feedback=result;view='feedback';render();}catch(e){$('theoryStatus').textContent=e.message;}finally{submitting=false;}}
function render(){
 const content=$('theoryContent'),footer=$('theoryFooter');content.replaceChildren();footer.replaceChildren();$('theoryStatus').textContent='';$('theoryBack').hidden=view==='map';$('theoryBack').onclick=map;
 const t=state();
 if(view==='map'){
  node('p','Глава I · Безалкогольное меню',content).className='theory-eyebrow';node('h1','Учимся по шагам',content);text('Изучи материал и ответь минимум на 80% вопросов, чтобы открыть следующий урок.',content);
  const labels={locked:'Закрыт',available:'Доступен',in_progress:'Изучается',completed:'Освоен'},icons={locked:'○',available:'→',in_progress:'◐',completed:'✓'};
  const list=node('ol','',content);list.className='lesson-map';
  for(const l of course.lessons){const s=C.status(t,l,course),r=t.lessons[l.id],li=node('li','',list);const b=button('',()=>openLesson(l.id),li);b.className='lesson-node '+s;b.disabled=s==='locked';const icon=node('span',icons[s],b);icon.className='lesson-icon';icon.setAttribute('aria-hidden','true');const label=node('span','',b);node('strong',l.title,label);let info=labels[s];if(r&&s!=='completed')info+=' · '+Math.min(r.step,l.screens.length)+' / '+l.screens.length+' экранов';if(r?.bestResult)info+=' · лучший '+Math.round(r.bestResult.score/r.bestResult.total*100)+'%';node('small',info,label);}
  const next=C.resume(t,course),all=course.lessons.every(l=>t.lessons[l.id]?.completedAt);
  if(all){text('Первые три урока освоены. Следующий блок пока готовится.',content);button('Повторить материал',()=>openLesson(course.lessons[0].id),footer);}else button(t.lessons[next]?'Продолжить обучение':'Начать обучение',()=>openLesson(next),footer);
 }else{
  const l=lesson(),r=t.lessons[lessonId];node('p',l.title,content).className='theory-eyebrow';
  if(view==='lesson'){
   if(page<l.screens.length){const screen=l.screens[page];node('small','Материал · '+(page+1)+' / '+l.screens.length,content);node('h1',screen.title,content);const ul=node('ul','',content);ul.className='theory-facts';for(const line of screen.lines)node('li',line,ul);
    if(page>0)button('Предыдущий экран',()=>{page--;render();},content).className='theory-secondary';
    button(page===l.screens.length-1?'К проверке':'Далее',()=>{if(page===r.step&&!persist(C.advance(state(),lessonId,course)))return;page++;if(page>=l.screens.length)begin();else render();},footer);
   }else{node('h1','Материал изучен',content);text('Проверка: '+l.questions.length+' вопросов. Проходной порог — 80%.',content);button('Начать проверку',begin,footer);button('Повторить материал',()=>{page=0;render();},content).className='theory-secondary';}
  }else if(view==='check'){
   if(!r.draft){view='result';render();return;}const i=r.draft.answers.length,q=l.questions[i];if(!q){$('theoryStatus').textContent='Состав проверки изменился. Вернитесь к карте уроков.';return;}
   node('small','Проверка · '+(i+1)+' / '+l.questions.length,content);node('h1',q.text,content);const options=node('div','',content);options.className='theory-options';const order=q.options.map((_,i)=>i);for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}for(const choice of order)button(q.options[choice],()=>submit(choice),options);text('Выбери один ответ.',footer);
  }else if(view==='feedback'){
   node('h1',feedback.correct?'Верно':'Есть ошибка',content);if(!feedback.correct)text(feedback.explanation,content);button(feedback.result?'Результат':'Следующий вопрос',()=>{view=feedback.result?'result':'check';feedback=null;render();},footer);
  }else if(view==='result'){
   StaffUI.setBusy(false);const result=r.lastResult;if(!result){view='lesson';render();return;}const passed=result.score*100>=C.THRESHOLD*result.total;
   node('h1',Math.round(result.score/result.total*100)+'%',content);text(result.score+' верных ответов из '+result.total,content);text(passed?'Урок освоен':r.completedAt?'Попытка завершена. Урок остаётся освоенным.':'Для перехода дальше нужно не менее 80%. Повтори материал и попробуй снова.',content);
   const next=course.lessons.find(l2=>(l2.requires||[]).includes(l.id));if(r.completedAt&&next)button('Следующий урок',()=>openLesson(next.id),footer);else if(r.completedAt){text('Следующий блок пока готовится.',content);button('К карте уроков',map,footer);}else button('Повторить проверку',begin,footer);
   button('Повторить материал',()=>{page=0;view='lesson';render();},content).className='theory-secondary';if(r.completedAt)button('Пройти проверку ещё раз',begin,content).className='theory-secondary';
  }
 }
 content.scrollTop=0;const heading=content.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
}
trigger.onclick=show;$('theoryClose').onclick=()=>panel.close();panel.addEventListener('close',()=>StaffUI.setBusy(false));
window.StaffTheory={open:show,cocktailsAllowed:()=>C.cocktailsAllowed(StaffUI.load(),course)};
window.addEventListener('staff-progress-imported',()=>{if(panel.open)map();});
try{const data=StaffUI.load();if(C.legacyMixes(data)&&!data.theory?.legacyCocktailsUnlocked){const t=data.theory||C.empty();t.legacyCocktailsUnlocked=true;persist(t);}}catch(e){$('theoryStatus').textContent=e.message;}
show();
})();
