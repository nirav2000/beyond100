(() => {
  const band = (id, level, name, description) => ({ id, level, name, description });
  const skill = (id, name, stage = "mixed", layers = ["NC"], tags = []) => ({ id, name, stage, layers, tags });
  const sub = (id, name, skills) => ({ id, name, skills });
  const topic = (id, name, subtopics) => ({ id, name, subtopics });
  const domain = (id, name, topics) => ({ id, name, topics });

  const C = {
    schemaVersion: "1.0.0",
    subject: "maths",
    purpose: "Complete canonical map of mathematical knowledge and skill, with statutory, early-KS3, selective-school and mathematical-thinking layers.",
    layers: {
      NC: "England National Curriculum statutory content",
      EARLY_KS3: "Practical early-KS3 progression; KS3 is statutory across Years 7-9, not allocated officially to Year 7",
      EXT: "Non-statutory extension",
      SEL: "11+/12+ selective-school application",
      NRT: "Non-routine transfer"
    },
    attainmentBands: [
      band("not-assessed", 0, "Not yet assessed", "Not enough evidence to judge the skill."),
      band("emerging", 1, "Emerging", "Encountered, but substantial support or core repair is still needed."),
      band("developing", 2, "Developing", "Some independent success on familiar forms, but understanding or fluency remains fragile."),
      band("secure", 3, "Secure", "Reliable independent performance on expected curriculum forms with sound basic explanation."),
      band("mastered", 4, "Mastered", "Flexible, transferable and retained knowledge: unfamiliar application, explanation, checking and delayed retrieval."),
      band("mathematician", 5, "Mathematician · 1729", "Mastered plus richer mathematical behaviour: structure, curiosity, persistence, alternative methods, conjecture, generalisation, proof, connections or creation.")
    ],
    statusModifiers: ["fluent", "hesitant", "prompted", "retrieval-due", "fragile-retention", "SEL", "NRT"],
    thinkingTags: {
      CUR: "Curiosity / productive question generation",
      STR: "Structural insight",
      ALT: "Alternative methods",
      PST: "Persistence / productive struggle",
      CON: "Conjecture",
      GEN: "Generalisation",
      PRF: "Proof / justification",
      ABS: "Abstraction",
      COM: "Mathematical communication",
      IND: "Independence",
      COL: "Collaboration",
      CRT: "Critique / evaluation",
      CRE: "Mathematical creation"
    },
    domains: [
      domain("number-sense", "Number sense, counting & representation", [
        topic("counting", "Counting & number sequences", [
          sub("counting-core", "Counting foundations", [
            skill("number.counting.one-to-one-cardinality", "One-to-one counting and cardinality", "Y1"),
            skill("number.counting.forward-backward", "Count forwards/backwards from arbitrary starts and across boundaries", "Y1-Y4"),
            skill("number.counting.skip", "Skip-count in required intervals and recognise the resulting patterns", "Y1-Y5", ["NC"], ["STR"]),
            skill("number.counting.missing-sequence", "Find missing values and continue number sequences", "Y1-Y6", ["NC"], ["STR", "GEN"])
          ])
        ]),
        topic("place-value", "Place value & base-10 structure", [
          sub("place-value-core", "Place-value structure", [
            skill("number.place-value.digit-value", "Distinguish a digit from its value and identify place value", "Y2-KS3"),
            skill("number.place-value.zero-placeholder", "Understand zero as a placeholder", "Y2-Y6"),
            skill("number.place-value.partition-standard", "Compose/decompose numbers using standard partitioning", "Y2-Y6"),
            skill("number.place-value.partition-flexible", "Use flexible/non-standard partitioning", "Y2-Y6", ["NC", "SEL"], ["STR"]),
            skill("number.place-value.powers10", "Understand adjacent columns and multiplication/division by powers of ten structurally", "Y4-KS3", ["NC", "EARLY_KS3"], ["STR", "PRF"]),
            skill("number.place-value.decimals", "Extend place value to tenths, hundredths and thousandths", "Y4-KS3"),
            skill("number.standard-form.ks3", "Interpret and compare standard form", "KS3", ["EARLY_KS3"])
          ])
        ]),
        topic("notation", "Number names & notation", [
          sub("notation-core", "Numerals and number names", [
            skill("number.notation.words-numerals", "Convert accurately between number words and Hindu-Arabic numerals", "Y1-Y6"),
            skill("number.notation.expanded", "Use expanded notation", "Y2-Y6"),
            skill("number.notation.symbols", "Use equality and inequality notation precisely", "Y1-KS3")
          ]),
          sub("roman", "Roman numerals", [
            skill("number.roman.symbol-values", "Know I, V, X, L, C, D and M values", "Y3-Y5"),
            skill("number.roman.additive", "Read/build additive Roman-numeral forms", "Y3-Y5"),
            skill("number.roman.repetition", "Apply repetition rules and recognise invalid repetition", "Y4-Y5", ["NC", "SEL"], ["STR"]),
            skill("number.roman.subtractive", "Use IV, IX, XL, XC, CD and CM subtractive pairs", "Y4-Y5", ["NC", "SEL"], ["STR"]),
            skill("number.roman.validity", "Distinguish valid and invalid Roman-numeral forms and explain why", "Y4-Y5", ["NC", "SEL", "NRT"], ["PRF", "CRT"]),
            skill("number.roman.convert-to-arabic", "Convert Roman numerals to Hindu-Arabic numbers", "Y3-Y5"),
            skill("number.roman.convert-from-arabic", "Convert Hindu-Arabic numbers to Roman numerals", "Y4-Y5"),
            skill("number.roman.clock", "Read I-XII on analogue clock faces", "Y3"),
            skill("number.roman.to-100", "Read Roman numerals I-C", "Y4"),
            skill("number.roman.to-1000-years", "Read Roman numerals to M and recognise years", "Y5"),
            skill("number.roman.history-zero-place-value", "Contrast Roman notation with zero and place-value notation", "Y4-Y5", ["NC", "EXT"], ["STR"]),
            skill("number.roman.numeral-language", "Distinguish the generic term numeral from Roman numeral", "Y3-Y6")
          ])
        ]),
        topic("compare-order", "Compare, order & number lines", [
          sub("compare-core", "Magnitude and order", [
            skill("number.compare.whole", "Compare/order whole numbers using place value", "Y1-Y6"),
            skill("number.compare.decimals", "Compare/order decimals", "Y4-KS3"),
            skill("number.number-line.locate-estimate", "Locate/estimate values on number lines", "Y1-KS3"),
            skill("number.number-line.midpoint-interval", "Reason with midpoints and intervals", "Y3-KS3", ["NC", "SEL"], ["STR"])
          ])
        ]),
        topic("negative-numbers", "Negative numbers", [
          sub("negative-core", "Negative-number progression", [
            skill("number.negatives.count-through-zero", "Count through zero and interpret negatives in context", "Y4-Y6"),
            skill("number.negatives.order", "Order negative values", "Y4-KS3"),
            skill("number.negatives.intervals", "Calculate intervals across zero", "Y6-KS3"),
            skill("operations.signed-rational-arithmetic", "Calculate with signed integers and rational numbers", "KS3", ["EARLY_KS3"])
          ])
        ])
      ]),
      domain("mental-calculation", "Number facts & mental calculation", [
        topic("number-bonds", "Number bonds & complements", [sub("bonds-core", "Bonds and derived facts", [
          skill("facts.bonds.within-10-20", "Recall bonds within 10 and 20", "Y1-Y2"),
          skill("facts.bonds.to-powers10", "Use complements to 100 and powers of ten", "Y2-Y6"),
          skill("facts.derived", "Derive related facts from known facts", "Y2-Y6", ["NC"], ["STR"])
        ])]),
        topic("times-tables", "Multiplication facts", [sub("tables-core", "Multiplication/division facts", [
          skill("facts.tables.to-12", "Recall multiplication/division facts through 12 x 12", "Y2-Y4"),
          skill("facts.tables.derived-products", "Derive products/division facts efficiently", "Y3-Y6", ["NC"], ["STR"])
        ])]),
        topic("mental-strategies", "Mental strategy selection", [sub("mental-core", "Efficient mental calculation", [
          skill("mental.strategy.partition", "Use partition-and-recombine strategies", "Y2-Y6"),
          skill("mental.strategy.compensation", "Use compensation/near facts", "Y2-Y6"),
          skill("mental.strategy.choose", "Choose and compare efficient mental/written strategies", "Y3-KS3", ["NC", "SEL"], ["ALT", "STR"])
        ])])
      ]),
      domain("operations", "Addition, subtraction, multiplication & division", [
        topic("addition-subtraction", "Addition & subtraction", [sub("add-sub-core", "Concepts and methods", [
          skill("operations.add-sub.models", "Understand combining, augmentation, take-away and difference structures", "Y1-Y6"),
          skill("operations.add-sub.inverse", "Use inverse relationships", "Y1-KS3"),
          skill("operations.add-sub.column", "Use formal column methods with correct place alignment/regrouping", "Y3-Y6"),
          skill("operations.add-sub.decimals", "Add/subtract decimals", "Y4-KS3"),
          skill("reasoning.add-sub.multi-step", "Solve and interpret multi-step add/subtract problems", "Y3-Y6", ["NC", "SEL", "NRT"])
        ])]),
        topic("multiplication-division", "Multiplication & division", [sub("mult-div-core", "Concepts and methods", [
          skill("operations.mult-div.models", "Understand equal groups, arrays, sharing, grouping and scaling", "Y1-Y6"),
          skill("operations.multiply.properties", "Use commutativity, associativity and distributivity", "Y2-KS3", ["NC"], ["STR"]),
          skill("operations.multiply.short-long", "Use short/long multiplication appropriately", "Y4-Y6"),
          skill("operations.divide.short-long", "Use short/long division appropriately", "Y5-Y6"),
          skill("operations.divide.remainders-context", "Interpret remainders according to context", "Y5-Y6", ["NC", "SEL"], ["STR"]),
          skill("reasoning.mult-div.multi-step", "Solve unfamiliar multiplication/division problems", "Y3-Y6", ["NC", "SEL", "NRT"], ["PST"])
        ])])
      ]),
      domain("integer-properties", "Properties of integers", [
        topic("factors-primes", "Factors, multiples, primes & divisibility", [sub("integer-core", "Integer structure", [
          skill("integers.factors-multiples", "Find factors, multiples, common factors and common multiples", "Y4-KS3"),
          skill("integers.hcf-lcm", "Use HCF and LCM", "Y5-KS3"),
          skill("integers.primes.factorisation", "Recognise primes and use prime factorisation", "Y5-KS3"),
          skill("integers.divisibility", "Use and explain divisibility tests", "Y4-KS3", ["NC", "SEL"], ["STR", "PRF"]),
          skill("integers.parity-reasoning", "Use parity as a reasoning tool", "Y3-KS3", ["EXT", "SEL", "NRT"], ["STR", "PRF"])
        ])]),
        topic("powers-roots", "Powers & roots", [sub("powers-core", "Powers and roots", [
          skill("powers.squares-cubes", "Recognise/use square and cube numbers", "Y5-KS3"),
          skill("powers.index-notation", "Use index notation", "Y5-KS3"),
          skill("powers.roots", "Use square/cube roots and inverse relationships", "KS3", ["EARLY_KS3"])
        ])])
      ]),
      domain("fractions-decimals-percentages", "Fractions, decimals & percentages", [
        topic("fractions", "Fractions", [sub("fractions-core", "Fraction structure and arithmetic", [
          skill("fractions.meaning", "Understand fractions as equal parts, numbers, operators and division", "Y1-KS3"),
          skill("fractions.equivalence-simplify", "Generate equivalent fractions and simplify", "Y2-Y6"),
          skill("fractions.compare-order", "Compare/order fractions", "Y3-Y6"),
          skill("fractions.mixed-improper", "Convert mixed/improper fractions", "Y5-Y6"),
          skill("fractions.add-sub", "Add/subtract fractions", "Y3-Y6"),
          skill("fractions.multiply-divide", "Multiply/divide fractions at the appropriate stage", "Y5-KS3"),
          skill("fractions.of-amounts", "Find fractions of amounts and reverse to find the whole", "Y2-Y6", ["NC", "SEL"], ["STR"])
        ])]),
        topic("decimals", "Decimals", [sub("decimals-core", "Decimal structure and arithmetic", [
          skill("decimals.representation", "Represent tenths/hundredths/thousandths and connect to fractions", "Y4-Y6"),
          skill("decimals.compare-order", "Compare/order decimals by place value", "Y4-Y6"),
          skill("decimals.arithmetic", "Calculate with decimals", "Y4-KS3"),
          skill("decimals.rounding", "Round decimals appropriately", "Y4-KS3")
        ])]),
        topic("percentages", "Percentages & FDP", [sub("percent-core", "Percentage structure", [
          skill("percentages.meaning", "Understand percentage as per hundred and as an operator", "Y5-KS3"),
          skill("fdp.convert", "Convert/compare fractions, decimals and percentages", "Y5-KS3"),
          skill("percentages.amount", "Find a percentage of an amount", "Y5-KS3"),
          skill("percentages.change-reverse", "Percentage change and reverse percentage", "KS3", ["EARLY_KS3", "EXT"])
        ])])
      ]),
      domain("ratio-proportion", "Ratio, proportion & rates", [
        topic("ratio", "Ratio & proportion", [sub("ratio-core", "Ratio/proportion structure", [
          skill("ratio.notation-equivalence", "Use ratio notation and equivalent ratios", "Y6-KS3"),
          skill("ratio.sharing", "Share/group quantities in a ratio", "Y6-KS3"),
          skill("proportion.unitary", "Use unitary reasoning and direct proportion", "Y5-KS3", ["NC", "SEL"], ["STR"]),
          skill("proportion.inverse", "Recognise/use inverse proportion", "KS3", ["EARLY_KS3"]),
          skill("rates.compound", "Use unit rates, speed, unit pricing and density", "KS3", ["EARLY_KS3"])
        ])])
      ]),
      domain("numerical-reasoning", "Order, approximation & numerical reasoning", [
        topic("order-round-check", "Order of operations, rounding, bounds & checking", [sub("numeric-core", "Numerical judgement", [
          skill("numerical.order-operations", "Apply operation priority including brackets/powers", "Y6-KS3"),
          skill("rounding.whole-decimal", "Round whole/decimal numbers to required accuracy", "Y3-KS3"),
          skill("rounding.significant-figures", "Round to significant figures", "KS3", ["EARLY_KS3"]),
          skill("bounds.error-intervals", "Use bounds/error intervals", "KS3", ["EARLY_KS3"]),
          skill("numerical.estimate-check", "Estimate and check reasonableness using inverse/alternative methods", "Y3-KS3", ["NC", "SEL"], ["CRT"]),
          skill("numerical.calculator-interpretation", "Use calculator/technology accurately and interpret output", "KS3", ["EARLY_KS3"])
        ])])
      ]),
      domain("algebra-pattern", "Algebra, sequences & graphs", [
        topic("algebra", "Algebra", [sub("algebra-core", "Algebraic structure", [
          skill("algebra.missing-number-foundations", "Express missing-number relationships symbolically", "Y1-Y6"),
          skill("algebra.notation-vocabulary", "Use variables, terms, coefficients, expressions, equations and inequalities", "Y6-KS3"),
          skill("algebra.substitution", "Substitute values into expressions/formulae", "Y6-KS3"),
          skill("algebra.simplify-expand-factor", "Collect, expand and factor simple expressions", "KS3", ["EARLY_KS3"]),
          skill("algebra.equations", "Solve and check equations", "Y6-KS3"),
          skill("algebra.formulae", "Use/write/rearrange formulae", "Y6-KS3")
        ])]),
        topic("sequences", "Sequences & pattern", [sub("sequence-core", "Sequence reasoning", [
          skill("sequences.recognise-continue", "Recognise/continue/describe patterns", "Y1-Y6"),
          skill("sequences.arithmetic-nth", "Generate arithmetic sequences and find nth terms", "Y6-KS3", ["NC", "EARLY_KS3"], ["GEN"]),
          skill("sequences.geometric-other", "Recognise geometric and other sequences", "KS3", ["EARLY_KS3"], ["STR", "GEN"])
        ])]),
        topic("graphs-functions", "Coordinates, graphs & functions", [sub("graphs-core", "Coordinates and relationships", [
          skill("coordinates.plot-four-quadrants", "Read/plot coordinates through four quadrants", "Y4-Y6"),
          skill("functions.input-output", "Use input/output rules and tables", "Y5-KS3"),
          skill("graphs.linear", "Represent/interpret linear relationships", "KS3", ["EARLY_KS3"]),
          skill("graphs.gradient-intercept", "Understand gradient/intercept and y=mx+c", "KS3", ["EARLY_KS3"]),
          skill("graphs.quadratic-other", "Sketch/interpret quadratic and other graphs", "KS3", ["EXT"])
        ])])
      ]),
      domain("measurement-mensuration", "Measurement & mensuration", [
        topic("measurement", "Measurement, units, time & money", [sub("measure-core", "Measures and conversions", [
          skill("measurement.read-scales", "Choose units/tools and read scales accurately", "Y1-Y6"),
          skill("measurement.metric-convert", "Convert metric units including area/volume units when appropriate", "Y3-KS3"),
          skill("measurement.metric-imperial", "Use required approximate metric/imperial equivalences including miles/km", "Y5-Y6"),
          skill("time.read-duration-calendar", "Read clocks/calendars/timetables and calculate durations", "Y1-Y6"),
          skill("money.calculate", "Calculate with money, change and multi-step transactions", "Y1-Y6"),
          skill("money.unit-price-financial", "Use unit pricing and age-appropriate financial mathematics", "Y5-KS3", ["NC", "EXT", "SEL"])
        ])]),
        topic("mensuration", "Perimeter, area, volume & surface area", [sub("mensuration-core", "Mensuration", [
          skill("perimeter.calculate", "Measure/calculate perimeter including composite shapes", "Y3-KS3"),
          skill("area.calculate", "Calculate area of required 2D shapes", "Y4-KS3"),
          skill("area-perimeter.independence", "Understand that equal area need not mean equal perimeter and vice versa", "Y6", ["NC"], ["STR"]),
          skill("volume.calculate", "Calculate volume of cubes/cuboids/prisms as appropriate", "Y5-KS3"),
          skill("surface-area.calculate", "Calculate surface area using nets/formulae", "KS3", ["EARLY_KS3"])
        ])])
      ]),
      domain("geometry", "Geometry & spatial reasoning", [
        topic("shape", "2D/3D shape & spatial reasoning", [sub("shape-core", "Shape properties", [
          skill("geometry.classify-2d", "Name/classify 2D shapes by properties and hierarchy", "Y1-KS3"),
          skill("geometry.classify-3d", "Name/classify 3D shapes and faces/edges/vertices", "Y1-KS3"),
          skill("geometry.nets-visualise", "Recognise/build nets and visualise 3D from 2D representations", "Y5-KS3", ["NC", "SEL"], ["STR"]),
          skill("geometry.congruence-similarity", "Use congruence/similarity and criteria", "KS3", ["EARLY_KS3"]),
          skill("geometry.pythagoras-trigonometry", "Use Pythagoras and right-triangle trigonometric ratios", "KS3", ["EXT"])
        ])]),
        topic("angles", "Angles", [sub("angles-core", "Angle reasoning", [
          skill("angles.measure-draw-classify", "Estimate/measure/draw/classify angles", "Y3-Y6"),
          skill("angles.core-facts", "Use angles at a point/on a line/vertically opposite", "Y5-KS3"),
          skill("angles.triangle-polygon", "Use triangle/quadrilateral/polygon angle sums", "Y6-KS3"),
          skill("angles.parallel-lines", "Use corresponding/alternate angle facts", "KS3", ["EARLY_KS3"]),
          skill("angles.multi-step-proof", "Solve multi-step/algebraic angle problems and justify deductions", "Y6-KS3", ["NC", "SEL", "NRT"], ["PRF"])
        ])]),
        topic("transformations", "Symmetry, transformations & constructions", [sub("transform-core", "Transformations/constructions", [
          skill("symmetry.line-rotational", "Recognise/use line and rotational symmetry", "Y2-KS3"),
          skill("transform.translate-reflect-rotate-enlarge", "Translate, reflect, rotate and enlarge shapes", "Y4-KS3"),
          skill("constructions.ruler-compass", "Use ruler/compass/protractor constructions accurately", "Y3-KS3")
        ])]),
        topic("circles", "Circles", [sub("circles-core", "Circle structure", [
          skill("circles.parts", "Use centre/radius/diameter/circumference language and d=2r", "Y6"),
          skill("circles.area-circumference", "Calculate circle area/circumference", "KS3", ["EARLY_KS3"])
        ])])
      ]),
      domain("statistics-probability", "Statistics, probability & combinatorics", [
        topic("statistics", "Statistics & data", [sub("statistics-core", "Represent and interpret data", [
          skill("statistics.tables-charts", "Construct/interpret tables, pictograms, bar/line/pie charts", "Y2-Y6"),
          skill("statistics.averages-spread", "Calculate/interpret mean, median, mode and range as appropriate", "Y6-KS3"),
          skill("statistics.scatter", "Interpret bivariate/scatter relationships", "KS3", ["EARLY_KS3"]),
          skill("statistics.grouped-data", "Represent/interpret grouped numerical data", "KS3", ["EARLY_KS3"]),
          skill("statistics.misleading-inference", "Evaluate representations and limits of inference", "KS3", ["EARLY_KS3"], ["CRT"])
        ])]),
        topic("probability", "Probability & combinatorics", [sub("probability-core", "Chance and systematic counting", [
          skill("probability.scale", "Use probability language and 0-1 scale", "KS3", ["EARLY_KS3"]),
          skill("probability.experimental-theoretical", "Compare experimental and theoretical probability", "KS3", ["EARLY_KS3"]),
          skill("probability.sample-spaces", "Use sample spaces for combined events", "KS3", ["EARLY_KS3"]),
          skill("probability.sets-venn", "Use sets/unions/intersections/Venn diagrams", "KS3", ["EARLY_KS3"]),
          skill("combinatorics.systematic-counting", "Count possibilities systematically using lists/tables/trees", "Y5-KS3", ["EXT", "SEL", "NRT"], ["STR", "PRF"])
        ])])
      ]),
      domain("reasoning", "Mathematical reasoning & problem solving", [
        topic("problem-solving", "Problem solving & mathematical thinking", [sub("reasoning-core", "Cross-cutting reasoning", [
          skill("reasoning.decode", "Identify the action, target, constraints and relevant information", "Y1-KS3", ["NC", "SEL", "NRT"]),
          skill("reasoning.represent", "Choose and move between diagrams, models, tables, equations, graphs and lists", "Y1-KS3", ["NC", "SEL", "NRT"], ["STR"]),
          skill("reasoning.strategy-select", "Select, change and compare strategies", "Y1-KS3", ["NC", "SEL", "NRT"], ["ALT", "PST"]),
          skill("reasoning.work-backwards", "Work backwards/reverse a chain of relationships", "Y3-KS3", ["EXT", "SEL", "NRT"], ["STR"]),
          skill("reasoning.systematic-cases", "Enumerate cases without omission or duplication", "Y4-KS3", ["EXT", "SEL", "NRT"], ["STR", "PRF"]),
          skill("reasoning.constrained-construction", "Construct numbers/objects satisfying multiple constraints", "Y3-KS3", ["EXT", "SEL", "NRT"], ["PST", "STR"]),
          skill("reasoning.invariants", "Notice/use quantities or properties that stay invariant", "Y4-KS3", ["EXT", "SEL", "NRT"], ["STR", "GEN"]),
          skill("reasoning.conjecture-counterexample", "Form/test conjectures and seek counterexamples", "Y2-KS3", ["NC", "SEL", "NRT"], ["CON", "CRT"]),
          skill("reasoning.generalise", "Generalise a pattern/relationship", "Y2-KS3", ["NC", "SEL", "NRT"], ["GEN", "ABS"]),
          skill("reasoning.justify-proof", "Construct age-appropriate justification/proof", "Y2-KS3", ["NC", "SEL", "NRT"], ["PRF", "COM"]),
          skill("reasoning.create", "Create examples, non-examples, variants and mathematical questions", "Y1-KS3", ["EXT", "NRT"], ["CUR", "CRE"]),
          skill("reasoning.model", "Build/evaluate a mathematical model of a situation", "KS3", ["EARLY_KS3"], ["ABS", "CRT"])
        ])])
      ])
    ]
  };

  const allSkills = [];
  C.domains.forEach(d => d.topics.forEach(t => t.subtopics.forEach(s => s.skills.forEach(k => {
    k.domainId = d.id; k.topicId = t.id; k.subtopicId = s.id; allSkills.push(k);
  }))));
  C.skills = allSkills;
  C.skillById = Object.fromEntries(allSkills.map(s => [s.id, s]));
  C.getSkill = id => C.skillById[id] || null;
  C.getTopic = id => {
    for (const d of C.domains) for (const t of d.topics) if (t.id === id) return t;
    return null;
  };
  C.getDomain = id => C.domains.find(d => d.id === id) || null;
  window.BEYOND100_MATHS_CATALOGUE = C;
})();