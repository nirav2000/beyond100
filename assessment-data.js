window.BEYOND100_ASSESSMENTS = {
  source: {
    id: 'orley-summer-maths-2026',
    title: 'Orley Farm Summer Mathematics Adventure',
    subtitle: 'Year 4 → Year 5 transition booklet',
    learner: 'Sai',
    period: 'August–September 2026',
    note: 'This is work-sample evidence, not a formal standardised assessment. Judgements below describe what this booklet suggests and should be confirmed with short cold diagnostics.',
    pages: [
      { page: 1, label: 'Cover and learner details', topics: ['Overview'] },
      { page: 2, label: 'Week 1 · Read & write numbers to one million', topics: ['Place Value & Number Structure'] },
      { page: 3, label: 'Weeks 2–3 · Rounding; compare & order', topics: ['Rounding & Estimation','Compare & Order Numbers'] },
      { page: 4, label: 'Weeks 4–5 · ×/÷ 10 and 100; Roman numerals', topics: ['Powers of 10','Roman Numerals','Place Value & Number Structure'] },
      { page: 5, label: 'Weeks 6–7 · Written calculation; multiplication & division', topics: ['Addition & Subtraction','Multiplication & Division'] },
      { page: 6, label: 'Week 8 · 2D/3D shapes and angles + answer key 1–4', topics: ['Shape & Angles','Answer key'] },
      { page: 7, label: 'Parent answer key · Weeks 5–8', topics: ['Answer key'] }
    ]
  },
  topics: [
    {
      id: 'place-value',
      title: 'Place Value & Number Structure',
      syllabusTopic: 'Place Value & Number Structure',
      yearContext: 'Y4 → Y5 transition',
      status: 'Priority review',
      tone: 'priority',
      pages: [2,4],
      evidence: [
        'On the Week 1 page, reading and writing a six-digit number in words is visibly hesitant and the place-value wording becomes confused.',
        'The work shows that direct digit-value tasks can be answered, but representing a whole number accurately in words and reconstructing it from place-value information is less secure.',
        'The challenge and handwritten working suggest that zero placeholders and the relationship between columns should be probed explicitly rather than assuming procedural success means structural understanding.'
      ],
      assessment: 'The booklet supports the earlier finding that large-number place value is not yet securely mastered at Y5 depth. I would treat the underlying structure as mixed rather than simply “wrong”: there are usable pieces of knowledge, but they do not yet combine reliably when the representation changes.',
      nextChecks: [
        'Say and write 304,019; then explain what both zeroes are doing.',
        'Build 413,006 from “4 hundred-thousands, 13 thousands and 6 ones”.',
        'Partition 583,204 conventionally and in two non-standard ways.',
        'Explain why 3,846 × 10 = 38,460 without using “add a zero”.'
      ],
      likelyErrors: ['C Concept','Q Question interpretation','R Reasoning']
    },
    {
      id: 'rounding',
      title: 'Rounding & Estimation',
      syllabusTopic: 'Estimation & Checking',
      yearContext: 'Y4 → Y5 transition',
      status: 'Developing',
      tone: 'developing',
      pages: [3],
      evidence: [
        'Some direct rounding answers are correct, including examples where the target place is obvious.',
        'Other answers retain too much of the original number or show uncertainty about which digit controls the decision.',
        'The explanation of another pupil’s mistake identifies the relevant place-value issue, but number-line estimation, multi-step rounding and the range of numbers that round to a target are much less secure.',
        'The challenge involving the smallest/largest possible original number is not solved correctly.'
      ],
      assessment: 'There is partial procedure knowledge but not yet flexible mastery. The important gap is not “knows the 5-or-more rule”; it is identifying the target place, understanding the interval represented by a rounded number and applying rounding inside a problem.',
      nextChecks: [
        'Round 46,352 to the nearest 10, 100, 1,000 and 10,000; explain which digit you inspect each time.',
        'What is the smallest whole number that rounds to 50,000 to the nearest 10,000? What is the largest?',
        'Place 16,350 approximately on a 16,000–17,000 number line before calculating.',
        'Estimate 12,460 + 13,720 + 11,890 to the nearest thousand, then compare with the exact total.'
      ],
      likelyErrors: ['C Concept','P Procedure','R Reasoning']
    },
    {
      id: 'compare-order',
      title: 'Compare & Order Numbers',
      syllabusTopic: 'Place Value & Number Structure',
      yearContext: 'Y4 → Y5 transition',
      status: 'Mostly secure core',
      tone: 'secure',
      pages: [3],
      evidence: [
        'The greater-than/less-than comparisons and ordering tasks are largely completed successfully.',
        'Ordering house prices also appears structurally sound.',
        'The final difference calculation is wrong even though the largest and smallest numbers appear to have been identified, separating place-value comparison from arithmetic accuracy.'
      ],
      assessment: 'Core comparison and ordering look stronger than the neighbouring rounding work. I would not spend much time reteaching the comparison symbols; instead confirm that the skill transfers to decimals, negatives and word problems, and separately diagnose subtraction accuracy.',
      nextChecks: [
        'Order 405,089; 450,089; 405,980; 405,098 and justify the first place where each pair differs.',
        'Find the difference between the largest and smallest without rounding.',
        'Repeat with 0.405, 0.45, 0.4059 and 0.409.',
        'Explain why −2 is greater than −5.'
      ],
      likelyErrors: ['P Procedure','A Attention']
    },
    {
      id: 'powers-ten',
      title: 'Multiplying & Dividing by 10 and 100',
      syllabusTopic: 'Place Value & Number Structure',
      yearContext: 'Y4 → Y5 transition',
      status: 'Procedurally stronger than conceptually',
      tone: 'developing',
      pages: [4],
      evidence: [
        'Many direct ×10, ×100, ÷10 and ÷100 calculations are completed quickly and correctly.',
        'In the misconception question, the written explanation is framed as “add a zero after 46”, which gives the correct whole-number result but is not a durable place-value model.',
        'That rule will fail once decimals are introduced, so the apparent fluency should be checked with digit-value explanations and decimal examples.'
      ],
      assessment: 'This is a classic case where an answer can look secure while the mental model remains fragile. Keep the speed, but replace the “add/remove zeroes” rule with “each digit becomes 10/100 times the value and occupies the corresponding place-value column”.',
      nextChecks: [
        'Explain 46 × 10 using the value of the 4 and 6.',
        'Calculate 4.6 × 10 and explain why “add a zero” is not the rule.',
        'What is 6,590 ÷ 100? Show it on a place-value chart.',
        'Give a number which becomes 83 when divided by 100.'
      ],
      likelyErrors: ['C Concept','F Fluency']
    },
    {
      id: 'roman',
      title: 'Roman Numerals',
      syllabusTopic: 'Place Value & Number Structure',
      yearContext: 'Y4 → Y5 transition',
      status: 'Not secure',
      tone: 'priority',
      pages: [4,7],
      evidence: [
        'Several Roman-numeral items are blank or marked with question marks.',
        'The XII/IX age problem is not interpreted reliably as ordinary numbers before finding the difference.',
        'Later conversion and challenge items are largely unfinished.'
      ],
      assessment: 'Roman numerals are a discrete knowledge gap rather than evidence that general place value is absent. It should be repaired quickly and separately so it does not contaminate questions where Sai sees the word “numeral” and assumes Roman numerals.',
      nextChecks: [
        'Read IV, IX, XII, XL, XC, CD and CM aloud.',
        'Convert 49, 94, 400, 900 and 1,994 in both directions.',
        'Explain the subtraction rule in IV and IX and why IIII is not the usual form.',
        'Given XII and IX as ages, state each age first, then the difference.'
      ],
      likelyErrors: ['K Knowledge','Q Question interpretation']
    },
    {
      id: 'add-subtract',
      title: 'Written Addition & Subtraction',
      syllabusTopic: 'Addition',
      alternateTopics: ['Subtraction'],
      yearContext: 'Y4 → Y5 transition',
      status: 'Calculation mostly secure; application mixed',
      tone: 'secure',
      pages: [5,7],
      evidence: [
        'Most four-digit column additions are correct, with an isolated arithmetic error rather than wholesale method failure.',
        'Subtraction shows more uncertainty when exchanging is required.',
        'The word problems are noticeably less secure than the naked calculations, suggesting that choosing the operation and maintaining the story state are separate bottlenecks.'
      ],
      assessment: 'Do not over-practise pages of column addition. Preserve the written method with short retrieval, then spend more diagnostic time on subtraction with exchange and on translating multi-step language into an operation sequence.',
      nextChecks: [
        'One addition and one subtraction with no exchange, then one with multiple exchanges.',
        'Before calculating a word problem, state only: start amount → change 1 → change 2 → question asks for…',
        'Estimate the answer first and reject an unreasonable exact result.',
        'Use an inverse calculation to check the subtraction.'
      ],
      likelyErrors: ['P Procedure','Q Question interpretation','A Attention']
    },
    {
      id: 'multiply-divide',
      title: 'Multiplication & Division',
      syllabusTopic: 'Multiplication',
      alternateTopics: ['Division'],
      yearContext: 'Y4 → Y5 transition',
      status: 'Division is a priority',
      tone: 'priority',
      pages: [5,7],
      evidence: [
        'Short multiplication is attempted confidently and several results are correct, although there are calculation slips.',
        'Short division is much less secure: several examples are unfinished or marked with question marks and remainder notation is inconsistent.',
        'The division word problems and reverse-operation challenge are not completed reliably.'
      ],
      assessment: 'Multiplication fluency is usable but needs checking for carrying errors. Short division is the larger conceptual/procedural gap and should be diagnosed from sharing/grouping meaning through the written algorithm, including remainders and reverse checks.',
      nextChecks: [
        'Explain 1,236 ÷ 6 using groups before using the short-division layout.',
        'Solve 3,262 ÷ 5 and interpret the remainder in two different contexts.',
        'Check every division by quotient × divisor + remainder.',
        'If a number ÷ 7 = 124 remainder 3, reconstruct the original number and explain why.'
      ],
      likelyErrors: ['C Concept','P Procedure','R Reasoning']
    },
    {
      id: 'shape-angles',
      title: '2D & 3D Shapes and Angles',
      syllabusTopic: '2D & 3D Shape',
      alternateTopics: ['Angles'],
      yearContext: 'Y4 → Y5 transition',
      status: 'Mixed',
      tone: 'developing',
      pages: [6,7],
      evidence: [
        'Basic 2D shape naming and several angle classifications are present.',
        'The 3D shape properties table contains errors/uncertainty around faces, edges and vertices.',
        'In the final challenge, the response 12 corners / 12 right angles does not match the additive structure of one square plus one triangle, suggesting the wording triggered an inappropriate multiplication response.'
      ],
      assessment: 'The vocabulary is partly available, but properties and relational reasoning need consolidation. I would separate “can name the shape” from “can derive its properties” and from “can interpret a composite word problem”.',
      nextChecks: [
        'For cube, cuboid, sphere, cylinder, cone and square-based pyramid: name faces, edges and vertices and explain how you counted.',
        'Sort seven drawn angles without measuring, then measure borderline examples.',
        'Ask the square + triangle challenge again and require a sketch before any arithmetic.',
        'Give a true/false statement such as “every quadrilateral has four right angles” and ask for a counterexample.'
      ],
      likelyErrors: ['K Knowledge','Q Question interpretation','R Reasoning']
    }
  ]
};
