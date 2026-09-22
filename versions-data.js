window.BEYOND100_RELEASES = {
  currentVersion: '0.10.2',
  repository: 'nirav2000/beyond100',
  releases: [
    {
      version: '0.10.2',
      date: '2026-09-22',
      title: 'Controller Sync Hotfix',
      ref: 'main',
      status: 'current',
      summary: 'Completes the persistent parent-controller sync repair and makes the child compact status derive from the active question state rather than timer-render timing.',
      areas: [
        { id: 'question-progress-state', title: 'Reliable question progress status', kind: 'repair', summary: 'Question in progress is now driven by the current task state, avoiding a first-paint Ready state before the automatic timer starts.' },
        { id: 'controller-sync-recovery', title: 'Persistent controller recovery', kind: 'repair', summary: 'Keeps live state and command listeners attached to the persistent QR controller after transient fallback.' }
      ]
    },
    {
      version: '0.10.1',
      date: '2026-09-22',
      title: 'Reliable Parent Controller Sync',
      ref: 'main',
      status: 'archive',
      summary: 'Fixes stale persistent-controller state and mixed waiting/live panels, makes Check again actively request fresh state, keeps the iPad publishing to the persistent QR controller, and renames the child status from Thinking to Question in progress.',
      areas: [
        { id: 'controller-state-sync', title: 'Persistent controller state recovery', kind: 'repair', summary: 'Every Focus publish re-discovers the persistent capability if needed and writes the current state to it instead of silently drifting to the legacy controller document.' },
        { id: 'controller-heartbeat', title: 'Live Focus heartbeat', kind: 'repair', summary: 'Active Focus sessions republish their state every five seconds so a suspended or late-opening phone catches up automatically.' },
        { id: 'command-listener-recovery', title: 'Command listener recovery', kind: 'repair', summary: 'If the child temporarily fell back to the legacy listener, it switches back to the persistent capability listener so phone commands work again.' },
        { id: 'refresh-state', title: 'Check again requests state', kind: 'ux', summary: 'The phone Check again action now requests a fresh snapshot from the iPad instead of only resubscribing to stale state.' },
        { id: 'exclusive-parent-views', title: 'Exclusive parent controller views', kind: 'repair', summary: 'Waiting, revoked, login and live-controller panels are now guaranteed to remain mutually exclusive.' },
        { id: 'status-wording', title: 'Question in progress wording', kind: 'ux', summary: 'The child-facing compact dock now says Question in progress rather than implying that the app knows the child is thinking.' }
      ]
    },
    {
      version: '0.10.0',
      date: '2026-09-21',
      title: 'Focus Completion & Learning Dashboard',
      ref: 'main',
      status: 'archive',
      summary: 'Makes Focus completion child-first, hides live timing from the child, expands parent observations, improves remote-controller status feedback, adds a visual learning dashboard, opens Notes activity by default and introduces browser UI regression checks.',
      areas: [
        { id: 'done-flow', title: 'Done-first diagnostic flow', kind: 'ux', summary: 'Adds a child-facing Done control and matching parent control. Done stops the timer, then reveals child confidence; the next task advances once parent evidence and confidence are both captured.' },
        { id: 'hidden-timer', title: 'Timer hidden from child', kind: 'ux', summary: 'The compact Focus dock now shows a thinking spinner/status rather than a running seconds counter; exact timing remains in parent controls and evidence.' },
        { id: 'equal-confidence', title: 'Neutral confidence choices', kind: 'repair', summary: 'Got it, Makes sense, Half sure and Don’t understand now have equal neutral styling until the child makes a selection.' },
        { id: 'parent-observations', title: 'Additional parent observations', kind: 'data', summary: 'Adds optional self-corrected, guessed, explained clearly, needed re-reading and attention-drift tags to question evidence.' },
        { id: 'focus-layout', title: 'Readable non-overlapping parent panel', kind: 'repair', summary: 'Larger control text and a responsive split layout keep the expanded parent panel from covering the child task on wide/iPad-sized screens.' },
        { id: 'controller-state', title: 'Controller connection feedback', kind: 'repair', summary: 'QR pairing and the phone controller now show explicit connecting, signed-in/paired, connected, waiting and error states with Sai identified.' },
        { id: 'learning-dashboard', title: 'Learning statistics dashboard', kind: 'feature', summary: 'Adds visual KPI cards and charts for response quality, speed, prompting, confidence, breakdown causes, activity, learning-cycle evidence and skill patterns.' },
        { id: 'notes-summary-open', title: 'Notes activity expanded by default', kind: 'ux', summary: 'Notes activity summary now opens expanded whenever Notes is opened.' },
        { id: 'ui-regression', title: 'Automated browser UI checks', kind: 'workflow', summary: 'GitHub Pages deployment now runs Playwright smoke tests for Focus completion, confidence defaults, parent-panel overlap, Notes defaults, dashboard availability and non-blank controller pairing states.' }
      ]
    },
    {
      version: '0.9.1',
      date: '2026-09-21',
      title: 'Persistent QR Parent Controller',
      ref: 'main',
      status: 'archive',
      summary: 'Adds a persistent learner-level parent-controller key with locally generated QR pairing, no repeat login on paired devices, manual revocation, connection presence and a GitHub-only security trade-off log.',
      areas: [
        { id: 'persistent-controller', title: 'Persistent learner-level controller', kind: 'feature', summary: 'The controller key is linked to Sai’s Beyond 100 profile and remains usable across future Focus sessions until manually disconnected.' },
        { id: 'qr-pairing', title: 'Local QR pairing', kind: 'feature', summary: 'Shows a locally generated QR code alongside Share, Copy Link and Open controls without sending the bearer link to a third-party QR service.' },
        { id: 'no-repeat-login', title: 'No repeat login on paired device', kind: 'ux', summary: 'Opening the unique capability link can attach the phone controller without another Firebase sign-in once the capability rules are deployed.' },
        { id: 'manual-revocation', title: 'Manual controller revocation', kind: 'security', summary: 'Disconnect controller invalidates all copies of the old QR/link; there is deliberately no automatic expiry.' },
        { id: 'security-log', title: 'GitHub-only security issues log', kind: 'documentation', summary: 'Known bearer-link risks and deferred hardening options are tracked in .github/SECURITY_ISSUES.md and excluded from the published Pages artifact.' }
      ]
    },
    {
      version: '0.9.0',
      date: '2026-09-21',
      title: 'One-Task Focus & Remote Parent Control',
      ref: 'main',
      status: 'archive',
      summary: 'Reframes Focus around one child-facing task at a time, question-level evidence, compact parent controls, child confidence, phase completion history, in-app documentation, and an authenticated phone-based parent controller.',
      areas: [
        { id: 'one-task-focus', title: 'One-task child view', kind: 'feature', summary: 'Focus no longer exposes the full year card or a worksheet of questions; diagnostics and learning tasks are presented one at a time.' },
        { id: 'question-level-evidence', title: 'Question-by-question recording', kind: 'data', summary: 'Each diagnostic response records timing, response quality, prompt level and likely breakdown cause separately.' },
        { id: 'prompt-ladder', title: 'Prompt ladder', kind: 'diagnostic', summary: 'Parent controls distinguish independent reading, read-aloud support, wording clarification, hints and explanation.' },
        { id: 'child-confidence', title: 'Child confidence faces', kind: 'feature', summary: 'Adds Got it, Makes sense, Half sure and Don’t understand as a separate self-report from demonstrated performance.' },
        { id: 'phase-history', title: 'Phase journey and completion', kind: 'ux', summary: 'Phase tiles show sequence, current state, completed ticks and completion metadata instead of acting only as coloured selectors.' },
        { id: 'remote-parent', title: 'Remote parent controller', kind: 'feature', summary: 'A parent can keep the iPad child-facing and control response recording from another authenticated device such as an iPhone.' },
        { id: 'app-guide', title: 'In-app product guide', kind: 'documentation', summary: 'Documents the purpose of Beyond 100, Focus mode, natural Focus workflow, diagnostics, controls, confidence faces, learning phases and app sections.' }
      ]
    },
    {
      version: '0.8.3',
      date: '2026-09-21',
      title: 'Focus Flow & Touch-Safe Notes',
      ref: 'main',
      status: 'archive',
      summary: 'Makes Focus phases an explicit guided progression, clarifies the transition into later retrieval, and fixes iPad Notes minimisation by separating drag gestures from header controls.',
      areas: [
        { id: 'phase-flow', title: 'Guided phase progression', kind: 'ux', summary: 'Adds previous/next phase controls alongside the coloured phase bank so the learning cycle can be followed deliberately rather than only labelled.' },
        { id: 'retrieve-later', title: 'Explicit retrieval transition', kind: 'learning', summary: 'After Practise, the next-stage control says Retrieve later and reminds the parent that retrieval should normally happen after a gap and without prompting.' },
        { id: 'touch-minimise', title: 'Reliable iPad Notes minimise', kind: 'repair', summary: 'Moves drag handling onto the title area only, gives header controls normal touch behaviour, and isolates the minimise button from pointer capture.' }
      ]
    },
    {
      version: '0.8.2',
      date: '2026-09-20',
      title: 'Vivid Focus & Notes Defaults',
      ref: 'main',
      status: 'archive',
      summary: 'Makes Focus phases distinctive and explanatory, hardens Notes minimisation, opens Notes history by default, collapses the technical review feed, and enlarges Notes activity visuals.',
      areas: [
        { id: 'phase-themes', title: 'Memorable phase themes', kind: 'ux', summary: 'Each Focus phase now has its own visual identity with themed colour, gradient/glow, a persistent phase description and immediate selection feedback.' },
        { id: 'compact-notes', title: 'Reliable compact Notes bar', kind: 'repair', summary: 'Minimised Notes is forced into a compact non-modal bar and hides Firebase/sync controls so minimisation cannot be mistaken for a sync-state change.' },
        { id: 'notes-defaults', title: 'Better Notes defaults', kind: 'ux', summary: 'Notes history is expanded by default while the technical Review feed is collapsed.' },
        { id: 'activity-scale', title: 'Larger Notes activity visuals', kind: 'ux', summary: 'Increases the size and legibility of Notes-at-a-glance text, icons, totals, recent activity and category bars.' }
      ]
    },
    {
      version: '0.8.1',
      date: '2026-09-20',
      title: 'Notes Insight & Focus Phase Polish',
      ref: 'main',
      status: 'archive',
      summary: 'Makes the minimised Notes window annotatable and directly restorable, turns Notes activity into a graphical all-time dashboard, and replaces the Focus phase dropdown with an icon-tile phase bank.',
      areas: [
        { id: 'annotate-minimised-notes', title: 'Annotate the minimised Notes window', kind: 'repair', summary: 'Narrows the self-annotation safeguard so the compact Notes window is a valid annotation target while the full editor remains protected.' },
        { id: 'restore-notes-body', title: 'Tap mini Notes to restore', kind: 'ux', summary: 'Clicking or tapping the non-control area of the minimised Notes header restores the full Notes window.' },
        { id: 'notes-dashboard', title: 'Graphical Notes activity dashboard', kind: 'ux', summary: 'Adds all-time workflow tiles, recent activity, implemented share and category bars; archived notes remain represented even when older than 30 days.' },
        { id: 'phase-tiles', title: 'Icon learning-phase bank', kind: 'ux', summary: 'Replaces the Focus phase combo box with seven rounded icon tiles, hover descriptions and a coloured active state.' }
      ]
    },
    {
      version: '0.8.0',
      date: '2026-09-20',
      title: 'Guided Focus Workspace',
      ref: 'main',
      status: 'archive',
      summary: 'Rebuilds Focus as a parent-guided learning workspace: preserve meaningful context, hide peripheral chrome, expose response timing and diagnostic controls, record evidence, suggest the next learning action, and make Notes minimise into a true floating non-modal state.',
      areas: [
        { id: 'focus-workspace', title: 'Context-preserving Focus', kind: 'feature', summary: 'Focus is now entered at a meaningful learning block or active section rather than stepping through arbitrary DOM cards.' },
        { id: 'parent-controls', title: 'Parent control drawer', kind: 'feature', summary: 'Adds timer, response quality, K/C/Q/P/F/R/A cause classification, contextual notes, session stats and a suggested next learning action.' },
        { id: 'cycle-aware', title: 'Learning-cycle phase', kind: 'feature', summary: 'Focused observations can be recorded against Diagnose, Teach, Demonstrate, Practise, Retrieve, Retrieve again or Apply and feed the existing evidence model.' },
        { id: 'focus-here', title: 'Focus here actions', kind: 'ux', summary: 'Relevant learning blocks expose a Focus here action so the parent chooses the pedagogical scope instead of the app hiding cards arbitrarily.' },
        { id: 'notes-minimise', title: 'True Notes minimisation', kind: 'repair', summary: 'Minimising Notes now reopens it non-modally as a compact floating header so the underlying page remains visible and usable while a draft is preserved.' },
        { id: 'notes-summary', title: 'Clearer Notes activity summary', kind: 'ux', summary: 'Renames Review summary to Notes activity summary, explains that it is note-workflow administration rather than learner performance, and keeps it collapsed by default.' }
      ]
    },
    {
      version: '0.7.6',
      date: '2026-09-20',
      title: 'Implemented Status Sync',
      ref: 'main',
      status: 'archive',
      summary: 'Ensures implemented notes are normalised to archived status whenever local and Firebase note data merge, including on a new device.',
      areas: [
        { id: 'implemented-sync', title: 'Implemented status survives cloud merge', kind: 'repair', summary: 'Any legacy actioned note is converted to Status: implemented and archived whenever notes are saved after Firebase reconciliation.' }
      ]
    },
    {
      version: '0.7.5',
      date: '2026-09-20',
      title: 'Notes Status & Chrome Cleanup',
      ref: 'main',
      status: 'archive',
      summary: 'Clarifies implemented-note status, automatically archives completed review notes, strengthens Firebase/sync controls, clarifies Notes minimise behaviour and removes the duplicate Version Lab control.',
      areas: [
        { id: 'implemented-status', title: 'Implemented status and auto-archive', kind: 'workflow', summary: 'Review decisions previously marked actioned now display as Status: implemented and move automatically into Archived.' },
        { id: 'cloud-icons', title: 'Stronger Firebase and sync icons', kind: 'ux', summary: 'Makes the Firebase flame and sync controls larger, heavier and easier to recognise at a glance.' },
        { id: 'minimise-clarity', title: 'Clear Notes minimise control', kind: 'ux', summary: 'Replaces the ambiguous boxed hyphen with explicit minimise/restore iconography and tooltips.' },
        { id: 'version-lab-duplicate', title: 'Single Version Lab entry', kind: 'repair', summary: 'Removes the older duplicate top-bar Version Lab icon and keeps the version-labelled control.' }
      ]
    },
    {
      version: '0.7.4',
      date: '2026-09-18',
      title: 'Notes & Firebase UI Polish',
      ref: 'main',
      status: 'archive',
      summary: 'Simplifies Notes into a product-style review and Firebase workflow with icon-led account/sync states, clearer review links, compact actions, password visibility controls and a distinct logout-all-devices danger action.',
      areas: [
        { id: 'firebase-icons', title: 'Firebase and sync state icons', kind: 'ux', summary: 'Replaces verbose header status pills with a Firebase flame and separate sync control, including signed-out, syncing, synced and error states.' },
        { id: 'account-card', title: 'Cleaner Firebase account card', kind: 'ux', summary: 'Groups account identity, one-tap sync and disconnect controls together and shows last sync feedback without duplicating lower-page buttons.' },
        { id: 'password-eye', title: 'Password eye control', kind: 'ux', summary: 'Moves password reveal into an eye icon inside the password field.' },
        { id: 'review-links', title: 'Simplified review links', kind: 'workflow', summary: 'Renames technical bridge fields and actions, adds copy/open icons and reduces the workflow to create/refresh the review link and check reviewed notes.' },
        { id: 'danger-zone', title: 'Logout-all danger action', kind: 'security', summary: 'Moves app-level logout from all devices into a separate full-width danger action at the bottom of the Firebase account section.' },
        { id: 'feedback', title: 'Compact interaction feedback', kind: 'ux', summary: 'Adds disabled states, copy/sync toasts, sync animation and success feedback for touch-first use.' }
      ]
    },
    {
      version: '0.7.3',
      date: '2026-09-18',
      title: 'Semantic Version Guard',
      ref: 'main',
      status: 'archive',
      summary: 'Enforces a semantic-version increase on every push to main so every deployed change has a distinct app version.',
      areas: [
        { id: 'semver-per-push', title: 'Version bump required on every push', kind: 'workflow', summary: 'GitHub Actions now compares the pushed currentVersion with the version at the pre-push main revision and fails deployment unless the new version is valid SemVer and greater.' },
        { id: 'release-discipline', title: 'Patch by default', kind: 'workflow', summary: 'Routine fixes and small changes increment PATCH; backward-compatible feature releases increment MINOR; breaking releases increment MAJOR.' }
      ]
    },
    {
      version: '0.7.2',
      date: '2026-09-18',
      title: 'Focus & Review Reliability',
      ref: 'main',
      status: 'archive',
      summary: 'Makes the review feed account-level rather than browser-specific, preserves a quick Firebase sync indicator, adds a low-distraction focus view, collapsible topic navigation, flippable mastery cards and annotations on the brand/topics area.',
      areas: [
        { id: 'canonical-review-feed', title: 'One permanent review feed', kind: 'repair', summary: 'All devices now publish review notes to the same permanent Firestore capability document used by the GitHub bridge.' },
        { id: 'firebase-sync-indicator', title: 'Firebase sync indicator retained', kind: 'ux', summary: 'The Notes UI keeps its quick signed-in/synced visual status while the separate review-feed state is shown independently.' },
        { id: 'focus-view', title: 'Progressive focus view', kind: 'feature', summary: 'Adds a Focus control that presents one learning block at a time with previous/next navigation and temporarily collapses the topic sidebar.' },
        { id: 'collapsible-topics', title: 'Collapsible topic sidebar', kind: 'feature', summary: 'Desktop topic navigation can be collapsed manually and auto-collapses on narrower desktop layouts or in Focus mode.' },
        { id: 'flippable-mastery', title: 'Flippable mastery cards', kind: 'feature', summary: 'Mastery cards hide their examples until revealed by double-click, keyboard Enter or the explicit reveal button.' },
        { id: 'broader-annotations', title: 'Brand and topics annotations', kind: 'repair', summary: 'Annotation discovery now includes the Beyond 100 brand, Topics sidebar, subject tabs and individual topic controls.' }
      ]
    },
    {
      version: '0.7.1',
      date: '2026-09-17',
      title: 'Learner Identity & Private Context',
      ref: 'main',
      status: 'archive',
      summary: 'Separates Beyond 100 as the app from Sai as the learner, resolves Sai’s existing learner profile in the shared Firebase project, migrates legacy Beyond 100 records, and adds a Firebase-only area for personal school context.',
      areas: [
        { id: 'identity-separation', title: 'App and learner identity separated', kind: 'architecture', summary: 'Beyond 100 remains the application name while learner data is routed to Sai’s existing Firebase learner profile rather than treating sai-beyond100 as a username.' },
        { id: 'learner-resolution', title: 'Existing learner profile resolution', kind: 'data', summary: 'After parent authentication the app resolves Sai from the shared learner catalogue and routes subsequent notes, evidence and sessions to that learner record.' },
        { id: 'legacy-migration', title: 'Legacy Beyond 100 migration', kind: 'data', summary: 'Existing Beyond 100 progress documents under the earlier app-specific learner path are copied into the resolved learner profile without deleting the originals.' },
        { id: 'private-context', title: 'Firebase-only learner context', kind: 'privacy', summary: 'Adds an authenticated private context panel for school/source material, school observations, assessment context, parent observations, priorities and meeting aims without publishing that content in GitHub or the review feed.' }
      ]
    },
    {
      version: '0.7.0',
      date: '2026-09-17',
      title: 'Learning Evidence & Retention',
      ref: '5d40fdcdc3ae281010ec08dbcde5f1f325f90e52',
      status: 'archive',
      summary: 'Turns diagnostic observations into longitudinal evidence: find the first fragile layer, separate knowledge from understanding and recall, require spaced retrieval and transfer before advancing, and build a half-term evidence brief.',
      areas: [
        { id: 'evidence-cycle', title: 'Evidence-gated learning cycle', kind: 'feature', summary: 'Tracks diagnose → teach → demonstrate understanding → practise → retrieve → retrieve again → apply in a new context → advance, with longer retention checks after advancement.' },
        { id: 'response-quality', title: 'Response quality and timing', kind: 'data', summary: 'Records correct + fast, correct + hesitant, understands after prompt, and incorrect / no concept alongside optional response time and K/C/Q/P/F/R/A error causes.' },
        { id: 'first-breakdown', title: 'First breakdown diagnostic', kind: 'feature', summary: 'Adds an A–H Place Value ladder from tens and ones through reasoning so the first layer where fluency or explanation becomes fragile can be identified.' },
        { id: 'five-dimensions', title: 'Five mastery dimensions', kind: 'feature', summary: 'Tracks Knowledge, Understanding, Recall, Application and Retention separately instead of treating one successful attempt as mastery.' },
        { id: 'language-load', title: 'Language-load comparison', kind: 'diagnostic', summary: 'Pairs mathematically similar questions with different verbal demands to distinguish mathematical weakness from question-processing difficulty.' },
        { id: 'half-term-brief', title: 'Half-term evidence plan', kind: 'workflow', summary: 'Builds evidence for secure vs fragile areas, recurring errors, prompting, retention, hesitation, language load and cross-subject patterns, with a copyable meeting brief.' },
        { id: 'long-term-success', title: 'Observable success measures', kind: 'progress', summary: 'Tracks foundations, current-curriculum security, 30-day retention, fluency, reasoning, transfer, independence and speed without using a single test score as the primary target.' },
        { id: 'notes-and-sessions', title: 'Notes and session reliability', kind: 'repair', summary: 'Uses generic annotation discovery, restores native mobile controls, adds contextual Place Value examples and keeps session identity local-first before Firebase sync.' }
      ]
    },
    {
      version: '0.6.0',
      date: '2026-09-16',
      title: 'Static Review Feed',
      ref: 'releases/v0.6.0',
      status: 'archive',
      summary: 'Replaces the Firebase Functions dependency for ChatGPT review notes with a permanent GitHub Pages capability URL backed by one sanitized Firestore review-feed document.',
      areas: [
        { id: 'static-review-page', title: 'Static GitHub review page', kind: 'feature', summary: 'Adds review.html, a permanent GitHub Pages URL that reads the current review snapshot directly from Firestore.' },
        { id: 'review-publisher', title: 'Authenticated feed publisher', kind: 'data', summary: 'While the parent is signed into Firebase, Beyond 100 publishes only notes marked for review into one sanitized capability document.' },
        { id: 'raw-json', title: 'Raw JSON access', kind: 'workflow', summary: 'The review page exposes the direct Firestore REST URL so automated readers can retrieve the same feed without executing page JavaScript.' },
        { id: 'capability-security', title: 'Capability-scoped read rule', kind: 'security', summary: 'Firestore allows get on an exact long random feed ID, forbids collection listing, and keeps writes owner-authenticated.' }
      ]
    },
    {
      version: '0.5.0',
      date: '2026-09-16',
      title: 'Assessment Evidence & Workflow Repairs',
      ref: 'releases/v0.5.0',
      status: 'archive',
      summary: 'Restores visible Notes controls, synchronizes Version Lab scrolling, adds free-form comparison notes and turns uploaded school work into topic-based assessment evidence.',
      areas: [
        { id: 'notes-visibility', title: 'Visible Notes controls', kind: 'repair', summary: 'Repairs the top-bar insertion bug and keeps the Notes label visible on small screens.' },
        { id: 'permanent-review-link', title: 'Permanent ChatGPT notes link', kind: 'workflow', summary: 'Introduces the first reusable review-link UI, later simplified in v0.6.' },
        { id: 'synced-compare', title: 'Synchronized version scrolling', kind: 'feature', summary: 'Scrolling either Version Lab preview moves the other to the same relative position, with a toggle to disable synchronization.' },
        { id: 'comparison-notes', title: 'Notes while comparing', kind: 'workflow', summary: 'Capture free-form change notes against a version pair and include them in the development brief.' },
        { id: 'assessment-evidence', title: 'Assessment evidence by topic', kind: 'content', summary: 'Organizes uploaded Year 4→5 maths work by topic with source pages, working assessment, likely error types and next cold checks.' }
      ]
    },
    {
      version: '0.4.0',
      date: '2026-09-16',
      title: 'Review Link Automation',
      ref: '068b364521175312d6966bb14971f9a93da32192',
      status: 'archive',
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
        { id: 'review-queue', title: 'Review queue', kind: 'workflow', summary: 'Mark notes for review, jump back to the referenced element and copy a structured review pack.' },
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