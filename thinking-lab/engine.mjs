// Maths Thinking Lab — original curriculum-linked structural reasoning exercises.
// Standalone pure engine: no DOM, Firebase, third-party content or paid API.
export const TOPICS=[
 ['all','Mixed practice'],['number','Number sense'],['arithmetic','Arithmetic'],
 ['multiplication','Multiplication & division'],['fractions','Fractions & decimals'],
 ['geometry','Area & perimeter'],['angles','Angles'],['word','Word problems'],
 ['place','Place value & rounding'],['patterns','Patterns & proof'],['measure','Measurement']
];
const M=[
 ['balance-add','number','Keep the total','mental.strategy.compensation','Transfer equal amounts','If you move some from one part into another, does the whole change?','Adding to both numbers changes the total.'],
 ['balance-sub','arithmetic','Keep the difference','operations.add-sub.inverse','Shift both numbers','If both positions move together, what happens to the gap?','Adding the same amount to each number preserves a difference, unlike a sum.'],
 ['friendly-ten','arithmetic','Make a friendly number','mental.strategy.compensation','Regroup to a ten','How much would make the next multiple of ten? Where can it come from?','You must take from one addend exactly what you add to the other.'],
 ['double-half','multiplication','Halve and double','operations.multiply.properties','Rearrange equal groups','Can you reshape this array into half as many rows and twice as many columns?','Halving both factors does not preserve the product.'],
 ['near-square','multiplication','Compare with a square','operations.multiply.properties','Use a missing square','If factors are equally spaced either side of a number, what is missing?','(n-d)(n+d) is smaller than n squared by d squared.'],
 ['equal-groups','multiplication','More groups, fewer each','operations.mult-div.models','Keep the whole','What happens to group size if you split the SAME counters into more groups?','More groups need not mean more counters in all.'],
 ['fraction-equivalence','fractions','Same amount, smaller pieces','fractions.equivalence-simplify','Split the parts','Did we change the shaded amount or only the cuts?','Multiply BOTH numerator and denominator to keep a fraction unchanged.'],
 ['fraction-compare','fractions','Compare fractions visually','fractions.compare-order','Make common parts','How could you make the two sets of pieces the same size?','A greater number of smaller pieces does not imply a greater fraction.'],
 ['perimeter-invariant','geometry','Same perimeter, different area','area-perimeter.independence','Walk the boundary','Which sides grew? Which shrank? What stays the same?','Equal perimeters do not imply equal areas.'],
 ['area-scale','geometry','Stretch an area','area.calculate','Count equal copies','How many copies of the original rectangle fit into the new one?','Doubling only one side doubles area, not quadruples it.'],
 ['angle-straight','angles','Reason with straight angles','angles.core-facts','Use two right angles','If one part of a straight line is bigger than 90 degrees, what about the other?','Angles on a straight line add to 180 degrees.'],
 ['angle-at-point','angles','Angles around a point','angles.core-facts','Make a full turn','Does the size of a complete turn depend on how many rays there are?','The full turn stays at 360 degrees.'],
 ['word-ratio','word','Bar-model comparison','operations.mult-div.models','Draw equal bars','If one person has three times as many, how many bars do they get?','Three times as many is not three more.'],
 ['word-change','word','Find the whole in a story','operations.add-sub.models','Name the parts','What was the whole before something was taken away?','Words like more and left are not reliable shortcuts to an operation.'],
 ['rounding-midpoint','place','Locate the midpoint','rounding.whole-decimal','Mark halfway','Which two benchmark multiples surround the number?','Rounding changes the smaller place-value digits to zero.'],
 ['place-shift','place','Ten times the value','number.place-value.powers10','Track digit values','What is ten times the value of each digit?','Multiplying a decimal by ten does not always mean appending a zero.'],
 ['odd-even','patterns','Prove with pairs','number.counting.skip','Pair the counters','If two odd groups each have one spare, what happens to the two spares?','Odd plus odd is always even.'],
 ['turn-shapes','geometry','Rotate without stretching','transform.translate-reflect-rotate-enlarge','Track what is unchanged','Does turning a piece of card add any area or boundary?','Rotation does not change size, area or perimeter.'],
 ['units','measure','Same length, different units','measurement.metric-convert','Use a unit benchmark','Can two different numbers describe exactly the same length?','One metre is 100 centimetres, not ten.'],
 ['fraction-of-whole','fractions','Part of a whole','fractions.meaning','Count equal parts','How many EQUAL parts make the whole? How many were shaded?','The denominator is the number of equal parts in the whole.']
];
export const TECHNIQUES=M.map(([id,topic,name,skill,strategy,ask,trap])=>({id,topic,name,skill,strategy,ask,trap}));
export const seeded=(seed=1)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const r=(lo,hi,random)=>lo+Math.floor(random()*(hi-lo+1));
const pick=(xs,random)=>xs[r(0,xs.length-1,random)];
const Q=(id,prompt,options,answer,explain,diagram,hints)=>({id,prompt,options,answer,explain,diagram,hints,...TECHNIQUES.find(t=>t.id===id)});
export function makeQuestion({topic='all',technique='all',level=1,rng=Math.random,weak=[]}={}){
 const pool=TECHNIQUES.filter(t=>(topic==='all'||t.topic===topic)&&(technique==='all'||t.id===technique));
 if(!pool.length)throw Error('No matching technique');
 const t=pick(pool.flatMap(x=>weak.includes(x.id)?[x,x,x]:[x]),rng),id=t.id;
 const s=level===1?1:level===2?2:3;
 let a,b,c,k,n,w,h;
 switch(id){
 case 'balance-add':
  a=r(14,35*s,rng);b=r(15,30*s,rng);k=level===1?1:level===2?r(1,3,rng):r(1,Math.min(9,b-2),rng);
  return Q(id,'Without adding, compare '+a+' + '+b+' and '+(a+k)+' + '+(b-k)+'.',['Equal','First larger','Second larger'],'Equal','One part gains '+k+'; the other loses '+k+'. The total is unchanged.',{kind:'balance',pairs:[[a,b],[a+k,b-k]]},['Which part gains and which part loses?','Does the amount gained equal the amount lost?']);
 case 'balance-sub':
  b=r(8,24*s,rng);a=b+r(10,36*s,rng);k=r(2,11,rng);
  return Q(id,'Compare '+a+' - '+b+' and '+(a+k)+' - '+(b+k)+'.',['Equal','First larger','Second larger'],'Equal','Both endpoints move by '+k+'. Their separation is unchanged.',{kind:'difference',pairs:[[b,a],[b+k,a+k]]},['Mark both pairs on a number line.','Compare the distance between each pair.']);
 case 'friendly-ten':
  k=r(2,4,rng);a=10*r(3,6*s,rng)-k;b=r(k+5,25*s,rng);
  return Q(id,'Which rearrangement makes '+a+' + '+b+' easier without changing its value?',[String(a+k)+' + '+(b-k),String(a+k)+' + '+(b+k),String(a-k)+' + '+(b-k)],String(a+k)+' + '+(b-k),'Moving '+k+' from the second addend to the first produces a tidy multiple of ten.',{kind:'balance',pairs:[[a,b],[a+k,b-k]]},['How far from the next ten is '+a+'?','Take precisely that amount from '+b+'.']);
 case 'double-half':
  a=2*r(2,4*s,rng);b=r(3,6*s,rng);
  return Q(id,'Compare '+a+' x '+b+' and '+a/2+' x '+2*b+'.',['Equal','First larger','Second larger'],'Equal','Halving one factor and doubling the other preserves the number of squares.',{kind:'arrays',pairs:[[a,b],[a/2,2*b]]},['Imagine rearranging the same counters.','One dimension halves while the other doubles.']);
 case 'near-square':
  n=r(8,12*s,rng);k=r(1,Math.min(4,n-2),rng);
  return Q(id,'Without multiplying, which is larger: '+(n-k)+' x '+(n+k)+' or '+n+' x '+n+'?',['First','Second','Equal'],'Second','The first product is '+k*k+' smaller: (n-d)(n+d) = n squared - d squared.',{kind:'arrays',pairs:[[n-k,n+k],[n,n]]},['The factors are equally far from '+n+'.','The difference is the square of '+k+'.']);
 case 'equal-groups':
  a=r(2,5,rng);b=2*r(2,5*s,rng);n=a*b;
  return Q(id,n+' counters are split into '+a+' equal groups or '+(2*a)+' equal groups. Which arrangement has more in EACH group?',[a+' groups',(2*a)+' groups','Equal'],a+' groups','The whole is unchanged. With twice as many groups, each group has half as many counters.',{kind:'groups',pairs:[[a,b],[2*a,b/2]]},['The counters do not increase.','More groups mean fewer in each group.']);
 case 'fraction-equivalence':
  b=r(3,8,rng);a=r(1,b-1,rng);k=r(2,3,rng);
  return Q(id,'Compare '+a+'/'+b+' and '+a*k+'/'+b*k+'.',['Equal','First larger','Second larger'],'Equal','Every piece is cut into '+k+' smaller pieces. The total shaded amount is unchanged.',{kind:'fractions',pairs:[[a,b],[a*k,b*k]]},['Picture two same-sized bars.','Only the cuts change, not the shaded region.']);
 case 'fraction-compare':
  b=r(4,9,rng);a=r(1,b-2,rng);c=r(a+1,b-1,rng);k=r(2,3,rng);if(rng()<.5)[a,c]=[c,a];
  return Q(id,'Which fraction is larger: '+a+'/'+b+' or '+c*k+'/'+b*k+'?',['First','Second','Equal'],a>c?'First':'Second','Both fractions can be expressed in '+b+'ths. Compare '+a+' and '+c+'.',{kind:'fractions',pairs:[[a,b],[c*k,b*k]]},['Both bars are the same whole.','Simplify the second fraction to '+c+'/'+b+'.']);
 case 'perimeter-invariant':
  w=r(2,5,rng);h=w+r(3,6,rng);
  return Q(id,'A rectangle is '+w+' by '+h+'. Another is '+(w+1)+' by '+(h-1)+'. What stays the same?',['Perimeter only','Area only','Both','Neither'],'Perimeter only','One side gains 1, the other loses 1. Their sum, and hence perimeter, is unchanged; area differs.',{kind:'arrays',pairs:[[w,h],[w+1,h-1]]},['Which measurement goes around the shape?','Add the two side lengths, not their product.']);
 case 'area-scale':
  w=r(2,5*s,rng);h=r(2,4*s,rng);
  return Q(id,'A '+w+' by '+h+' rectangle becomes '+(2*w)+' by '+h+'. What happens to area?',['Doubles','Unchanged','Triples','Halves'],'Doubles','The new rectangle consists of two identical copies.',{kind:'arrays',pairs:[[w,h],[2*w,h]]},['Height stayed the same.','How many original rectangles fit inside?']);
 case 'angle-straight':
  a=rng()<.5?r(20,70,rng):r(110,160,rng);
  return Q(id,'Two adjacent angles form a straight line. One is '+a+' degrees. Is the OTHER acute or obtuse?',['Acute','Obtuse','Right'],a>90?'Acute':'Obtuse','They total 180 degrees. If one is above 90 the other must be below, and vice versa.',{kind:'angle',value:a},['A straight line is two right angles.','Compare '+a+' with 90 degrees.']);
 case 'angle-at-point':
  n=r(3,7,rng);
  return Q(id,n+' sectors fill the space around one point. What must their angles total?',['90 degrees','180 degrees','270 degrees','360 degrees'],'360 degrees','Together they form one full turn, always 360 degrees.',{kind:'turn',value:n},['Imagine turning until you face your starting direction.','A full turn is four right angles.']);
 case 'word-ratio':
  k=r(2,5*s,rng);a=r(2,7*s,rng);n=(k+1)*a;
  return Q(id,'Asha has '+k+' times as many stickers as Ben. Together they have '+n+'. What fraction belongs to Ben?',['1/'+(k+1),'1/'+k,k+'/'+(k+1),'1/'+(k+2)],'1/'+(k+1),'Ben has one equal part; Asha has '+k+'. There are '+(k+1)+' parts altogether.',{kind:'bar',parts:[k,1],labels:['Asha','Ben']},['Draw 1 part for Ben.','How many parts are there in total?']);
 case 'word-change':
  a=r(10,25*s,rng);k=r(2,a-2,rng);
  return Q(id,'A box contains '+a+' pencils. '+k+' are removed. Which relationship is correct?',['Start = left + removed','Start = left - removed','Start = left x removed'],'Start = left + removed','The starting collection is the whole, split into what remains and what was removed.',{kind:'bar',parts:[a-k,k],labels:['Left','Removed']},['What was the whole?','Join the remaining and removed amounts.']);
 case 'rounding-midpoint':
  k=level===1?100:level===2?1000:10000;a=r(1,8,rng)*k;n=a+Math.round(k*pick([.15,.25,.35,.65,.75,.85],rng));
  return Q(id,'Which multiple is '+n+' closer to?',[String(a),String(a+k),'Exactly halfway'],String(n-a<k/2?a:a+k),'The midpoint is '+(a+k/2)+'. Compare the position with halfway.',{kind:'line',lo:a,hi:a+k,at:n},['Identify the neighbouring multiples.','Mark halfway at '+(a+k/2)+'.']);
 case 'place-shift':
  n=r(11,98,rng);a=n/10;
  return Q(id,'When '+a+' is multiplied by ten, what happens to the value of EACH digit?',['Becomes 10 times as much','Becomes 10 less','Does not change'],'Becomes 10 times as much','Each digit becomes worth ten times as much: '+a+' x 10 = '+n+'.',{kind:'place',value:a},['Consider the ones and tenths columns.','What is ten times one tenth?']);
 case 'odd-even':
  a=2*r(2,8*s,rng)+1;b=2*r(2,8*s,rng)+1;
  return Q(id,'Without adding: is '+a+' + '+b+' odd or even?',['Odd','Even','Cannot tell'],'Even','Each odd number leaves one unmatched counter. The two leftovers make a new pair.',{kind:'pairs',pairs:[[a,1],[b,1]]},['Each odd group has one spare.','Two spares make a pair.']);
 case 'turn-shapes':
  w=r(3,7,rng);h=r(2,5,rng);if(w===h)w++;
  return Q(id,'A '+w+' by '+h+' rectangle rotates 90 degrees. What changes?',['Area only','Perimeter only','Both','Neither'],'Neither','Rotation changes orientation only: no square units or boundary lengths are added.',{kind:'arrays',pairs:[[w,h],[h,w]]},['Imagine rotating a paper rectangle.','Does turning it add or remove anything?']);
 case 'units':
  n=r(11,35*s,rng);a=(n/10).toFixed(1);
  return Q(id,'Which length is greater: '+a+' metres or '+10*n+' centimetres?',['Metres length','Centimetres length','They are equal'],'They are equal','100 cm = 1 m, so '+a+' m and '+10*n+' cm are exactly equal.',{kind:'units',value:a},['Remember the unit benchmark.','Convert metres to centimetres by multiplying by 100.']);
 case 'fraction-of-whole':
  b=r(4,10,rng);a=r(1,b-1,rng);
  return Q(id,'A bar has '+b+' equal pieces and '+a+' are shaded. What fraction is shaded?',[a+'/'+b,b+'/'+a,a+'/'+(b+1)],a+'/'+b,'The numerator counts the '+a+' shaded pieces; the denominator counts all '+b+' equal pieces.',{kind:'fractions',pairs:[[a,b]]},['Count all equal parts first.','How many of those parts are shaded?']);
 default: throw Error('Unknown technique: '+id);
 }
}
