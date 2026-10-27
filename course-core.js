(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffCourse=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const THRESHOLD=80;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,max=1000000)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const date=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const id=v=>typeof v==='string'&&/^[a-z0-9-]{1,100}$/.test(v);
const empty=()=>({version:1,lessons:{}});
function validate(t){
 if(!object(t)||t.version!==1||!object(t.lessons)||Object.keys(t.lessons).length>500)throw Error('Повреждён прогресс теории. Исходные данные сохранены.');
 if(t.lastLessonId!==undefined&&!id(t.lastLessonId))throw Error('Повреждён ID урока.');
 if(t.legacyCocktailsUnlocked!==undefined&&typeof t.legacyCocktailsUnlocked!=='boolean')throw Error('Повреждён доступ к тренажёру.');
 for(const [key,r] of Object.entries(t.lessons)){
  if(!id(key)||!object(r)||!date(r.startedAt)||!integer(r.step,1000)||!integer(r.attempts))throw Error('Повреждён урок '+key+'.');
  for(const field of ['completedAt','studiedAt'])if(r[field]!==undefined&&!date(r[field]))throw Error('Повреждены даты урока.');
  for(const field of ['lastResult','bestResult'])if(r[field]!==undefined){const a=r[field];if(!object(a)||!integer(a.total,100)||a.total<1||!integer(a.score,a.total)||!date(a.endedAt))throw Error('Повреждён результат урока.');}
  if(r.draft!==undefined&&(!object(r.draft)||!id(r.draft.id)||!Array.isArray(r.draft.answers)||r.draft.answers.length>100||r.draft.answers.some(v=>!integer(v,3))))throw Error('Повреждена проверка урока.');
 }
 return JSON.parse(JSON.stringify(t));
}
function status(t,lesson,course){if(t?.lessons?.[lesson.id]?.completedAt)return 'completed';if(!(lesson.requires||[]).every(key=>t?.lessons?.[key]?.completedAt))return 'locked';return t?.lessons?.[lesson.id]?'in_progress':'available';}
function get(t,key,course){const lesson=course.lessons.find(l=>l.id===key);if(!lesson||status(t,lesson,course)==='locked')throw Error('Сначала завершите предыдущий урок.');return lesson;}
function open(t,key,course,now=new Date().toISOString()){t=validate(t||empty());get(t,key,course);t.lessons[key]??={startedAt:now,step:0,attempts:0};t.lastLessonId=key;return t;}
function advance(t,key,course,now=new Date().toISOString()){t=validate(t);const l=get(t,key,course),r=t.lessons[key];if(!r)throw Error('Сначала откройте урок.');r.step=Math.min(r.step+1,l.screens.length);if(r.step===l.screens.length)r.studiedAt??=now;return t;}
function begin(t,key,course,now=new Date().toISOString()){t=validate(t);const l=get(t,key,course),r=t.lessons[key];if(!r?.studiedAt)throw Error('Сначала изучите материал.');if(!r.draft){r.attempts++;r.draft={id:'check-'+Date.parse(now).toString(36)+'-'+r.attempts,answers:[]};}if(r.draft.answers.length>=l.questions.length)throw Error('Проверка уже завершена.');return t;}
function answer(t,key,choice,course,now=new Date().toISOString()){
 t=validate(t);const l=get(t,key,course),r=t.lessons[key];if(!r?.draft||!integer(choice,3)||r.draft.answers.length>=l.questions.length)throw Error('Ответ не принят.');
 const question=l.questions[r.draft.answers.length];r.draft.answers.push(choice);const correct=choice===question.answer;let result=null;
 if(r.draft.answers.length===l.questions.length){const score=r.draft.answers.reduce((n,a,i)=>n+(a===l.questions[i].answer?1:0),0);result={score,total:l.questions.length,endedAt:now};r.lastResult=result;if(!r.bestResult||score/r.lastResult.total>=r.bestResult.score/r.bestResult.total)r.bestResult=result;if(score*100>=THRESHOLD*l.questions.length)r.completedAt??=now;delete r.draft;}
 return {theory:t,correct,explanation:question.explanation,result};
}
function resume(t,course){const last=course.lessons.find(l=>l.id===t?.lastLessonId);if(last&&status(t,last,course)!=='locked'&&!t.lessons[last.id]?.completedAt)return last.id;return course.lessons.find(l=>status(t,l,course)!=='locked'&&!t?.lessons?.[l.id]?.completedAt)?.id||course.lessons.at(-1)?.id;}
function chapterCompleted(t,course,key){const ls=course.lessons.filter(l=>l.chapter===key);return course.chapters.find(c=>c.id===key)?.published===true&&ls.length>0&&ls.every(l=>!!t?.lessons?.[l.id]?.completedAt);}
function legacyMixes(data){return Object.values(data?.mixes||{}).some(m=>m.attempts>0||m.studyAttempts>0);}
function cocktailsAllowed(data,course){return !!data?.theory?.legacyCocktailsUnlocked||legacyMixes(data)||chapterCompleted(data?.theory,course,'alcoholic-cocktails');}
return {THRESHOLD,empty,validate,status,open,advance,begin,answer,resume,chapterCompleted,legacyMixes,cocktailsAllowed};
});
