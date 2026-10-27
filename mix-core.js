(function(r,f){const api=f();if(typeof module==='object'&&module.exports)module.exports=api;else r.StaffMix=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function check(recipe,selected){const required=recipe.ingredients.map(i=>i.id),set=new Set(selected);const missing=required.filter(id=>!set.has(id)),extra=[...set].filter(id=>!required.includes(id));return {ok:!missing.length&&!extra.length,missing,extra,correct:required.filter(id=>set.has(id))};}
function choices(recipe,recipes,ratio=.6,random=Math.random){const right=recipe.ingredients;const canonical=id=>id.replace('джин бифитер','джин');const pool=[...new Map(recipes.filter(r=>r.id!==recipe.id&&r.ready).sort((a,b)=>Number(b.ingredients.some(i=>canonical(i.id)===canonical(right[0]?.id||'')))-Number(a.ingredients.some(i=>canonical(i.id)===canonical(right[0]?.id||'')))).flatMap(r=>r.ingredients).filter(i=>!right.some(x=>canonical(x.id)===canonical(i.id))).map(i=>[i.id,i])).values()];const n=Math.round(right.length*(1/ratio-1));const result=[...right,...pool.slice(0,n)];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;}
function record(prev,result,now=Date.now()){const old=prev||{attempts:0,successes:0,reps:0,interval:0,ease:2.5,errors:[],days:[]};const v={...old,attempts:old.attempts+1,successes:old.successes+(result.ok?1:0),last:now,trainingDates:[...(old.trainingDates||[]),now].slice(-100),errors:[...old.errors],days:[...old.days]};if(result.ok){v.reps++;v.interval=v.reps===1?1:v.reps===2?3:Math.max(1,Math.round(v.interval*v.ease));v.ease=Math.min(3,v.ease+.1);if(!old.last||now>=old.due){v.days=[...new Set([...v.days,new Date(now).toLocaleDateString('en-CA')])].slice(-30);v.successfulInterval=old.interval;}}else{v.errors.push({date:now,missing:result.missing,extra:result.extra});v.errors=v.errors.slice(-100);v.reps=0;v.interval=0;v.ease=Math.max(1.3,v.ease-.2);v.days=[];v.successfulInterval=0;}v.due=now+v.interval*86400000;v.status=v.reps>=3&&v.days.length>=3&&v.successfulInterval>=7?'Освоен':v.days.length>=2?'Закрепляется':'Изучается';return v;}
function recordStudy(prev,result,now=Date.now()){
 const old=prev||{attempts:0,successes:0,reps:0,interval:0,ease:2.5,errors:[],days:[],due:now,status:'Изучается'};
 return {...old,attempts:old.attempts+1,successes:old.successes+(result.ok?1:0),studyAttempts:(old.studyAttempts||0)+1,studySuccesses:(old.studySuccesses||0)+(result.ok?1:0),last:now,errors:result.ok?[...old.errors]:[...old.errors,{date:now,missing:result.missing,extra:result.extra}].slice(-100)};
}
function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function validatePractice(p){
 const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x),ids=a=>Array.isArray(a)&&a.length<=500&&new Set(a).size===a.length&&a.every(x=>typeof x==='string'&&/^[a-z0-9-]{1,100}$/.test(x));
 if(!obj(p)||p.version!==1||!ids(p.lastOrder))throw Error('Повреждены данные круга коктейлей.');
 if(p.round!==undefined){const r=p.round;if(!obj(r)||typeof r.id!=='string'||!ids(r.order)||!r.order.length||!Array.isArray(r.answers)||r.answers.length>r.order.length||r.answers.some((a,i)=>!obj(a)||a.recipeId!==r.order[i]||typeof a.ok!=='boolean'||typeof a.at!=='number'||!Number.isFinite(a.at)||a.at<0))throw Error('Повреждён круг коктейлей.');}
 return JSON.parse(JSON.stringify(p));
}
function newRound(prev,recipes,random=Math.random,now=Date.now()){
 const p=prev?validatePractice(prev):{version:1,lastOrder:[]},last=p.round?.order||p.lastOrder,order=shuffle(recipes.filter(r=>r.ready).map(r=>r.id),random);if(!order.length)throw Error('Нет готовых рецептур.');if(order.length>1&&order.join()===last.join())order.push(order.shift());
 return {version:1,lastOrder:last,round:{id:'mix-'+now.toString(36)+'-'+Math.floor(random()*1e9),order,answers:[]}};
}
function answerRound(prev,recipeId,ok,now=Date.now()){const p=validatePractice(prev),r=p.round;if(!r||r.order[r.answers.length]!==recipeId)throw Error('Этот состав уже проверен.');r.answers.push({recipeId,ok,at:now});return p;}
return {check,choices,record,recordStudy,shuffle,validatePractice,newRound,answerRound};});
