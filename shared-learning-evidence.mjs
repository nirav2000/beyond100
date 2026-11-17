// Shared Learning Evidence v1, additive to Beyond100's existing diagnostic ledger.
// Keep the original Firebase record and Version Lab comparisons unchanged.
import {mountEvidencePanel} from 'https://nirav2000.github.io/Apps/learning-evidence/v1/panel.js';
const ready=()=>document.getElementById('evidence-plan')&&window.BEYOND100_EVIDENCE?.getState;
const safeId=x=>String(x||'').trim().slice(0,160);
const correct=x=>x==='fast'||x==='hesitant';
const delay=phase=>phase==='retrieve1'||phase==='retrieve2'||phase==='retention-check';
const convert=(event,cycles)=>{
  if(!event?.id)return null;
  const outcome=event.outcome;
  const type=event.kind;
  if(!['fast','hesitant','prompted','noConcept'].includes(outcome))return null;
  const skill=safeId(event.skill||event.questionId||event.stage||'general');
  const concept=(event.subject==='English'?'english:':'maths:')+safeId(event.topicId||'general')+':'+skill;
  const originalPhase=event.phase||event.step||'';
  const phase=delay(originalPhase)||type==='retention-check'?'retrieval'
    :originalPhase==='apply'?'transfer'
    :['diagnostic-response','ladder-response','language-probe'].includes(type)||originalPhase==='diagnose'?'diagnostic':'practice';
  // Only explicit prompt levels can establish independent success.
  const help=event.promptLevel;
  let support=help==='independent'?'none'
    :help==='read'||help==='clarify'?'small-prompt'
    :help==='hint'?'substantial-hint'
    :help==='explained'?'worked-example'
    :outcome==='prompted'?'small-prompt':'unknown';
  const ts=Date.parse(event.updatedAt||event.createdAt||'');
  if(!Number.isFinite(ts))return null;
  const teach=Date.parse(cycles?.[skill]?.steps?.teach?.at||'');
  const taughtAt=Number.isFinite(teach)&&teach<=ts?teach:null;
  return {id:'beyond100:'+event.id,concept,phase,correct:correct(outcome),total:1,
    support,novel:originalPhase==='apply',at:ts,updatedAt:ts,taughtAt,
    durationMs:Number.isFinite(event.responseSeconds)?Math.round(event.responseSeconds*1000):null,
    source:{kind:'beyond100-legacy',ref:event.id}};
};
function start(){
 if(!ready())return false;
 let panel;
 try{
   panel=mountEvidencePanel({target:'#evidence-plan',appId:'beyond100',accountId:'guest',learnerId:'sai',
      title:'Shared learning evidence · Sai'});
 }catch(error){console.warn('Learning Evidence panel unavailable',error);return false;}
 const capture=()=>{
   const state=window.BEYOND100_EVIDENCE.getState();
   const rows=(state?.events||[]).map(e=>convert(e,state.cycles||{})).filter(Boolean);
   try{panel.store.ingest(rows);}
   catch(error){console.warn('Could not save shared evidence; Beyond100 original records remain available',error);}
 };
 capture();
 window.addEventListener('beyond100-learning-evidence-saved',capture);
 window.addEventListener('beyond100-topic-rendered',capture);
 window.BEYOND100_SHARED_EVIDENCE={store:panel.store,refresh:capture,panel};
 if(new URLSearchParams(location.search).get('learningEvidence')==='1'){
   document.querySelector('[data-section="evidence-plan"]')?.click();
   panel.element?.scrollIntoView({block:'start'});
 }
 return true;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>start());
else start();
