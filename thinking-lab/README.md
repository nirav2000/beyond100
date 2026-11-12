# Maths Thinking Lab

Original curriculum-linked visual and structural reasoning lessons. The module is intended to open from Beyond 100's Thinking Lab navigation.

Practice history is role-scoped so parent rehearsals do not count as learner achievement. Twenty original randomised technique templates map to the canonical maths skills catalogue. No external API is required.


## Explain-your-thinking routine

Every Thinking Lab technique includes a four-stage language ladder:

1. **Have a go**: describe what changed and explain *why* the result works; add an equation, diagram or fact if possible.
2. **Compare**: reveal two model explanations only after the learner writes both a description and a reason. One model uses everyday words and the other uses precise maths terminology.
3. **Improve**: revise the original explanation using appropriate mathematical words; the first draft is retained.
4. **Try new numbers**: complete a similar calculation and explain the reason again, ideally without copying the model.

The six question words are explicitly defined:

- **Describe** — tell what happened or the steps taken.
- **Explain** — state what happened *and why*; give a mathematical reason.
- **Why?** — give a mathematical fact or rule that makes something true.
- **How?** — give a method or explain how a relationship works, according to the question.
- **Justify** — support an answer with evidence or a mathematical argument.
- **Prove** — show that something must be true in general, not just for one example.

The *Keep the total* experiment runs before the language ladder. After predicting and moving 1, the learner tries **729 + 21 → 730 + 20**. Only then can they reveal model explanations. Independent follow-up uses **38 + 197**, **48 + 27** and **47 + 53**, with equivalent friendly-number alternatives accepted.

### Assessment and storage

- Calculations and free-text reasoning are assessed separately. A correct calculation is **not** automatically evidence of a correctly explained reason.
- The first description, first reason, optional evidence, revised response, whether models/help were seen and the new-example attempt are kept separately. Parent Academy shows first and revised answers with support indicators.
- Role-scoped drafts are stored in localStorage using the keys beyond100.thinking-lab.v1.explanations.learner and beyond100.thinking-lab.v1.explanations.parent alongside the existing practice history.
- The existing Beyond 100 evidence hook records practice outcomes. **Written explanation text stays on this device** in this release; explanation-draft cloud syncing is not yet connected.
- The six-question printable practice sheet now asks for **what happened**, **why**, and supporting **evidence**, with a separate parent answer page.

### Tests

The unit suite checks all techniques, glossary words and transfers. The GitHub Actions browser suite checks the first-draft → compare → improve → new-example flow at mobile and desktop widths.

### Live-app entry point and navigation

The production Beyond 100 homepage now loads `thinking-lab/main.mjs` and shows an **Open Maths Thinking Lab** button. Inside the fullscreen Lab, a persistent journey map provides shortcuts for **Explore**, **Explain your thinking**, **Question words** and **Parent review**. The six command-word definitions are available before the compensation task is complete; the child's first writing prompt becomes available after applying 729 + 21. Comparison answers are intentionally learner-controlled. A production-page integration test (not merely the teaching fixture) checks all entry points.


## Experimental question-breakdown comparison (branch only)

Branch: experiment/math-thinking-question-scaffolds
Entry point: thinking-lab/preview.html (standalone, no sign-in required).

This branch preserves the existing *Current way* explanation coach and adds an optional
*New: break the question down* pathway. They use the same real Maths Thinking Lab
prediction, draggable compensation experiment, 729 + 21 application and follow-up.
Switch methods inside the lab to compare them without replacing either first draft.

**New guided pathway:**
1. Select a command word (Describe / How / Why / Explain / Justify / Prove) and
   read its child-friendly instruction.
2. Independently answer the question before receiving any help, or explicitly
   request guidance. Do not expose model solutions automatically.
3. Answer one small question at a time. Sentence starters, hints, model step
   examples and skip-a-step help are optional and are recorded separately.
4. See the small answers alongside an editable combined explanation using
   "because", "so" and "therefore". The draft shows placeholders for anything
   missing instead of inventing a reason.
5. Reveal the everyday-language and mathematical-language models, improve
   your own explanation and attempt a transfer calculation with new numbers.

For *Why?* on **Keep the Total**, choose between:
- "Why is the NEW addition easier?" (multiples of 10; 730 + 20 requires
  no regrouping in this particular sum);
- "Why does the sum stay the same?" (equal gain/loss in different addends).

Other thinking techniques use a different general scaffold keyed to the
chosen command word, rather than copying the compensation prompts. The six
types have distinct definitions and prompts; **Prove** adds a general-rule
challenge with a caveat that one example does not establish proof.

Guided and current approach drafts have different IDs in the existing role-
scoped on-device learning history, without adding arithmetic mastery attempts.
Parent Academy identifies which pathway was used, keeps the component
responses and help history and separately rates description, the choice of
strategy, mathematical validity, evidence and mathematical vocabulary.
No AI grades free-text mathematical reasoning; correctness still requires
parent review.

**Preview:** Open the branch's preview.html through a static HTML preview
service (e.g. raw.githack.com with the commit SHA). This is a third-party
code preview, may show an HTML confirmation, and should not be used for
signing in or storing sensitive information. The preview has a safe,
standalone fixture and stores test writing locally, not in production Firebase.

The original GitHub Pages site is not modified by this experimental branch.
The GitHub Actions tests cover the original coach, both-way compensation,
guided question breakdown, parent review and standalone preview in mobile
and desktop browser sizes.
