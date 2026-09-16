# Beyond 100 Topic Authoring Standard

This document defines how every detailed topic should be created after the Place Value showcase is refined.

## The rule

Each topic is a **vertical progression**, not a list of year-group objectives.

A parent should be able to open one topic and answer three questions quickly:

1. What should the learner already understand?
2. What is the highest level they can genuinely handle now?
3. What concepts and forms of reasoning come next?

## Required structure

Every detailed topic must contain:

- `summary`
- `whyItMatters`
- `stages`
  - `year`
  - `age`
  - `label`
  - `skills`
  - `quickChecks`
  - optional `note`
- `mastery`
  - `rule`
  - `dimensions`
  - `thresholds`
- `misconceptions`
- `questions`
  - `id`
  - `year`
  - `prompt`
  - `answer`
  - `type`: `short`, `explain` or `reasoning`
  - `skill`
- `sourceNotes`

## Quality benchmark

Use `Place Value & Number Structure` as the reference topic.

A good topic must go **deep and wide enough to reveal false fluency**. A learner who can imitate a taught procedure but cannot explain, reverse, transfer or retain it must not appear mastered.

### Stage skills

Each stage should:

- be cumulative;
- add genuinely new conceptual demand;
- distinguish knowledge from reasoning;
- include boundary cases where they expose understanding;
- avoid duplicating the same objective under successive years with only bigger numbers;
- use age-appropriate language without making the concept itself vague.

### Quick diagnostics

Each year/stage should contain 4–6 questions that can be asked verbally or on paper in a few minutes.

A strong set mixes:

- direct knowledge;
- representation;
- reverse questions;
- explanation;
- comparison;
- application;
- traps/misconceptions;
- unfamiliar reasoning.

Do not teach immediately before a cold diagnostic.

## Mastery

Adapt the mastery dimensions to the topic. Useful dimensions include:

- Represent
- Reverse
- Explain
- Compare
- Classify
- Manipulate
- Connect
- Apply
- Transfer
- Handle traps
- Generalise
- Retain

The Place Value thresholds are the default:

- **Not secure** — below 60%, heavy prompting or a core misconception.
- **Developing** — 60–79%; some independent success but fragile/slow.
- **Secure** — 80–89% on unfamiliar questions with sound explanation.
- **Mastered** — 90%+ on unfamiliar questions, with explanation, transfer, suitable fluency and delayed retention.

These are diagnostic working thresholds, not official National Curriculum grades.

## Error model

When recording diagnostic performance, use the dominant cause:

- `K` — Knowledge: required fact/term not known.
- `C` — Concept: underlying idea misunderstood.
- `Q` — Question: wording/instruction misread or misinterpreted.
- `P` — Procedure: concept known, execution method fails.
- `F` — Fluency: correct route but too slow/effortful to be reliable.
- `R` — Reasoning: cannot choose or adapt a strategy in an unfamiliar problem.
- `A` — Attention: careless slip despite secure understanding.

This classification is more useful than a raw score alone.

## Curriculum integrity

Use current official England curriculum material as the floor, but do not confuse it with the ceiling.

For primary subjects, map statutory expectations accurately. For Key Stage 3, remember that statutory programmes often span Years 7–9; do not fabricate an official Year 7 allocation. Use a clearly labelled **practical early-KS3 progression** instead.

Where 11+ technique or selective-school extension is added, label it as extension/test technique rather than implying it is statutory curriculum.

## Generation workflow

1. Refine the Place Value topic until its depth and presentation feel right.
2. Open **Topic Factory** in the app.
3. Select the unfinished topic.
4. Copy the generation prompt and JSON scaffold.
5. Generate/populate one detailed topic using the Place Value quality benchmark.
6. Review for duplicated objectives, shallow questions and artificial year progression.
7. Verify curriculum claims against authoritative sources where relevant.
8. Insert the object into `window.BEYOND100_DATA.detailedTopics` in `data.js`.
9. Commit to `main`; Pages redeploys automatically.
10. Test the topic in real use and refine it from observed misunderstandings.

## Batch expansion after the showcase is stable

Once the Place Value model is final, topics can be produced subject-by-subject in batches. A sensible order is:

### Maths first

Number Bonds & Mental Arithmetic → Addition → Subtraction → Multiplication → Division → Fractions → Decimals → Percentages → Ratio & Proportion → Factors/Multiples/Primes → Algebra → Geometry/Measurement → Statistics/Probability → Problem Solving → 11+ Quantitative Reasoning.

### English second

Retrieval → Vocabulary in Context → Inference → Evidence → Summarising → Language Analysis → Question Decoding → Grammar/Punctuation → Writing → 11+ Verbal Reasoning/Cloze/Comprehension.

### Science third

Working Scientifically should be developed early because its reasoning model can then be reused throughout biology, chemistry and physics topics.

## Future automation

The data schema is intentionally independent of the UI. That makes it possible later to:

- generate topics through an AI/API pipeline;
- validate new objects automatically;
- store Sai's attempts and timings;
- schedule spaced retrieval;
- calculate mastery by atomic skill;
- generate a daily session automatically from weak skills and review dates.
