// Visual model for keeping a sum unchanged while moving units between its parts.
// Draw proportional bars only when a unit is legible; larger examples use cards clearly marked not to scale.
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=(x,y,value,size=16,fill='#ecf7f5',anchor='middle')=>'<text x="'+x+'" y="'+y+'" fill="'+fill+'" font-size="'+size+'" text-anchor="'+anchor+'" font-family="system-ui,Arial,sans-serif">'+esc(value)+'</text>';
const rect=(x,y,w,h,fill,stroke='#b9d9d4',other='')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="4" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.3" '+other+'/>';
const line=(x1,y1,x2,y2,stroke='#c9e3dc',width=2,other='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+stroke+'" stroke-width="'+width+'" '+other+'/>';
const TEAL='#20887e',SAND='#b2834e',PURPLE='#9b8afb',LIGHT='#dbe5ef';
function bracket(x1,x2,y,top,caption){
 // IMPORTANT: upper bracket points DOWN at its bar; lower bracket points UP.
 const tip=top?10:-10;
 return line(x1,y,x2,y,'#f7c57b',2)+
        line(x1,y,x1,y+tip,'#f7c57b',2.5)+line(x2,y,x2,y+tip,'#f7c57b',2.5)+
        text((x1+x2)/2,y+(top?-13:26),caption,15,'#f7c57b');
}
function arrow(x1,y1,x2,y2){
 return line(x1,y1,x2,y2,PURPLE,3)+
 '<path d="M'+(x2-7)+' '+(y2-9)+' L'+x2+' '+y2+' L'+(x2+7)+' '+(y2-9)+'" fill="none" stroke="'+PURPLE+'" stroke-width="2.5"/>';
}
function bars(a,b,k,phase){
 const total=a+b,x=112,w=480,y1=99,y2=224,h=55,
       first=w*a/total,after=w*(a+k)/total,piece=w*k/total,
       showHighlight=phase>=1,showMoved=phase>=2,showProof=phase>=3;
 let o=text(25,133,'Before',15,'#c4e5df','start');
 o+=rect(x,y1,first,h,TEAL)+rect(x+first,y1,w-first,h,SAND);
 o+=text(x+first/2,y1+33,a,19)+text(x+first+(w-first)/2,y1+33,b,19);
 if(showHighlight){
   o+='<g class="tl-moving-one" data-drag-compensation="1" tabindex="0" role="button" aria-label="Drag one unit into the other part" style="cursor:grab;touch-action:none">'+
   rect(x+first,y1,Math.max(piece,3),h,PURPLE,'#f0eaff')+
   '<circle cx="'+(x+first+piece/2)+'" cy="'+(y1+h/2)+'" r="21" fill="'+PURPLE+'" fill-opacity=".18" stroke="'+PURPLE+'" stroke-width="2"/>'+
   '</g>';
   o+=line(x+first,y1+60,x+first,y2-5,PURPLE,2,'stroke-dasharray="5 5"');
   o+=text(340,35,'Move the PURPLE '+k+' from brown to green.',16,LIGHT);
 }
 if(showMoved){
   o+=text(25,y2+34,'After',15,'#c4e5df','start');
   o+=rect(x,y2,after,h,TEAL)+rect(x+after,y2,w-after,h,SAND);
   o+=rect(x+first,y2,Math.max(piece,2),h,PURPLE,'#f0eaff');
   o+=text(x+after/2,y2+34,a+k,19)+text(x+after+(w-after)/2,y2+34,b-k,19);
   o+=arrow(x+first+piece/2,y1+h+2,x+first+piece/2,y2-7);
   o+=text(340,202,'Same piece. New place.',15,LIGHT);
 }
 if(showProof){
   o+=bracket(x,x+w,82,true,'Before: '+total+' altogether');
   o+=bracket(x,x+w,292,false,'After: '+total+' altogether');
 }
 if(!showHighlight)o+=text(340,45,'Two parts. One whole.',17,LIGHT);
 return o;
}
function cards(a,b,k,phase){
 const x1=72,x2=373,cardW=236,y1=98,y2=225,h=54;
 const showHighlight=phase>=1,showMoved=phase>=2,showProof=phase>=3;
 let o=text(340,32,'Number cards (box lengths are not to scale)',15,LIGHT);
 o+=text(28,131,'Before',14,LIGHT,'start');
 o+=rect(x1,y1,cardW,h,TEAL)+rect(x2,y1,cardW,h,SAND);
 o+=text(x1+cardW/2,y1+34,a,21)+text(x2+cardW/2,y1+34,b,21);
 if(showHighlight){
   o+='<g class="tl-moving-one" data-drag-compensation="1" tabindex="0" role="button" aria-label="Drag one from the brown part to the green part" style="cursor:grab;touch-action:none">'+
      rect(x2+8,y1+7,40,h-14,PURPLE,'#e8dcff')+
      text(x2+28,y1+34,k,20,'#151d35')+'</g>';
   
   if(!showProof)o+=text(340,78,'This '+k+' comes from the brown part.',15,'#ded4ff');
 }
 if(showMoved){
   o+=text(28,y2+32,'After',14,LIGHT,'start');
   o+=arrow(x2+28,y1+59,x1+cardW/2,y2-10);
   o+=rect(x1,y2,cardW,h,TEAL)+rect(x2,y2,cardW,h,SAND);
   o+=text(x1+cardW/2,y2+33,a+k,21)+text(x2+cardW/2,y2+33,b-k,21);
 }
 if(showProof){
   o+=bracket(x1,x2+cardW,81,true,'Same whole');
   o+=bracket(x1,x2+cardW,294,false,'Still '+(a+b)+' in total');
 }
 return o;
}
export function compensationDiagram({a=25,b=25,k=1,phase=0,view='bars'}={}){
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||!Number.isSafeInteger(k)||a<1||b<=k||k<1)throw Error('Invalid compensation data');
 const isBig=a+b>100;
 const actualView=isBig?'cards':view;
 const body=actualView==='cards'?cards(a,b,k,phase):bars(a,b,k,phase);
 return '<svg role="img" aria-label="'+esc('Move '+k+' from '+b+' to '+a+' without changing the total')+'" viewBox="0 0 680 340" xmlns="http://www.w3.org/2000/svg">'+
 '<rect width="680" height="340" rx="16" fill="#112c33"/>'+body+'</svg>';
}
export const compensationEquals=(a,b,k=1)=>a+b===(a+k)+(b-k);
export function friendlyExample(a=729,b=21){const nextA=a+1,nextB=b-1;return {before:[a,b],after:[nextA,nextB],sum:a+b,isCorrect:compensationEquals(a,b,1)};}
