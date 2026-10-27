(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffTesting=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const Course=typeof module==='object'&&module.exports?require('./course-core.js'):StaffCourse;
const SIZE=10,PASS=8,empty=()=>({version:1,passedLevels:[],recent:{},results:[]});
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),id=x=>typeof x==='string'&&/^[a-z0-9-]{1,100}$/.test(x),level=x=>[1,2,3].includes(x),date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const ids=a=>Array.isArray(a)&&a.length===SIZE&&new Set(a).size===SIZE&&a.every(x=>/^staff-\d{4,}$/.test(x));
function validate(t){if(!obj(t)||t.version!==1||!Array.isArray(t.passedLevels)||t.passedLevels.length>3||new Set(t.passedLevels).size!==t.passedLevels.length||t.passedLevels.some(l=>!level(l))||!obj(t.recent)||!Array.isArray(t.results)||t.results.length>100)throw Error('Повреждён прогресс тестирования.');
 for(const [l,v] of Object.entries(t.recent))if(!['1','2','3'].includes(l)||!ids(v))throw Error('Повреждён список вопросов блица.');
 for(const r of t.results)if(!obj(r)||!id(r.id)||!level(r.level)||r.total!==SIZE||!Number.isInteger(r.score)||r.score<0||r.score>SIZE||!date(r.startedAt)||!date(r.endedAt))throw Error('Повреждён результат блица.');
 if(t.current!==undefined){const c=t.current;if(!obj(c)||!id(c.id)||!level(c.level)||!ids(c.ids)||!date(c.startedAt)||!Array.isArray(c.answers)||c.answers.length>=SIZE||c.answers.some((a,i)=>!obj(a)||a.id!==c.ids[i]||!Number.isInteger(a.choice)||a.choice<0||a.choice>3||typeof a.correct!=='boolean'))throw Error('Повреждён незавершённый блиц.');}
 return JSON.parse(JSON.stringify(t));
}
function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function pool(catalog,data,course,l,formulaRead){const published=new Set(course.lessons.map(x=>x.id));return catalog.filter(q=>q.active&&q.level===l&&q.lessonId&&published.has(q.lessonId)&&Course.completed(data.theory,q.lessonId)&&(!q.requiresFormula||formulaRead));}
function unlocked(t,l){return l===1||(t?.passedLevels||[]).includes(l-1);}
function start(t,l,questions,random=Math.random,now=new Date().toISOString()){
 t=validate(t||empty());if(!unlocked(t,l))throw Error('Сначала пройдите предыдущий уровень.');if(questions.length<SIZE)throw Error('Для блица нужно 10 изученных вопросов. Пройдите дополнительную теорию.');
 if(t.current)return t;const prior=new Set(t.recent[l]||[]),fresh=shuffle(questions.filter(q=>!prior.has(q.id)),random),old=shuffle(questions.filter(q=>prior.has(q.id)),random),picked=shuffle([...fresh,...old].slice(0,SIZE),random).map(q=>q.id);
 t.current={id:'blitz-'+Date.parse(now).toString(36)+'-'+Math.floor(random()*1e9),level:l,ids:picked,answers:[],startedAt:now};t.recent[l]=picked;return t;
}
function answer(t,questionId,choice,catalog,now=new Date().toISOString()){
 t=validate(t);const c=t.current;if(!c||c.ids[c.answers.length]!==questionId)throw Error('Этот ответ уже принят.');const q=catalog.find(q=>q.id===questionId);if(!q||!Number.isInteger(choice)||choice<0||choice>3)throw Error('Вопрос недоступен.');const correct=choice===q.answer;c.answers.push({id:questionId,choice,correct});let result=null;
 if(c.answers.length===SIZE){result={id:c.id,level:c.level,total:SIZE,score:c.answers.filter(a=>a.correct).length,startedAt:c.startedAt,endedAt:now};t.results=[result,...t.results].slice(0,100);if(result.score>=PASS&&!t.passedLevels.includes(c.level))t.passedLevels.push(c.level);delete t.current;}
 return {testing:t,correct,result};
}
return {SIZE,PASS,empty,validate,shuffle,pool,unlocked,start,answer};
});
