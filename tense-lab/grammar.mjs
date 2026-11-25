import model from "./model.mjs";
const grammar=(function createGrammar(model){
 const verbs={...model.verbs,study:["study","studied","studied","studying"," French"],swim:["swim","swam","swum","swimming",""]};
 const persons=["I","You","He","She","It","We","They"];
 const personNames=["First person singular","Second person","Third person singular","Third person singular","Third person singular","First person plural","Third person plural"];
 const times=model.times,aspects=["Simple","Progressive","Perfect","Perfect progressive"];
 const meanings=["Event or habit","In progress","Looking back","Activity leading up to a time"];
 const modalNames={might:"Possibility or uncertainty",must:"Necessity or strong inference",could:"Possibility or ability",should:"Advice or expectation"};
 function validate(k,p,t,a){if(!verbs[k]||!persons.includes(p)||!Number.isInteger(t)||!times[t]||!Number.isInteger(a)||!aspects[a])throw Error("Invalid grammar selection")}
 function third(k){return ({study:"studies",wash:"washes"})[k]||verbs[k][0]+"s"}
 function parts(k,p,t,a,modal=""){
  validate(k,p,t,a);
  if(modal&&!Object.hasOwn(modalNames,modal))throw Error("Unknown modal");
  const [base,past,part,ing]=verbs[k],sing=["He","She","It"].includes(p);
  const be=t===0?(p==="I"||sing?"was":"were"):p==="I"?"am":sing?"is":"are",have=t===0?"had":sing?"has":"have";
  const w=(text,role)=>({text,role});
  const tokens=[w(p,"person")];
  if(modal)tokens.push(w(modal,"modal"));
  else if(t===2)tokens.push(w("will","future"));
  const bare=Boolean(modal)||t===2;
  if(a===0)tokens.push(w(bare?base:t===0?past:sing?third(k):base,"main"));
  if(a===1)tokens.push(w(bare?"be":be,"progressive"),w(ing,"main"));
  if(a===2)tokens.push(w(bare?"have":have,"perfect"),w(part,"main"));
  if(a===3)tokens.push(w(bare?"have":have,"perfect"),w("been","progressive"),w(ing,"main"));
  if(verbs[k][4])tokens.push(w(verbs[k][4].trim(),"object"));
  return tokens;
 }
 function sentence(k,p,t,a,modal=""){return parts(k,p,t,a,modal).map(x=>x.text).join(" ")+"."}
 function timeClue(k,t,a){return k==="read"&&a===0?(t===0?" yesterday":t===1?" every day":" tomorrow"):""}
 function withClue(k,p,t,a){return sentence(k,p,t,a).slice(0,-1)+timeClue(k,t,a)+"."}
 const normalized=s=>String(s||"").toLowerCase().replace(/[’‘]/g,"'").trim().replace(/[.!?]+$/,"").replace(/\s+/g," ").trim().replace(/\b(i|you|he|she|it|we|they)'ll\b/g,"$1 will").replace(/\b(i)'m\b/g,"$1 am").replace(/\b(you|we|they)'re\b/g,"$1 are").replace(/\b(i|you|we|they)'ve\b/g,"$1 have");
 function mark(s,q){
  const n=normalized(s), expand=v=>{
   const m=v.match(/^(he|she|it)'s (.+)$/);
   return m?[m[1]+" is "+m[2],m[1]+" has "+m[2]]:[v];
  };
  return [q.answer,...(q.accept||[])].some(x=>expand(n).includes(normalized(x)));
 }
 const rotate=(xs,n)=>xs.slice(n%xs.length).concat(xs.slice(0,n%xs.length));
 function analyse(k="play",level=0,variant=0){
  if(!verbs[k])k="play";
  const r=[],add=(id,sentence,prompt,answer,options,reason,hint,dimension)=>r.push({id:"grammar-analyse-"+variant+"-"+id,prompt:"“"+sentence+"” — "+prompt,display:sentence,question:prompt,answer,options,reason,hint,dimension});
  const examples=level===0?[[k,"I",0,1],[k,"You",2,0]]:level===1?[[k,"He",1,2],[k,"They",0,3],[k,"You",2,1]]:[[k,"We",1,3],[k,"She",0,0],[k,"They",2,2]];
  for(let i=0;i<examples.length;i++){
   const [key,p,t,a]=examples[(i+variant)%examples.length],s=withClue(key,p,t,a);
   add(i+"-time",s,"When is the sentence talking about?",times[t],rotate(times,i+1),"The verb words and any time clues tell us when.","Look for a past form, a present form or will.","time");
   add(i+"-aspect",s,"What kind of description is this?",aspects[a],rotate(aspects,i+2),aspects[a]+": "+meanings[a]+".","Look for the helping words and the main verb form.","aspect");
   add(i+"-person",s,"Which grammatical person is the subject?",personNames[persons.indexOf(p)],rotate(["First person singular","Second person","Third person singular","First person plural","Third person plural"],i+1),p+" is "+personNames[persons.indexOf(p)].toLowerCase()+".","I/we = first; you = second; he/she/it/they = third.","person");
   if(level>0){
    const main=parts(key,p,t,a).find(x=>x.role==="main").text;
    add(i+"-main",s,"Which word is the main verb?",main,null,"The main verb supplies the action or state.","Ignore the helping words.","main-verb");
   }
  }
  if(level===2){
   add("went-time","I went playing yesterday.","When did this happen?","Past",times,"Went and yesterday place the event in the past.","Find the past form of go.","time");
   add("went","I went playing yesterday.","What is the aspect of the finite verb went?","Simple",aspects,"Went is simple past. Playing is an -ing complement; there is no be + -ing construction. The more usual expression is ‘I went out to play yesterday’.","Identify the finite verb went, not just the -ing word.","aspect");
   const s="I might have been studying French.";
   add("modal",s,"Which word expresses possibility?","might",["might","have","been","studying"],"Might expresses uncertainty. Have marks perfect; been + studying marks progressive.","Which word changes how certain the speaker is?","modality");
   add("modal-aspect",s,"Which aspect is expressed?","Perfect progressive",aspects,"Have looks back; been studying describes activity in progress.","Look for have + been + -ing.","aspect");
  }
  return r.map(q=>({...q,accept:q.dimension==="aspect"?(q.answer==="Progressive"?["Continuous"]:q.answer==="Perfect progressive"?["Perfect continuous"]:[]):[]}));
 }
 function build(k="play",level=0,variant=0){
  if(!verbs[k])k="play";
  const p=variant%2===0?"You":"We";
  const chain=level===0?[[p,1,0,"Use "+(p==="You"?"the second person (you)":"the first person plural (we)")+" and the present simple.", "person"],[p,2,0,"Change to future time.","time"],[p,2,1,"Make the action progressive (in progress).","aspect"],[p,2,2,"Make it perfect (looking back).","aspect"],["He",2,2,"Change the subject to he (third person singular).","person"],["He",1,2,"Change to present time.","time"]]:
  level===1?[[p,0,1,"Use "+p.toLowerCase()+" in the past progressive.","time-aspect"],["She",0,1,"Change the subject to she.","person"],["She",1,1,"Change to present time.","time"],["She",1,3,"Make it perfect progressive.","aspect"],["They",1,3,"Change the subject to they.","person"],["They",0,3,"Change to past time.","time"]]:
  [["He",1,0,"Use he in the present simple.","person-time"],["They",1,0,"Change the subject to they.","person"],["They",0,0,"Change to past time.","time"],["They",0,2,"Make it perfect.","aspect"],["They",0,3,"Make it perfect progressive.","aspect"],["I",0,3,"Change the subject to I.","person"]];
  return chain.map(([p,t,a,question,dimension],i)=>{
   const previous=i?withClue(k,...chain[i-1].slice(0,3)):"",answer=sentence(k,p,t,a);
   return {id:"grammar-build-"+variant+"-"+i,display:previous||"Action: "+verbs[k][0]+verbs[k][4],question,prompt:(previous?"Starting sentence: "+previous:"Action: "+verbs[k][0]+verbs[k][4])+" "+question+" Write the complete sentence. Keep the action the same.",answer,options:null,dimension,reason:"The target form is "+answer+" Keep the action the same.",hint:"Keep the action and use "+p+" with "+times[t].toLowerCase()+" "+aspects[a].toLowerCase()+".",key:k,t,a,accept:[answer.slice(0,-1)+timeClue(k,t,a)+"."]};
  });
 }
 return {verbs,persons,personNames,times,aspects,meanings,modalNames,parts,sentence,withClue,mark,analyse,build};
})(model);
export default grammar;
