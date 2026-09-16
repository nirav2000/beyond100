window.BEYOND100_RELEASES = {
  currentVersion: '0.4.0',
  repository: 'nirav2000/beyond100',
  releases: [
    {
      version: '0.4.0',
      date: '2026-09-16',
      title: 'Review Link Automation',
      ref: 'main',
      status: 'current',
      summary: 'Adds an expiring Firebase-backed capability URL so ChatGPT can retrieve pending review notes directly and update their status after changes are successfully applied.',
      areas: [
        { id: 'review-feed', title: 'Private JSON review feed', kind: 'feature', summary: 'Generate an expiring URL that returns only Beyond 100 notes explicitly marked for review.' },
        { id: 'scoped-actions', title: 'Scoped status actions', kind: 'workflow', summary: 'Each note includes narrowly scoped actions for actioned, needs-user and reopen states.' },
        { id: 'two-step-confirmation', title: 'Two-step confirmation', kind: 'safety', summary: 'Opening an action link does not change data; an explicit short-lived confirmation URL is required before the status is written.' },
        { id: 'revocable-capability', title: 'Expiry and revocation', kind: 'security', summary: 'Review URLs expire after 1–30 days and can be revoked from the Notes panel without changing Firebase credentials.' }
      ]
    },
    {
      version: '0.3.0',
      date: '2026-09-16',
      title: 'Version Lab',
      ref: '542728f52337d0875dc90570ea1edf4a395a54b6',
      status: 'archive',
      summary: 'Adds a first-class version history and comparison workflow so individual design or behaviour changes can be kept, reverted or reworked without losing unrelated improvements.',
      areas: [
        { id: 'version-history', title: 'Version history', kind: 'feature', summary: 'Browse named releases with a concise explanation of what changed and why.' },
        { id: 'live-compare', title: 'Live side-by-side comparison', kind: 'feature', summary: 'Open two runnable versions next to each other, using immutable historical Git commits for older releases.' },
        { id: 'decision-log', title: 'Keep / Revert / Rework decisions', kind: 'workflow', summary: 'Record a decision for each change area and generate a development brief for the next iteration.' },
        { id: 'release-discipline', title: 'Release discipline', kind: 'workflow', summary: 'Future meaningful changes should be grouped into named releases with change areas rather than becoming an unstructured sequence of edits.' }
      ]
    },
    {
      version: '0.2.0',
      date: '2026-09-16',
      title: 'Contextual Notes',
      ref: 'b006d8012714e653dcefe87c6573100598669a0c',
      status: 'archive',
      summary: 'Adds element-level and text-selection notes, a review queue and Firebase-backed storage while preserving local-first use.',
      areas: [
        { id: 'annotations', title: 'Element annotations', kind: 'feature', summary: 'Attach a note to a stable syllabus element such as stage:Y5, a mastery dimension or a question.' },
        { id: 'text-selection', title: 'Text-selection notes', kind: 'feature', summary: 'Select exact words on the page and attach the quoted text to a note.' },
        { id: 'review-queue', title: 'Review queue', kind: 'workflow', summary: 'Mark notes for review, jump back to their referenced element and copy a structured review pack.' },
        { id: 'firebase-notes', title: 'Firebase note sync', kind: 'data', summary: 'Owner-only Firestore sync in a dedicated sai-beyond100 namespace, with local storage as the immediate fallback.' }
      ]
    },
    {
      version: '0.1.0',
      date: '2026-09-16',
      title: 'Topic-first Syllabus Prototype',
      ref: 'cdd3dfdaa80623b96a99cafa77229ee60e26c10d',
      status: 'archive',
      summary: 'The original working Beyond 100 concept: a topic-first Y1→Y7 progression, deep Place Value mastery, diagnostics, misconceptions, question bank and Topic Factory.',
      areas: [
        { id: 'topic-first', title: 'Topic-first navigation', kind: 'design', summary: 'Maths, English and Science are organised by topic, with year-by-year progression inside each topic.' },
        { id: 'place-value', title: 'Place Value showcase', kind: 'content', summary: 'Y1→Y7 progression with quick diagnostics and a deep mastery model.' },
        { id: 'diagnostic', title: 'Cold diagnostic flow', kind: 'feature', summary: 'Generate questions around a selected year and classify the dominant source of errors.' },
        { id: 'topic-factory', title: 'Topic Factory', kind: 'workflow', summary: 'Generate a consistent schema and prompt for building the remaining syllabus topics.' }
      ]
    }
  ]
};
