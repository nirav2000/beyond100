const model=(function buildModel(){
 const verbs={play:["play","played","played","playing"," the piano"],practise:["practise","practised","practised","practising"," the bassoon"],walk:["walk","walked","walked","walking"," to school"],eat:["eat","ate","eaten","eating"," breakfast"],read:["read","read","read","reading"," a book"],write:["write","wrote","written","writing"," a sentence"],paint:["paint","painted","painted","painting"," a picture"],cook:["cook","cooked","cooked","cooking"," dinner"],clean:["clean","cleaned","cleaned","cleaning"," my room"],climb:["climb","climbed","climbed","climbing"," a hill"],draw:["draw","drew","drawn","drawing"," a picture"],wash:["wash","washed","washed","washing"," the dishes"]};
 const times=["Past","Present","Future"],aspects=["Simple","Continuous","Perfect","Perfect continuous"],lessons=["My life timeline","Simple forms","Continuous forms","Perfect forms","Perfect continuous","Tense matching"],days=[1,3,7],DAY=86400000;
 const explanations=[
 "Simple forms describe a fact, a habit or an event viewed as a whole. They need not describe a short event. ‘I was in Year 4’ is a past state.",
 "Continuous forms describe an activity in progress at the time we are talking about. Use was/am/will be + -ing. ‘I was a baby’ is simple past, not continuous.",
 "Perfect forms look back from a reference point to something earlier. Use had/have/will have + the past participle. The earlier situation may be finished or may continue.",
 "Perfect continuous forms look back at the duration of an activity leading up to a reference point. Use had been/have been/will have been + -ing. The activity may still be happening or may have just stopped."
 ];
 const cues=[
 ["Yesterday, as an event viewed as a whole.","Every day, as a habit.","Tomorrow, as a plan or prediction."],
 ["At 5 pm yesterday, in the middle of the activity.","Right now, in the middle of the activity.","At 5 pm tomorrow, in the middle of the activity."],
 ["By 5 pm yesterday, the activity had already happened.","As of now, the activity has already happened.","By 5 pm tomorrow, the activity will already have happened."],
 ["By 5 pm yesterday, the activity had been going on for a while.","Up to now, the activity has been going on for a while.","By 5 pm tomorrow, the activity will have been going on for a while."]
 ];
 function form(k,t,a){const v=verbs[k];if(!v||!times[t]||!aspects[a])throw Error("Unknown form");const [base,past,part,ing]=v;return [[past,base,"will "+base],["was "+ing,"am "+ing,"will be "+ing],["had "+part,"have "+part,"will have "+part],["had been "+ing,"have been "+ing,"will have been "+ing]][a][t]}
 const context=(k,t,a)=>k==="read"&&a===0?(t===0?" yesterday":t===1?" every day":" tomorrow"):"";
 const sentence=(k,t,a)=>"I "+form(k,t,a)+verbs[k][4]+context(k,t,a)+".";
 const norm=s=>String(s||"").toLowerCase().trim().replace(/[.!?]+$/,"").replace(/\s+/g," ").trim();
 const mark=(s,q)=>[q.answer,...(q.accept||[])].some(x=>norm(s)===norm(x));
 const rotate=(r,n)=>r.slice(n%r.length).concat(r.slice(0,n%r.length));
 function questions(s,mode="practice",day=0,k="play"){
  if(!verbs[k])k="play";
  const r=[],review=mode==="review",add=(id,prompt,answer,options,extra={})=>r.push({id:"tense-"+s+"-"+id+(review?"-day"+day:""),prompt,answer,options,...extra});
  if(s===0){
   add("birth",review?"Where does yesterday belong?":"Where does my birth belong?","Past",times,{hint:"Has it already happened?"});
   add("now","Where does the current moment belong?","Present",times,{hint:"Which time contains now?"});
   add("future",review?"Where does tomorrow belong?":"Where does my next birthday belong?","Future",times,{hint:"Has it happened yet?"});
   add("born","Which sentence tells someone about your birth?","I was born.",["I am born.","I was born.","I will be born."],{hint:"Your birth has already happened.",reason:"Was born is a simple past passive form; was alone does not mean continuous."});
   add("transfer","Where does a school trip that has not happened yet belong?","Future",times,{hint:"Look after today.",transfer:!review});
  }else if(s===5){
   for(let i=0;i<12;i++){const a=Math.floor(i/3),t=i%3,key=i<9?k:"draw",answer=times[t]+" "+aspects[a].toLowerCase(),opts=aspects.map(x=>times[t]+" "+x.toLowerCase()).concat(times.filter(x=>x!==times[t]).map(x=>x+" "+aspects[a].toLowerCase()));add("match-"+i,"Name the form: “"+sentence(key,t,a)+"”",answer,rotate(opts,i+day+1),{key,t,a,hint:"Identify the time, then look for have, been or -ing.",transfer:i>=9&&!review&&key!==k})}
  }else{
   const a=s-1,novel=["paint","cook","clean","climb"][a],build=(id,key,t,transfer=false)=>add(id,cues[a][t]+" Use "+verbs[key][0]+": I ___"+verbs[key][4]+".",form(key,t,a),null,{key,t,a,accept:[sentence(key,t,a)],hint:"Start with "+form(key,t,a).split(" ")[0]+".",reason:explanations[a],transfer});
   for(let t of review?rotate([0,1,2],days.indexOf(day)+1):[0,1,2])add("choose-"+t,cues[a][t]+" Which sentence fits?",sentence(k,t,a),rotate(times.map((_,j)=>sentence(k,j,a)),t+day+1),{key:k,t,a,hint:"Look for "+times[t].toLowerCase()+" time and the "+aspects[a].toLowerCase()+" pattern.",reason:explanations[a]});
   for(let t of review?[days.indexOf(day)]:[1,0])build("build-"+t,k,t);
   if(!review&&s===2)add("state","Which is past continuous?","I was playing the piano.",["I was in Year 4.","I was playing the piano.","I played the piano."],{hint:"Look for was + -ing.",reason:"I was in Year 4 is simple past. I was playing the piano uses was + playing."});
   if(!review)build("transfer",novel,2,novel!==k);
  }
  return r;
 }
 function reviews(completed,rows,now=Date.now()){return Object.entries(completed).filter(([s,v])=>lessons[+s]&&Number.isFinite(v.at)).flatMap(([s,v])=>days.map(day=>({stage:+s,day,due:v.at+day*DAY,done:rows.some(r=>r.stage===+s&&r.mode==="review"&&r.day===day&&r.complete)}))).sort((a,b)=>a.due-b.due).map(r=>({...r,ready:!r.done&&now>=r.due}))}
 function stats(rows){const pct=(r,fn)=>r.length?Math.round(100*r.filter(fn).length/r.length):null,ind=r=>r.correct&&!r.hints;return [pct(rows,r=>r.correct),pct(rows,ind),pct(rows.filter(r=>r.mode==="review"),ind),pct(rows.filter(r=>r.transfer),ind)]}
 return {verbs,times,aspects,lessons,days,explanations,cues,form,context,sentence,mark,questions,reviews,stats};
})();
export default model;
