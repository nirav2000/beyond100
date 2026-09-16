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
- Contextual **notes and annotations** backed by the existing `kk-syllabus` Firebase/Firestore project.
- Automatic GitHub Pages deployment on pushes to `main`.

## Notes and annotations

Beyond 100 includes a contextual review system designed for syllabus refinement.

### Add a note to an element

Tap **Annotate**, then tap a highlighted item such as:

- a Year-stage card;
- a mastery dimension;
- a misconception;
- a question;
- a section heading; or
- another main syllabus block.

The note stores a stable semantic anchor such as:

```text
stage:Y5
mastery:represent
question:pv14
misconception:3
```

This is deliberately not based on screen coordinates, so the reference remains useful when the page reflows or is viewed on another device.

### Add a note to exact text

Select text in the page and choose **+ Note on selection**. The note stores both the containing syllabus anchor and the selected quotation.

### Review queue

Notes can be marked **Include in ChatGPT review queue**. The Notes panel can then:

- filter open / review / archived notes;
- jump back to the referenced element;
- edit or archive a note;
- copy a structured review pack; and
- export notes as JSON.

### Firebase storage

The app reuses the same Firebase project already used by the other learning apps:

```text
project: kk-syllabus
path: families/{ownerUid}/learners/sai-latin/progress/
```

Each cloud note is stored as a separate document with `app: "beyond100"` and `kind: "note"`. Local storage is written first so a note is not lost when offline; Firestore is merged by note ID and `updatedAt` when sync is available.

The existing Firestore rules already restrict this path to the configured owner Firebase account. No password or service-account key is stored in the repository. The Firebase client configuration is public project-identification data; access control remains in Firebase Authentication and Firestore security rules.

If a Firebase session for the same project already exists on the same browser origin, Beyond 100 attempts to reuse it. Otherwise open **Notes → Firebase sync** and sign in once.

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
