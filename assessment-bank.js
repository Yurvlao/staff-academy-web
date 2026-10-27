(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.StaffAssessment=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Permanent links; existing question payloads and IDs are never rewritten.
const lessonLinks={'staff-0483':'warming-composition-v1','staff-0484':'warming-composition-v1','staff-0485':'warming-composition-v1','staff-0486':'warming-composition-v1','staff-0487':'warming-composition-v1','staff-0488':'warming-assortment-v1'};
const courseIds=['warm-range-1','warm-range-2','warm-range-3','warm-range-4','warm-ingredients-1','warm-ingredients-2','warm-ingredients-3','warm-ingredients-4','warm-ingredients-5','warm-ingredients-6','warm-ingredients-7','warm-ingredients-8','water-volume-aqua','water-volume-san','water-volume-dausuz','water-volume-borjomi','water-versions'];
function extraRows(course){return course.lessons.flatMap(l=>l.questions.map(q=>{const n=courseIds.indexOf(q.id);if(n<0)return null;return [l.title,q.text,q.options,q.answer,q.explanation,'staff-'+String(600+n).padStart(4,'0')];})).filter(Boolean);}
function futureLesson(m){const cat=m.category||'';if(cat.includes('Теория вина'))return 'wine-foundations-v1';if(cat.includes('Теория пива')||cat==='Пиво')return 'beer-foundations-v1';if(cat.includes('Безалкогольные коктейли'))return 'na-cocktails-v1';if(cat.includes('Коктейли')||m.requiresFormula)return 'cocktail-recipes-v1';if(cat.includes('Гастро'))return 'pairing-foundations-v1';return 'spirits-foundations-v1';}
function catalog(bank,metadata,course){
 const current=new Map(course.lessons.flatMap(l=>l.questions.map(q=>[q.id,{q,lesson:l}])));
 return bank.map(row=>{const n=Number(row[5].slice(6))-600,c=courseIds[n]&&current.get(courseIds[n]),m=metadata[row[5]];
 if(c)return {id:row[5],lessonId:c.lesson.id,level:c.lesson.id==='warming-composition-v1'&&c.q.id!=='warm-ingredients-8'||c.q.id==='water-versions'?2:1,text:row[1],options:row[2],answer:row[3],explanation:row[4],active:true};
 const excluded=!m||m.protected||m.status!=='active'||/ситуац|гость/i.test(row[0]);
 return {id:row[5],lessonId:excluded?null:(lessonLinks[row[5]]||futureLesson(m)),level:m?.level||1,text:row[1],options:row[2],answer:row[3],explanation:row[4],active:!excluded,requiresFormula:!!m?.requiresFormula};
 });
}
return {lessonLinks,courseIds,extraRows,catalog};
});
