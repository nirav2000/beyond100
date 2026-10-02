const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={window:{}}; vm.createContext(context);
vm.runInContext(fs.readFileSync('data.js','utf8'),context);
const D=context.window.BEYOND100_DATA;
const pv=D.detailedTopics['Place Value & Number Structure'];
const rn=D.detailedTopics['Roman Numerals'];

assert(pv,'Place Value must remain present');
assert.strictEqual(pv.id,'maths-place-value');
assert.strictEqual(pv.stages.length,7,'Place Value Y1-Y7 progression must be preserved');
assert.strictEqual(pv.questions.length,20,'Place Value question bank must be preserved');
assert(pv.mastery.dimensions.length>=10,'Place Value mastery depth must be preserved');
assert(pv.misconceptions.some(x=>/zero/i.test(x)),'Place Value zero-placeholder misconception must remain');
assert(pv.questions.some(x=>x.id==='pv14'&&/without using the phrase 'add a zero'/i.test(x.prompt)),'Place Value conceptual powers-of-ten question must remain');

assert(rn,'Roman Numerals detailed topic must exist');
assert(D.subjects.maths.topics.includes('Roman Numerals'),'Roman Numerals must appear in Maths navigation');
assert(rn.questions.length>=20,'Roman Numerals needs a rich question bank');
assert(rn.misconceptions.some(x=>/IXX/.test(x)),'Roman topic must diagnose arithmetic-expression thinking');
assert(rn.questions.some(x=>/19/.test(x.prompt)&&/IXX/.test(x.prompt)),'Roman diagnostic must include XIX/IXX misconception');
assert(rn.questions.some(x=>/1,994/.test(x.prompt)),'Roman topic must include place-by-place conversion');
assert(rn.mastery.dimensions.some(x=>/1729/.test(x.name)),'Roman topic must include Mathematician/1729 depth');
console.log('Topic migration regression OK',{placeValueQuestions:pv.questions.length,romanQuestions:rn.questions.length});