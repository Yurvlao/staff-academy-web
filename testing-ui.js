(function(){
'use strict';
const T=StaffTesting,course=STAFF_COURSE,$=id=>document.getElementById(id),catalog=StaffAssessment.catalog(STAFF_QUESTION_BANK,StaffBank.metadata,course),panel=document.createElement('section');panel.id='testingView';panel.className='section-view testing-view';panel.setAttribute('aria-label','Тестирование');panel.innerHTML='<div id="testingBody"></div><p id="testingStatus" role="status" aria-live="polite"></p>';
let optionOrder=null,optionQuestion=null;
let active=false,view='levels',currentLevel=1,feedback=null,timer=null,generation=0,initialized=false;
const names={1:'I · Фундамент',2:'II · Понимание',3:'III · Углублённый'};
function node(tag,text,parent){const e=document.createElement(tag);e.textContent=text;parent.append(e);return e;}
function button(text,fn,parent){const b=node('button',text,parent);b.type='button';b.onclick=fn;return b;}
function stop(){generation++;if(timer!==null)clearTimeout(timer);timer=null;StaffUI.setBusy(false);}
function save(data){if(StaffUI.save(data))return true;$('testingStatus').textContent='Не удалось сохранить ответ. Попробуйте ещё раз.';return false;}
function canResume(c){const allowed=new Set(pool(c.level).map(q=>q.id));return c.ids.every(id=>allowed.has(id));}
function pool(l){return T.pool(catalog,StaffUI.load(),course,l,StaffUI.formulaRead());}
function start(l){optionOrder=null;try{const data=StaffUI.load();if(data.testing?.current&&!canResume(data.testing.current))throw Error('Незавершённый блиц содержит ещё не изученные темы. Сначала пройдите соответствующую теорию.');data.testing=T.start(data.testing,l,pool(l));if(!save(data))return;currentLevel=data.testing.current.level;feedback=null;view='question';render();}catch(e){$('testingStatus').textContent=e.message;}}
function schedule(){if(timer!==null)clearTimeout(timer);if(!active||!feedback||document.visibilityState==='hidden')return;const token=++generation;StaffUI.setBusy(true);timer=setTimeout(()=>{timer=null;if(token!==generation||!active)return;view=feedback.result?'result':'question';feedback=null;StaffUI.setBusy(false);render();},feedback.correct?1000:1800);}
function answer(id,choice,sessionId){if(view!=='question'||feedback)return;const data=StaffUI.load();if(data.testing?.current?.id!==sessionId||!canResume(data.testing.current))return;try{const out=T.answer(data.testing,id,choice,catalog);data.testing=out.testing;data.cards[id]=StaffLearning.schedule(data.cards[id],out.correct);if(!save(data))return;feedback={...out,id,choice};view='feedback';render();schedule();}catch(e){$('testingStatus').textContent=e.message;}}
function render(){
 const body=$('testingBody');body.replaceChildren();$('testingStatus').textContent='';const data=StaffUI.load(),t=data.testing||T.empty();
 if(view==='levels'){
  node('h2','Тестирование',body);node('p','Блиц: 10 вопросов · проходной результат 8 из 10',body);
  for(const l of [1,2,3]){const unlocked=T.unlocked(t,l),n=pool(l).length;const b=button(names[l]+(t.passedLevels.includes(l)?' · ✓':''),()=>start(l),body);b.disabled=!unlocked||n<10;b.className='blitz-level';node('small',!unlocked?'Сначала пройдите предыдущий уровень.':n<10?'Изучено подходящих вопросов: '+n+' / 10. Пройдите дополнительную теорию.':'Доступен',body);}
  button('К теории',()=>StaffNav.show('theory'),body).className='theory-secondary';
 }else if(view==='question'||view==='feedback'){
  const c=t.current;if(view==='question'&&c&&!canResume(c)){view='levels';render();$('testingStatus').textContent='Незавершённые ответы сохранены. Для продолжения пройдите соответствующую теорию.';return;}const q=view==='feedback'?catalog.find(q=>q.id===feedback.id):catalog.find(q=>q.id===c?.ids[c.answers.length]);if(!q){view='levels';render();return;}
  node('small','Уровень '+names[currentLevel]+' · вопрос '+(view==='feedback'?(t.current?.answers.length||10):(c.answers.length+1))+' / 10',body);node('h2',q.text,body);const choices=node('div','',body);choices.className='theory-options';
  if(!optionOrder||optionQuestion!==q.id){optionQuestion=q.id;optionOrder=T.shuffle([0,1,2,3]);}
  for(const i of optionOrder){const b=button(q.options[i],()=>answer(q.id,i,c?.id),choices);b.disabled=view==='feedback';if(view==='feedback'){if(i===q.answer)b.className='answer-correct';else if(i===feedback.choice)b.className='answer-wrong';}}
  if(view==='feedback'){node('p',feedback.correct?'✓':'✕',body).setAttribute('role','status');if(!feedback.correct)node('p',q.explanation,body);}
 }else if(view==='result'){
  const r=t.results[0];if(!r){view='levels';render();return;}node('small','Уровень '+names[r.level],body);node('h2',r.score+' / 10 · '+r.score*10+'%',body);node('p',r.score>=8?'Пройден':'Не пройден',body);button('Повторить блиц',()=>start(r.level),body).className='cocktail-done';if(r.score>=8&&r.level<3){const b=button('Уровень '+names[r.level+1],()=>start(r.level+1),body);const n=pool(r.level+1).length;b.disabled=n<10;if(n<10)node('p','Для следующего уровня нужно пройти дополнительную теорию: '+n+' / 10 вопросов.',body);}button('К теории',()=>StaffNav.show('theory'),body).className='theory-secondary';button('Все уровни',()=>{view='levels';render();},body).className='theory-secondary';
 }
}
StaffNav.register('testing',{element:panel,pause(){active=false;stop();},resume(){active=true;if(!initialized){const c=StaffUI.load().testing?.current;if(c){currentLevel=c.level;view='question';}initialized=true;render();}else if(feedback)schedule();else render();},imported(){stop();feedback=null;view='levels';initialized=false;}});
window.addEventListener('staff-review',()=>{StaffNav.show('testing');if(!StaffUI.load().testing?.current){view='levels';render();$('testingStatus').textContent='Блицы включают только изученный материал. Сроки повторения и прежние ответы сохранены.';}});
})();
