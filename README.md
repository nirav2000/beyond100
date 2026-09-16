# Beyond 100

A topic-first curriculum, diagnostic and mastery app for tracking progression from early foundations through Year 7.

## Live site

https://nirav2000.github.io/beyond100/

## What is implemented

- Mobile-friendly syllabus navigation for **Maths, English and Science**.
- A full **Place Value & Number Structure** showcase, organised vertically from Y1 to Y7.
- Quick cold-diagnostic questions at every stage.
- Deep mastery dimensions rather than a simple checklist.
- Common misconceptions designed to expose fragile understanding.
- A tagged question bank with hidden answers.
- Diagnostic error codes: Knowledge, Concept, Question interpretation, Procedure, Fluency, Reasoning and Attention.
- A **Topic Factory** that creates the standard JSON scaffold and a ready-to-use generation prompt for every unfinished topic.
- Automatic GitHub Pages deployment on pushes to `main`.

## Design principle

The app is **topic-first, not year-first**.

For example, selecting *Place Value & Number Structure* shows the full road:

`Y1 foundations → Y2 tens/ones → Y3 hundreds → Y4 thousands → Y5 one million → Y6 ten million → early KS3 generalisation`

This makes it possible to identify the highest level at which a learner is genuinely secure, while also seeing what comes next.

## Mastery standard

A topic is not considered mastered because a learner completed a worksheet immediately after teaching. The prototype checks multiple dimensions, including representation, reverse reasoning, explanation, comparison, manipulation, application, traps, transfer and delayed retention.

## Curriculum note

Primary progression is based on the England National Curriculum. Key Stage 3 statutory content spans Years 7–9 rather than prescribing each item to a particular year, so the app labels Y7 material as a practical early-KS3 progression rather than an official year-specific entitlement.

Official sources:

- Mathematics: https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study
- English: https://www.gov.uk/government/publications/national-curriculum-in-england-english-programmes-of-study
- Science: https://www.gov.uk/government/publications/national-curriculum-in-england-science-programmes-of-study

## Expanding the syllabus

Detailed topics live in `data.js` under:

```js
window.BEYOND100_DATA.detailedTopics
```

Use the Topic Factory in the web app to select a subject/topic and copy:

1. the standard generation prompt; and
2. the JSON scaffold matching the Place Value structure.

See `TOPIC_AUTHORING.md` for the quality standard and repeatable expansion process.
