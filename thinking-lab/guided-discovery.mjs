// Maths Thinking Lab Guided Discovery — original, learner-controlled visual storyboards.
// Pure storyboard data and renderers are separated from DOM controls for testing.
const safe=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const rect=(x,y,w,h,fill='#187b74',stroke='#c2e3de',extra='')=>'<rect x="'+x+'" y="'+y+'" width="'+Math.max(0,w)+'" height="'+Math.max(0,h)+'" rx="3" fill="'+fill+'" stroke="'+stroke+'" stroke-width="1.4" '+extra+'/>';
const line=(x,y,xx,yy,color='#b8dcd6',width=2,dash='')=>'<line x1="'+x+'" y1="'+y+'" x2="'+xx+'" y2="'+yy+'" stroke="'+color+'" stroke-width="'+width+'" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
const txt=(x,y,value,size=17,color='#ecf8f5',anchor='middle')=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" fill="'+color+'" font-size="'+size+'" font-family="system-ui,Arial,sans-serif">'+safe(value)+'</text>';
const brace=(x1,x2,y,label,down=false)=>line(x1,y,x2,y,'#f3bf78',2)+line(x1,y-(down?0:7),x1,y+(down?7:0),'#f3bf78')+line(x2,y-(down?0:7),x2,y+(down?7:0),'#f3bf78')+txt((x1+x2)/2,y+(down?24:-11),label,14,'#f3bf78');
const arrow=(x1,y1,x2,y2,label='')=>'<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="#f3bf78" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M'+(x2-9)+' '+(y2-5)+' L'+x2+' '+y2+' L'+(x2-9)+' '+(y2+5)+'" fill="none" stroke="#f3bf78" stroke-width="3"/>'+(label?txt((x1+x2)/2,(y1+y2)/2-9,label,13,'#f3bf78'):'');
const svg=(body,caption)=>'<svg role="img" aria-label="'+safe(caption)+'" viewBox="0 0 680 282" xmlns="http://www.w3.org/2000/svg"><rect width="680" height="282" rx="12" fill="#132c32"/>'+body+'</svg>';
const step=(pause,reveal)=>({pause,reveal});
const highlight=(text,condition)=>condition?text:'';
const PAIR=(p)=>String(p[0])+' and '+String(p[1]);

export const GUIDED_IDS=['balance-add','balance-sub','double-half','near-square','fraction-equivalence','perimeter-invariant','area-scale','angle-straight','word-ratio','rounding-midpoint'];

function modelBalance(q,index,view){
 const [[a,b],[c,d]]=q.diagram.pairs,k=c-a,total=a+b;
 let out='';
 if(view===0){
  out+=txt(42,59,'Before',15,'#a2cfc9','start')+txt(42,173,'After',15,'#a2cfc9','start');
  for(const [i,p] of [[0,[a,b]],[1,[c,d]]]){
   const x=126,y=i?152:43,w=490,f=w*p[0]/total;
   out+=rect(x,y,f,66,'#218b83')+rect(x+f,y,w-f,66,'#b98b55');
   out+=txt(x+f/2,y+39,p[0])+txt(x+f+(w-f)/2,y+39,p[1]);
   if(index>=1)out+=line(x+f,y-5,x+f,y+74,'#fff',2,'6,4');
   if(index>=3)out+=brace(x,x+w,y-10,'same total',false);
  }
  if(index>=2)out+=arrow(126+490*a/total,120,126+490*c/total,120,'move '+k);
 }else{
  out+=txt(105,56,'Part A',16)+txt(335,56,'Part B',16)+txt(548,56,'Whole',16);
  out+=rect(40,74,132,65,'#218b83')+rect(270,74,132,65,'#b98b55');
  out+=txt(106,112,a)+txt(336,112,b);
  if(index>=1){out+=arrow(106,154,106,209,'+'+k)+arrow(336,154,336,209,'-'+k);}
  if(index>=2){out+=rect(40,219,132,40,'#218b83')+rect(270,219,132,40,'#b98b55');out+=txt(106,246,c,16)+txt(336,246,d,16);}
  if(index>=3){out+=txt(549,119,total,21,'#f3bf78')+txt(549,243,total,21,'#f3bf78');}
 }
 return svg(out,'Two part-whole models showing a transfer of '+k+' and an unchanged total');
}
function modelSubtraction(q,index,view){
 const [[b,a],[d,c]]=q.diagram.pairs,move=d-b,span=a-b;
 let out='',min=b-3,max=c+3;const X=v=>48+565*(v-min)/(max-min);
 if(view===0){
  for(const [i,p] of [[0,[b,a]],[1,[d,c]]]){
    const y=i?207:102;
    out+=line(48,y,620,y,'#b0d5d1',3);
    out+=line(X(p[0]),y,X(p[1]),y,'#238f82',12);
    out+=txt(X(p[0]),y-20,p[0])+txt(X(p[1]),y-20,p[1]);
    if(index>=1){out+=line(X(p[0]),y-10,X(p[0]),y+19,'#f3bf78',2)+line(X(p[1]),y-10,X(p[1]),y+19,'#f3bf78',2);}
    if(index>=2)out+=brace(X(p[0]),X(p[1]),y+29,'distance'+(index>=4?' '+span:''),true);
  }
  if(index>=3)out+=arrow(X(b),147,X(d),147,'shift both by '+move);
 }else{
  out+=txt(140,46,'Start',17)+txt(455,46,'End',17);
  for(const [i,p] of [[0,[b,a]],[1,[d,c]]]){
   const y=i?174:69;out+=rect(94,y,480*span/(max-min),65,i?'#2e9c90':'#236e71')+
     txt(94, y+90,p[0],15,'#ecf8f5','start')+txt(94+480*span/(max-min),y+90,p[1],15);
   if(index>=2)out+=brace(94,94+480*span/(max-min),y-8,'same gap');
  }
  if(index>=3)out+=txt(516,143,'+'+move+' at both ends',17,'#f3bf78');
 }
 return svg(out,'Two subtractions represented as identical distances shifted on a number line');
}
function blocks(x,y,w,h,columns,rows,stage,label){
 let out=rect(x,y,w,h,'#23847b');
 const cellX=w/columns,cellY=h/rows;
 if(stage>=1){
  if(columns<=28)for(let j=1;j<columns;j++)out+=line(x+j*cellX,y,x+j*cellX,y+h,'#a0d2c7',1);
  if(rows<=28)for(let j=1;j<rows;j++)out+=line(x,y+j*cellY,x+w,y+j*cellY,'#a0d2c7',1);
 }
 out+=txt(x+w/2,y+h+26,label,17);
 return out;
}
function modelDoubleHalf(q,index,view){
 const [[a,b],[c,d]]=q.diagram.pairs;let out='';
 if(view===0){
  const side=Math.min(18,235/Math.max(a,b,c,d)),scale=Math.min(1.0,Math.min(245/(b*side),125/(a*side)));
  const cell=side*scale,w1=b*cell,h1=a*cell,w2=d*cell,h2=c*cell;
  out+=blocks(62,48,w1,h1,b,a,index,a+' rows x '+b+' each');
  if(index>=1)out+=arrow(318,107,380,107,'rearrange');
  if(index>=2)out+=blocks(403,48,w2,h2,d,c,index,c+' rows x '+d+' each');
  if(index>=3)out+=txt(340,252,'The SAME counters can be rearranged.',16,'#f3bf78');
 }else{
  out+=txt(340,51,'Groups rather than individual squares',18);
  const w=345/a;for(let j=0;j<a;j++)out+=rect(90+j*w,78,w-3,45,'#2e8c85');
  out+=txt(340,151,a+' groups of '+b,18);
  if(index>=2){const cw=345/c;for(let j=0;j<c;j++)out+=rect(90+j*cw,177,cw-3,45,'#b58a57');out+=txt(340,250,c+' groups of '+d,18);}
  if(index>=3)out+=txt(567,134,'halves',14,'#f3bf78');
 }
 return svg(out,'An equal area array rearranged from '+a+' by '+b+' to '+c+' by '+d);
}
function modelNearSquare(q,index,view){
 const [[a,b],[n]]=q.diagram.pairs,k=n-a,side=184,cell=side/n;
 let out='';
 if(view===0){
  const x=250,y=49,cut=a*cell,margin=k*cell;
  out+=txt(340,34,'A square of '+n+' by '+n,17);
  out+=rect(x,y,side,side,'#2a8278');
  if(index>=1){
    out+=line(x+cut,y,x+cut,y+side,'#d4e9e4',2,'5,3');
    out+=line(x+cut,y+cut,x+side,y+cut,'#d4e9e4',2,'5,3');
    out+=txt(x+cut/2,y+side+25,(n-k)+' units',13);
  }
  if(index>=2){
    out+=rect(x+cut,y+cut,margin,margin,'#f3bf78','#f3bf78');
    out+=txt(x+cut+margin/2,y+cut+margin/2+5,'?',17,'#162d33');
  }
  if(index>=3){
    out+=arrow(x+side+8,y+cut+margin/2,x+side+67,y+cut+margin/2,'missing');
    out+=txt(340,267,'Missing corner is '+k+' by '+k,16,'#f3bf78');
  }
 }else{
  const unit=Math.min(173/n,172/(n+k)),sx=92,sy=59,sideN=n*unit,wide=a*unit,margin=k*unit,rx=390;
  out+=txt(195,40,n+' by '+n+' square',16);
  out+=rect(sx,sy,wide,sideN,'#2a8278');
  out+=rect(sx+wide,sy,margin,wide,'#5ca99d');
  if(index>=2)out+=rect(sx+wide,sy+wide,margin,margin,'#f3bf78','#f3bf78');
  out+=txt(488,40,(n-k)+' by '+(n+k)+' rectangle',16);
  if(index>=1){
    out+=rect(rx,sy,wide,sideN,'#2a8278');
    if(index>=2)out+=rect(rx,sy+sideN,wide,margin,'#5ca99d');
  }
  if(index>=3){
    out+=brace(rx,rx+wide,sy-9,(n-k)+' units');
    out+=txt(rx+wide+18,sy+(sideN+margin)/2,(n+k)+' units',12,'#f3bf78','start');
  }
  if(index>=4)out+=txt(340,267,'The square has '+k*k+' more unit squares.',17,'#f3bf78');
 }
 return svg(out,'The square is partitioned into pieces that form the near-square rectangle plus a '+k+' by '+k+' leftover corner');
}
function modelFractions(q,index,view){
 const [[a,b],[c,d]]=q.diagram.pairs,k=d/b;
 let out='';
 if(view===0){
  const bars=index>=2?[[a,b],[c,d]]:[[a,b]];
  for(const [i,[numer,denom]] of bars.entries()){
   const y=i?167:47,x=65,w=540,one=w/denom;
   for(let j=0;j<denom;j++)out+=rect(x+j*one,y,one,53,j<numer?'#2f9789':'#2b5159');
   if(index>=1)out+=txt(340,y+78,(i?'New cuts':'Original cuts')+' - '+(index>=3?numer+'/'+denom:'?'),15);
  }
  if(index>=2)out+=arrow(340,133,340,157,'split into '+k);
 }else{
  const x=65,w=540,y=125;
  out+=line(x,y,x+w,y,'#b8dcd6',4);
  for(let j=0;j<=b;j++)out+=line(x+j*w/b,y-13,x+j*w/b,y+14,'#a3cac4',2);
  out+=rect(x,y-34,a*w/b,26,'#368f84')+txt(x,y+46,'0')+txt(x+w,y+46,'1');
  if(index>=1)out+=brace(x,x+a*w/b,y-45,'same location');
  if(index>=2){
   for(let j=1;j<d;j++)out+=line(x+j*w/d,y-17,x+j*w/d,y+17,'#f3bf78',1);
   out+=txt(340,225,'More divisions, same distance',17,'#f3bf78');
  }
  if(index>=3)out+=txt(340,252,a+'/'+b+' = '+c+'/'+d,18);
 }
 return svg(out,'Equivalent fractions showing the same shaded proportion of a single whole');
}
function modelPerimeter(q,index,view){
 const [[w,h],[ww,hh]]=q.diagram.pairs;let out='';
 if(view===0){
  for(const [i,[a,b]] of [[0,[w,h]],[1,[ww,hh]]]){
   const scale=Math.min(17,190/Math.max(w,h,ww,hh)),x=i?410:126,y=65;
   const rw=a*scale,rh=b*scale;
   out+=rect(x,y,rw,rh,i?'#a78253':'#2a827a');
   if(index>=1){
     out+=brace(x,x+rw,y-13,a+' units');
     out+=txt(x+rw+18,y+rh/2,b,15,'#f3bf78');
   }
   out+=txt(x+rw/2,252,i?'After':'Before',16);
  }
  if(index>=2)out+=arrow(324,147,384,147,'+1 / -1');
  if(index>=3)out+=txt(340,273,'Each perimeter counts two widths and two heights.',13,'#f3bf78');
 }else{
  out+=txt(340,42,'A boundary is made of four sides',18);
  let widths=[[w,h,w,h],[ww,hh,ww,hh]];
  widths.forEach((parts,i)=>{const y=i?171:81,total=parts.reduce((u,v)=>u+v,0);let x=64;
    for(let j=0;j<4;j++){const ww=552*parts[j]/total;out+=rect(x,y,ww,51,j%2?'#b48d57':'#2b857d');
      if(index>=1)out+=txt(x+ww/2,y+29,parts[j],14);x+=ww;}
    if(index>=2)out+=brace(64,616,y-9,'same boundary length');
  });
 }
 return svg(out,'Two rectangles with equal perimeter and generally different area');
}
function modelArea(q,index,view){
 const [[w,h],[ww,hh]]=q.diagram.pairs;let out='';
 if(view===0){
  const scale=Math.min(18,220/ww,130/hh),x=60,y=72;
  out+=blocks(x,y,w*scale,h*scale,w,h,index,w+' by '+h);
  if(index>=1)out+=arrow(270,116,360,116,'add a copy');
  if(index>=2){out+=blocks(392,y,ww*scale,hh*scale,ww,hh,index,ww+' by '+hh);}
  if(index>=3)out+=txt(342,257,'Twice the width with the same height gives twice the area',14,'#f3bf78');
 }else{
  out+=txt(340,44,'Two equal copies',19);
  out+=rect(95,78,245,111,'#2b857d')+txt(220,138,'Area A',21);
  if(index>=2){out+=rect(341,78,245,111,'#b28b54')+txt(464,138,'Area A',21);}
  if(index>=3)out+=brace(95,586,202,'2 x A',true);
 }
 return svg(out,'A rectangle doubled in one dimension and represented as two equal copies');
}
function modelAngle(q,index,view){
 const a=q.diagram.value,b=180-a,cx=340,cy=175,r=117,rad=-Math.PI*a/180;
 let out='';
 if(view===0){
  out+=line(115,cy,565,cy,'#b8dcd6',4)+line(cx,cy,cx+r*Math.cos(rad),cy+r*Math.sin(rad),'#f3bf78',5);
  out+=txt(cx+54*Math.cos(rad/2),cy+54*Math.sin(rad/2)-8,a+'°',19);
  if(index>=1)out+=txt(cx-75,cy-24,'?°',18,'#f3bf78');
  if(index>=2)out+=brace(169,510,210,'straight angle = 180°',true);
  if(index>=3)out+=txt(340,267,a+'° + '+b+'° = 180°',17,'#f3bf78');
 }else{
  out+=txt(340,52,'A straight angle is two right angles',18);
  out+=rect(157,82,150,124,'#245b61')+rect(307,82,150,124,'#3e827a');
  if(index>=1){out+=txt(231,148,'90°',23)+txt(382,148,'90°',23);}
  if(index>=2)out+=brace(157,457,225,'90° + 90°',true);
  if(index>=3)out+=txt(340,266,'The two adjacent angles must complete 180°.',15);
 }
 return svg(out,'An angle on a straight line completing 180 degrees');
}
function modelRatio(q,index,view){
 const parts=q.diagram.parts,k=parts[0],sum=parts.reduce((a,b)=>a+b,0),total=Number(q.prompt.match(/Together they have (\d+)/)?.[1])||sum;
 const unit=480/sum;let out='';
 if(view===0){
  let x=153;
  out+=txt(70,91,'Asha',17);out+=txt(70,193,'Ben',17);
  for(let j=0;j<k;j++){out+=rect(x+j*unit,54,unit,56,'#258b81');if(index>=1)out+=txt(x+(j+.5)*unit,87,'1 part',12);}
  out+=rect(x,157,unit,56,'#b48c58');
  if(index>=1)out+=txt(x+unit/2,190,'1 part',12);
  if(index>=2)out+=brace(x,x+unit*k,44,k+' equal parts');
  if(index>=3)out+=txt(340,252,'Together: '+k+' + 1 = '+sum+' equal parts',17,'#f3bf78');
 }else{
  out+=txt(340,48,'One whole split into equal units',18);
  const x=69,unit=540/sum;
  for(let j=0;j<sum;j++){out+=rect(x+j*unit,100,unit,67,j<k?'#248d80':'#b48c58');
    if(index>=1)out+=txt(x+(j+.5)*unit,137,j<k?'A':'B',15);
  }
  if(index>=2)out+=brace(x,x+540,89,total+' stickers in total');
  if(index>=3)out+=txt(340,216,sum+' equal units; each = '+(total/sum),18,'#f3bf78');
 }
 return svg(out,'Multiplicative comparison using '+sum+' equal units and a total of '+total);
}
function modelRounding(q,index,view){
 const {lo,hi,at}=q.diagram,mid=(lo+hi)/2;let out='',scale=x=>55+570*(x-lo)/(hi-lo);
 if(view===0){
  out+=line(55,145,625,145,'#b8dcd6',4);
  for(const [x,label] of [[lo,lo],[mid,'halfway'],[hi,hi]]){
   out+=line(scale(x),128,scale(x),162,'#f3bf78',x===mid?3:2);
   if(index>=1)out+=txt(scale(x),194,label,15);
  }
  out+='<circle cx="'+scale(at)+'" cy="145" r="9" fill="#53c1af"/>';
  out+=txt(scale(at),111,at,19);
  if(index>=2)out+=arrow(scale(at),235,scale(at<mid?lo:hi),235,'nearest');
 }else{
  const left=at-lo,right=hi-at;
  out+=txt(340,54,'Compare the distances, not the final digits',17);
  out+=rect(100,99,470*left/(hi-lo),71,'#258b81')+rect(100+470*left/(hi-lo),99,470*right/(hi-lo),71,'#b28a57');
  if(index>=1)out+=txt(100+470*left/(hi-lo)/2,137,'left gap',16);
  if(index>=2)out+=txt(100+470*left/(hi-lo)+470*right/(hi-lo)/2,137,'right gap',16);
  if(index>=3)out+=txt(340,230,left+' vs '+right+' units',18,'#f3bf78');
 }
 return svg(out,'Rounding a value on a number line with a midpoint and distances');
}
const SCRIPT={
 'balance-add':{
  title:'Keep the total unchanged',views:['Part-whole bars','Number bonds'],render:modelBalance,
  steps:[
   step('Look at the two additions. Predict: same, greater or smaller?','Start with the quantity as two parts; do not calculate either sum.'),
   step('Which part gained something? Which part lost something?','Align the boundaries of the two parts.'),
   step('What has moved between the parts?','Reveal the transfer arrow: an equal amount moves from one part to another.'),
   step('If nothing is added to the WHOLE, what happens to the total?','The whole-length brackets match. The total is unchanged.'),
   step('How would you prove that for any two numbers?','Write (a + k) + (b - k) = a + b. The +k and -k cancel.')
  ]},
 'balance-sub':{
  title:'Keep the difference unchanged',views:['Number-line gaps','Distance bars'],render:modelSubtraction,
  steps:[
   step('Compare the two subtraction expressions without subtracting.','The difference is the distance between two points.'),
   step('Mark the start and end of each subtraction.','The endpoints are both shifted by the same amount.'),
   step('Are the two gaps identical or different?','Brackets show the same distance between the endpoints.'),
   step('Why can the gaps remain unchanged when numbers get bigger?','Moving both endpoints together preserves the gap.'),
   step('Can you state a rule that always works?','(a + k) - (b + k) = a - b.')
  ]},
 'double-half':{
  title:'Halve one factor, double the other',views:['Rearrange arrays','Equal groups'],render:modelDoubleHalf,
  steps:[
   step('Predict whether these products are equal, without multiplying.','Picture the first product as a rectangle of counters.'),
   step('What could you change about its rows and columns?','Count equal-sized units in an array, or consider groups.'),
   step('Can the same counters fit into a differently shaped rectangle?','Halve one dimension, then double the other.'),
   step('Did we gain or lose a single counter?','The area and total number of counters are preserved.'),
   step('When does this transformation work neatly?','a × b = (a ÷ 2) × (2b). For whole-number arrays, a must be even.')
  ]},
 'near-square':{
  title:'Compare near a perfect square',views:['Square model','Balanced factors'],render:modelNearSquare,
  steps:[
   step('Which product is larger: two nearby factors or the square?','Identify the number halfway between the factors.'),
   step('What would a square of that midpoint look like?','Draw the square and consider how the other rectangle changes its shape.'),
   step('Is the rectangle missing a small corner?','The missing region has area equal to the square of the difference.'),
   step('What determines the difference between products?','It is the square of the distance from each factor to the midpoint.'),
   step('State the general relationship.','(n - k)(n + k) = n² - k².')
  ]},
 'fraction-equivalence':{
  title:'Split pieces without changing the amount',views:['Fraction strips','Number line'],render:modelFractions,
  steps:[
   step('Which fraction seems bigger? Predict before using a rule.','Both fraction bars refer to the same whole.'),
   step('What would happen if every part were cut into smaller pieces?','The number of equal subdivisions changes.'),
   step('Has the shaded area grown?','Reveal the new partitions: the shaded region has not moved.'),
   step('How would we show this on a number line?','The marked fraction stays at exactly the same position.'),
   step('What general numerical rule expresses this?','Multiply numerator and denominator by the same nonzero number to keep the fraction equal.')
  ]},
 'perimeter-invariant':{
  title:'Change area while preserving perimeter',views:['Two rectangles','Boundary strips'],render:modelPerimeter,
  steps:[
   step('Predict which stays the same: area, perimeter, both, neither?','See the two shapes before using a formula.'),
   step('Which side becomes longer, and which shorter?','Add labelled side lengths to each shape.'),
   step('What happens when you walk around the entire boundary?','One dimension gains one; the other loses one.'),
   step('Will the number of squares inside also stay the same?','The boundary sums match, but the products differ.'),
   step('Explain the distinction in one sentence.','Perimeter depends on 2(w + h). Area depends on w × h. These are different relationships.')
  ]},
 'area-scale':{
  title:'Stretch one side to double an area',views:['Area grid','Equal copies'],render:modelArea,
  steps:[
   step('Predict how area changes if only the width doubles.','Look at the original rectangle.'),
   step('Can you see an identical second rectangle fitting beside it?','Keep height constant; prepare another equal copy.'),
   step('How many complete copies does the new shape contain?','Reveal the whole doubled rectangle.'),
   step('What happens to the unit squares?','There are two copies, so the area doubles.'),
   step('Express the relationship without calculating the area.','(2w) × h = 2 × (w × h).')
  ]},
 'angle-straight':{
  title:'Reason about a straight angle',views:['Ray and straight line','Two right angles'],render:modelAngle,
  steps:[
   step('Without subtracting, is the missing angle acute or obtuse?','Picture the given angle sharing one straight line with another.'),
   step('How is the missing angle related to a right angle?','Mark the two adjacent regions.'),
   step('How much must both angles total?','A straight angle always measures 180°.'),
   step('What calculation would now find the missing angle?','Subtract the given angle from 180°.'),
   step('How can you check your answer?','The two angles must sum to 180°; compare with two right angles.')
  ]},
 'word-ratio':{
  title:'Show a comparison using equal parts',views:['Comparison bars','One whole split'],render:modelRatio,
  steps:[
   step('How would you draw three-times-as-many without using addition?','Represent each equal share as a box.'),
   step('How many boxes represent each person?','One person has multiple equal bars; the other has one.'),
   step('How many equal parts are in the whole?','Count all the identical units, not the number of people.'),
   step('Use the total to work out one part.','Divide the total by the number of equal units.'),
   step('Why is this different from “three more”?','“Three times” describes multiplicative scaling; “three more” describes an additive difference.')
  ]},
 'rounding-midpoint':{
  title:'Locate halfway before rounding',views:['Number line','Distance bars'],render:modelRounding,
  steps:[
   step('Which two multiples surround the value?','Mark the lower and upper multiples on a line.'),
   step('Where is exactly halfway between them?','Reveal the midpoint.'),
   step('Which multiple is closer?','Look at the two distances from the given value.'),
   step('Can you choose the nearest multiple without doing full subtraction?','Compare the position with the midpoint.'),
   step('What happens at an exact halfway point?','For standard school rounding of positive numbers, halfway rounds up to the higher multiple.')
  ]}
};

export function buildStoryboard(question){
 const source=SCRIPT[question?.id];
 if(!source)return null;
 return {
  id:question.id,title:source.title,views:source.views,
  steps:source.steps,
  image:(stage,view=0)=>source.render(question,Math.max(0,Math.min(4,stage)),view),
  skill:question.skill
 };
}
export function listStoryboards(){return Object.keys(SCRIPT)}

export function createGuidedDiscovery({onReveal=()=>{}}={}){
 const content=document.querySelector('#thinkingLabRoot .tl-content');
 const anchor=document.querySelector('#tlStrategies');
 if(!content||!anchor)throw Error('Guided lesson requires the Thinking Lab content panel');
 const section=document.createElement('section');
 section.id='tlGuided';section.className='tl-guided';
 section.innerHTML='<div class="tl-guide-top"><div><span class="tl-guide-kicker">GUIDED DISCOVERY</span><h3>Pause. Predict. Reveal.</h3><p id="tlGuideIntroduction"></p></div><button id="tlGuideOpen" type="button" aria-expanded="false" aria-controls="tlGuideBody" class="tl-btn">Start guided explanation</button></div>'+
 '<div id="tlGuideBody" hidden><div class="tl-guide-status"><span id="tlGuideCounter">Pause 1 of 5</span><span id="tlGuideStageLabel">Observe</span></div>'+
 '<div id="tlGuideQuestion" class="tl-guide-question" aria-live="polite"></div>'+
 '<div id="tlGuideVisual" class="tl-guide-graphic"></div>'+
 '<div class="tl-guide-views" role="group" aria-label="Choose a visual explanation"><button type="button" id="tlGuideViewA" aria-pressed="true"></button><button type="button" id="tlGuideViewB" aria-pressed="false"></button></div>'+
 '<div id="tlGuideReveal" class="tl-guide-reveal" aria-live="polite" hidden></div>'+
 '<div class="tl-guide-actions"><button type="button" id="tlGuidePrev" class="tl-btn">Previous pause</button><button type="button" id="tlGuideRevealPart" class="tl-btn primary">Reveal this layer</button><button type="button" id="tlGuideNext" class="tl-btn">Next pause</button><button type="button" id="tlGuideRestart" class="tl-btn">Restart</button></div>'+
 '<p class="tl-caption">Nothing advances automatically. Discuss each prediction before revealing the next relationship. A reveal counts as guided help, not independent success.</p></div>';
 const subhead=anchor.previousElementSibling;
 if(subhead&&subhead.classList.contains('tl-subhead'))subhead.before(section);
 else anchor.before(section);
 const $=id=>section.querySelector('#'+id);
 const body=$('tlGuideBody'),openButton=$('tlGuideOpen');
 let board=null,stage=0,view=0,opened=false,used=false,revealed=false;
 const draw=()=>{
  if(!board)return;
  $('tlGuideCounter').textContent=(revealed?'Reveal ':'Pause ')+(stage+1)+' of '+board.steps.length;
  $('tlGuideStageLabel').textContent=stage===0?'Observe and predict':stage===4?'Generalise':'Reason again';
  $('tlGuideQuestion').textContent=board.steps[stage].pause;
  const visibleStage=revealed?stage:Math.max(0,stage-1);
  $('tlGuideVisual').innerHTML=board.image(visibleStage,view);
  $('tlGuideReveal').hidden=!revealed;
  $('tlGuideReveal').textContent=revealed?board.steps[stage].reveal:'';
  $('tlGuideViewA').textContent=board.views[0];
  $('tlGuideViewB').textContent=board.views[1];
  $('tlGuideViewA').setAttribute('aria-pressed',String(view===0));
  $('tlGuideViewB').setAttribute('aria-pressed',String(view===1));
  $('tlGuidePrev').disabled=stage===0;
  $('tlGuideNext').disabled=!revealed||stage===board.steps.length-1;
  $('tlGuideRevealPart').disabled=revealed;
  $('tlGuideRevealPart').textContent=revealed?'Layer revealed':'Reveal this layer';
 };
 const load=question=>{
  board=buildStoryboard(question);stage=0;view=0;opened=false;used=false;revealed=false;
  openButton.textContent=board?'Start guided explanation':'Storyboard coming soon';
  openButton.disabled=!board;openButton.setAttribute('aria-expanded','false');
  body.hidden=true;
  $('tlGuideIntroduction').textContent=board?
   'Two labelled models for '+board.title.toLowerCase()+'. Five prediction pauses, each followed by a learner-controlled reveal.':
   'The basic diagrams and hints remain available. Richer guided lessons are being added for this technique.';
  if(board)draw();
 };
 openButton.addEventListener('click',()=>{
  if(!board)return;
  opened=!opened;body.hidden=!opened;openButton.setAttribute('aria-expanded',String(opened));
  openButton.textContent=opened?'Close guided explanation':'Start guided explanation';
  if(opened)draw();
 });
 $('tlGuideRevealPart').addEventListener('click',()=>{
  if(!board||revealed)return;
  revealed=true;used=true;onReveal({id:board.id,stage:stage+1,view});
  draw();
 });
 $('tlGuideNext').addEventListener('click',()=>{
  if(!board||!revealed||stage>=board.steps.length-1)return;
  stage++;revealed=false;draw();
 });
 $('tlGuidePrev').addEventListener('click',()=>{
  if(stage===0)return;
  stage--;revealed=false;draw();
 });
 $('tlGuideRestart').addEventListener('click',()=>{stage=0;view=0;revealed=false;draw()});
 for(const [id,v] of [['tlGuideViewA',0],['tlGuideViewB',1]])$(id).addEventListener('click',()=>{
  if(!board)return;
  view=v;draw();
 });
 return {load,used:()=>used,stage:()=>stage,available:()=>!!board};
}
