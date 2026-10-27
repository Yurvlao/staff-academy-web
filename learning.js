(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffLearning=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const config={correct:3,days:3,interval:7};
const day=t=>{const d=new Date(t);return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
function record(old,ok,due,interval,now=Date.now()){
 const v=old&&typeof old==='object'?{...old}:{correct:0,days:[],interval:0};
 if(!ok)return {correct:0,days:[],interval:0};
 v.correct=(Number(v.correct)||0)+1;
 const days=Array.isArray(v.days)?v.days:[];
 // Same-day retries and early practice cannot manufacture spaced evidence.
 if(!days.length||now>=due){v.days=[...new Set([...days,day(now)])].slice(-30);v.interval=now>=due?interval:0;}
 return v;
}
function state(card){if(!card)return 'Новая';const v=card.learning;if(v&&v.correct>=config.correct&&Array.isArray(v.days)&&v.days.length>=config.days&&v.interval>=config.interval)return 'Освоена';return v&&v.days&&v.days.length>=2?'Закрепляется':'Изучается';}
function summary(bank,stats,now=Date.now()){const ids=bank.map(q=>q[5]);const seen=ids.filter(id=>stats.cards[id]);const due=seen.filter(id=>stats.cards[id].due<=now);const future=seen.filter(id=>stats.cards[id].due>now);return {total:ids.length,seen:seen.length,mastered:seen.filter(id=>state(stats.cards[id])==='Освоена').length,due,future,next:future.length?Math.min(...future.map(id=>stats.cards[id].due)):null};}
function schedule(prev,ok,now=Date.now()){
 const old=prev||{ease:2.5,interval:0,reps:0,errors:0,due:0};const v={...old};
 if(ok){v.reps++;v.interval=v.reps===1?1:v.reps===2?3:Math.max(1,Math.round(v.interval*v.ease));v.ease=Math.min(3,Math.max(1.3,v.ease+.1));}else{v.reps=0;v.errors++;v.interval=0;v.ease=Math.max(1.3,v.ease-.2);}
 v.due=now+(ok?v.interval*86400000:0);v.learning=record(old.learning,ok,old.due,old.interval,now);return v;
}
return {config,record,state,summary,schedule};});
