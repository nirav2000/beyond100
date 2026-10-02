const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync("maths-catalogue-data.js", "utf8"), context);
vm.runInContext(fs.readFileSync("catalogue-validator.js", "utf8"), context);

const C = context.window.BEYOND100_MATHS_CATALOGUE;
const V = context.window.BEYOND100_CATALOGUE_VALIDATION;

assert(C, "catalogue should load");
assert(V.ok, "catalogue validator should pass: " + V.errors.join("; "));
assert.deepStrictEqual(Array.from(C.attainmentBands, b => b.level), [0,1,2,3,4,5]);
assert.strictEqual(C.attainmentBands[4].id, "mastered");
assert.strictEqual(C.attainmentBands[5].id, "mathematician");

const roman = C.getTopic("notation").subtopics.find(s => s.id === "roman");
assert(roman, "Roman numerals subtopic should exist");
assert(roman.skills.length >= 10, "Roman numerals should be decomposed into teachable atomic skills");
[
  "number.roman.symbol-values",
  "number.roman.subtractive",
  "number.roman.validity",
  "number.roman.clock",
  "number.roman.to-100",
  "number.roman.to-1000-years"
].forEach(id => assert(C.getSkill(id), "missing Roman skill " + id));

[
  "number.standard-form.ks3",
  "operations.signed-rational-arithmetic",
  "numerical.calculator-interpretation",
  "graphs.gradient-intercept",
  "rates.compound",
  "geometry.pythagoras-trigonometry",
  "probability.sets-venn",
  "statistics.grouped-data",
  "reasoning.systematic-cases",
  "reasoning.invariants"
].forEach(id => assert(C.getSkill(id), "missing audited skill " + id));

["CUR","STR","ALT","PST","CON","GEN","PRF","ABS","COM","IND","COL","CRT","CRE"]
  .forEach(tag => assert(C.thinkingTags[tag], "missing thinking tag " + tag));

const ids = C.skills.map(s => s.id);
assert.strictEqual(new Set(ids).size, ids.length, "skill IDs must be unique");
console.log("Catalogue OK", V.stats);
