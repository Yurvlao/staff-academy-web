(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffCourse=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const THRESHOLD=80,REVISION='theory-mvp01';
const aliases={'warming-assortment-v1':'theory-warming-assortment-v1','warming-composition-v1':'theory-warming-ingredients-v1','water-assortment-v1':'theory-water-v1'};
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v),integer=(v,max=1000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max,date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v)),id=v=>typeof v==='string'&&/^[a-z0-9-]{1,100}$/.test(v),clone=v=>JSON.parse(JSON.stringify(v));
const empty=()=>({version:1,lessons:{}}),validChoice=v=>integer(v,3)||(Array.isArray(v)&&v.length<=40&&new Set(v).size===v.length&&v.every(x=>typeof x==='string'&&x.length<=100));
function validResult(a){return object(a)&&integer(a.total,100)&&a.total>0&&integer(a.score,a.total)&&date(a.endedAt);}
function validate(t){
 if(!object(t)||t.version!==1||!object(t.lessons)||Object.keys(t.lessons).length>500)throw Error('Повреждён прогресс теории. Исходные данные сохранены.');
 if(t.lastLessonId!==undefined&&!id(t.lastLessonId))throw Error('Повреждён ID урока.');
 for(const f of ['legacyCocktailsUnlocked','theoryMvp01','coffeeStationV2'])if(t[f]!==undefined&&typeof t[f]!=='boolean')throw Error('Повреждены сведения о переносе теории.');
 for(const [key,r] of Object.entries(t.lessons)){
  if(!id(key)||!object(r)||!date(r.startedAt)||!integer(r.step,1000)||!integer(r.attempts))throw Error('Повреждён урок '+key+'.');
  for(const f of ['completedAt','studiedAt'])if(r[f]!==undefined&&!date(r[f]))throw Error('Повреждены даты урока.');
  for(const f of ['lastResult','bestResult'])if(r[f]!==undefined&&!validResult(r[f]))throw Error('Повреждён результат урока.');
  if(r.checkHistory!==undefined&&(!Array.isArray(r.checkHistory)||r.checkHistory.length>100||r.checkHistory.some(x=>!validResult(x))))throw Error('Повреждена история урока.');
  if(r.practice!==undefined&&(!object(r.practice)||!Array.isArray(r.practice.answers)||r.practice.answers.length>100||r.practice.answers.some(a=>!object(a)||!id(a.questionId)||typeof a.correct!=='boolean'||!validChoice(a.choice))||(r.practice.completedAt!==undefined&&!date(r.practice.completedAt))))throw Error('Повреждено закрепление.');
  if(r.draft!==undefined){const d=r.draft;if(!object(d)||!id(d.id)||!Array.isArray(d.answers)||d.answers.length>100)throw Error('Повреждена проверка урока.');
   if(d.questionIds!==undefined){if(!Array.isArray(d.questionIds)||!d.questionIds.length||d.questionIds.length>100||new Set(d.questionIds).size!==d.questionIds.length||d.questionIds.some(x=>!id(x))||d.answers.length>=d.questionIds.length||d.answers.some((a,i)=>!object(a)||a.questionId!==d.questionIds[i]||!validChoice(a.choice)||typeof a.correct!=='boolean'))throw Error('Повреждены ответы урока.');}
   else if(d.answers.some(v=>!integer(v,3)))throw Error('Повреждены старые ответы урока.');
  }
 }
 return clone(t);
}
function migrate(t){t=validate(t);if(t.theoryMvp01)return t;for(const [old,key] of Object.entries(aliases)){const r=t.lessons[old];if(r&&!t.lessons[key]){const next=clone(r);next.originLessonId=old;next.mvpRevision=REVISION;next.step=0;delete next.studiedAt;delete next.practice;if(next.draft){next.legacyDrafts=[...(next.legacyDrafts||[]),clone(next.draft)];delete next.draft;}t.lessons[key]=next;}}if(aliases[t.lastLessonId])t.lastLessonId=aliases[t.lastLessonId];t.theoryMvp01=true;return t;}
function migrateCoffee(t){t=validate(t);const r=t.lessons['theory-coffee-v1'];if(!r||t.coffeeStationV2)return t;if(r.coffeeRevision!=='v2'){r.coffeeV1Snapshot=clone(r);r.step=Math.min(r.studiedAt?7:6,Math.max(0,r.step-1));delete r.draft;delete r.practice;}r.coffeeRevision='v2';t.coffeeStationV2=true;return t;}
function recordFor(t,key){return t?.lessons?.[aliases[key]||key]||t?.lessons?.[key];}
function completed(t,key){return !!recordFor(t,key)?.completedAt;}
function status(t,lesson,course){if(completed(t,lesson.id))return 'completed';if(!(lesson.requires||[]).every(key=>completed(t,key)))return 'locked';return recordFor(t,lesson.id)?'in_progress':'available';}
function get(t,key,course){const l=course.lessons.find(l=>l.id===key);if(!l||status(t,l,course)==='locked')throw Error('Сначала завершите предыдущий урок.');return l;}
function prepare(t,course){return course.id==='staff-theory-mvp01'?migrateCoffee(migrate(t||empty())):validate(t||empty());}
function open(t,key,course,now=new Date().toISOString()){t=prepare(t,course);get(t,key,course);if(!t.lessons[key]){t.lessons[key]={startedAt:now,step:0,attempts:0};if(key==='theory-coffee-v1'){t.lessons[key].coffeeRevision='v2';t.coffeeStationV2=true;}}t.lastLessonId=key;return t;}
function advance(t,key,course,now=new Date().toISOString()){t=prepare(t,course);const l=get(t,key,course),r=t.lessons[key];if(!r)throw Error('Сначала откройте урок.');r.step=Math.min(r.step+1,l.screens.length);if(r.step===l.screens.length)r.studiedAt??=now;return t;}
function restudy(t,key,course){t=prepare(t,course);get(t,key,course);const r=t.lessons[key];r.step=0;delete r.studiedAt;if(r.practice){r.practiceHistory=[...(r.practiceHistory||[]),r.practice].slice(-20);delete r.practice;}if(r.draft){r.legacyDrafts=[...(r.legacyDrafts||[]),r.draft];delete r.draft;}return t;}
function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function question(t,key,course,kind='check'){const l=get(t,key,course),r=t.lessons[key];if(kind==='practice')return (l.practice||[])[r.practice?.answers.length||0];const d=r.draft;if(!d)return null;return d.questionIds?l.questions.find(q=>q.id===d.questionIds[d.answers.length]):l.questions[d.answers.length];}
function grade(q,choice){if(q.type==='coffee'){const m=typeof module==='object'&&module.exports?require('./coffee-core'):globalThis.StaffCoffee;return m.grade(q.recipeId,choice,q.grading||'strict');}if(q.type==='ingredients'){if(!Array.isArray(choice)||!validChoice(choice)||choice.some(x=>!q.options.includes(x)))throw Error('Неверный выбор ингредиентов.');const missing=q.required.filter(x=>!choice.includes(x)),extra=choice.filter(x=>!q.required.includes(x));return {correct:!missing.length&&!extra.length,missing,extra};}if(!integer(choice,3))throw Error('Выберите один ответ.');return {correct:choice===q.answer,missing:[],extra:[]};}
function coffeeError(r,q,choice,g,now){if(q.type==='coffee'&&!g.correct)r.coffeeErrors=[...(Array.isArray(r.coffeeErrors)?r.coffeeErrors:[]),{recipeId:q.recipeId,choice:[...choice],at:now}].slice(-100);}
function reinforce(t,key,choice,course,expected,now=new Date().toISOString()){
 t=prepare(t,course);const l=get(t,key,course),r=t.lessons[key];if(!r?.studiedAt)throw Error('Сначала изучите материал.');const q=question(t,key,course,'practice');if(!q||q.id!==expected)throw Error('Этот ответ уже принят.');const g=grade(q,choice);coffeeError(r,q,choice,g,now);r.practice??={answers:[]};r.practice.answers.push({questionId:q.id,choice,correct:g.correct});if(r.practice.answers.length===(l.practice||[]).length)r.practice.completedAt=now;return {theory:t,...g,practiceDone:!!r.practice.completedAt,result:null};
}
function begin(t,key,course,now=new Date().toISOString(),random=Math.random){t=prepare(t,course);const l=get(t,key,course),r=t.lessons[key];if(!r?.studiedAt)throw Error('Сначала изучите материал.');if(l.practice?.length&&!r.practice?.completedAt)throw Error('Сначала завершите закрепление.');
 if(!r.draft){r.attempts++;r.draft={id:'check-'+Date.parse(now).toString(36)+'-'+r.attempts,answers:[]};if(l.revision)Object.assign(r.draft,{revision:l.revision,questionIds:shuffle(l.questions,random).slice(0,l.checkSize||l.questions.length).map(q=>q.id)});}
 return t;
}
function answer(t,key,choice,course,now=new Date().toISOString(),expected){
 t=prepare(t,course);const l=get(t,key,course),r=t.lessons[key],q=question(t,key,course);if(!r?.draft||!q||(expected&&expected!==q.id))throw Error('Этот ответ уже принят.');const g=grade(q,choice),modern=!!r.draft.questionIds;
 coffeeError(r,q,choice,g,now);r.draft.answers.push(modern?{questionId:q.id,choice,correct:g.correct}:choice);const total=modern?r.draft.questionIds.length:l.questions.length;let result=null;
 if(r.draft.answers.length===total){const score=modern?r.draft.answers.filter(a=>a.correct).length:r.draft.answers.reduce((n,a,i)=>n+(a===l.questions[i].answer?1:0),0);result={score,total,endedAt:now,id:r.draft.id};r.lastResult=result;if(!r.bestResult||score/total>=r.bestResult.score/r.bestResult.total)r.bestResult=result;if(l.revision)r.checkHistory=[...(r.checkHistory||[]),result].slice(-100);if(score*100>=THRESHOLD*total)r.completedAt??=now;delete r.draft;}
 return {theory:t,...g,explanation:q.explanation,result};
}
function resume(t,course){const last=course.lessons.find(l=>l.id===t?.lastLessonId);if(last&&status(t,last,course)!=='locked'&&!completed(t,last.id))return last.id;return course.lessons.find(l=>status(t,l,course)!=='locked'&&!completed(t,l.id))?.id||course.lessons.filter(l=>status(t,l,course)!=='locked').at(-1)?.id;}
function chapterCompleted(t,course,key){const ls=course.lessons.filter(l=>l.chapter===key);return course.chapters.find(c=>c.id===key)?.published===true&&ls.length>0&&ls.every(l=>completed(t,l.id));}
function legacyMixes(data){return Object.values(data?.mixes||{}).some(m=>m.attempts>0||m.studyAttempts>0);}
function cocktailsAllowed(data,course){return !!data?.theory?.legacyCocktailsUnlocked||legacyMixes(data)||chapterCompleted(data?.theory,course,'alcoholic-cocktails');}
return {THRESHOLD,REVISION,aliases,empty,validate,migrate,migrateCoffee,recordFor,completed,status,open,advance,restudy,shuffle,question,grade,reinforce,begin,answer,resume,chapterCompleted,legacyMixes,cocktailsAllowed};
});
