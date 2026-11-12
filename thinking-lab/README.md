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
