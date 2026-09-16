# Beyond 100 — reversible development workflow

This app is developed experimentally. A new change may improve one aspect while making another worse. The workflow therefore optimises for **selective rollback**, not just forward-only releases.

## 1. Treat a release as a human checkpoint

Git commits remain the complete technical history. `versions-data.js` contains the smaller set of versions that are useful to a human comparing the app.

A release should be created when a coherent group of changes is ready to judge, for example:

- a changed syllabus layout;
- a new diagnostic workflow;
- a substantial content model revision;
- notes/annotation behaviour;
- progress tracking or learner modelling.

Do not create a new release number for spelling fixes or invisible refactors unless they materially affect comparison.

## 2. Version numbers

Use semantic-style versions pragmatically:

- **Patch** `0.3.0 → 0.3.1`: small visible correction or content refinement with the same overall workflow.
- **Minor** `0.3 → 0.4`: new feature, meaningful interaction redesign or substantial syllabus/data capability.
- **Major** `1.x → 2.x`: fundamental product/data model change where older assumptions are no longer compatible.

While the product is experimental, `0.x` minor versions are the normal named checkpoints.

## 3. Every release describes change areas

Each entry in `versions-data.js` contains `areas`. Keep these deliberately separable.

Good:

- Progression card layout
- Mastery model
- Diagnostic timing
- Firebase note sync

Bad:

- General improvements
- Lots of UI changes

The Version Lab uses each area as an independent decision unit: **Keep / Revert / Rework / Unsure**.

## 4. Selective rollback rule

When acting on a Version Lab development brief:

- **KEEP** — preserve this implementation unless another requested change strictly requires touching it.
- **REVERT** — restore only this aspect from the comparison/base release; do not revert unrelated files or features.
- **REWORK** — preserve the useful intent but change the specified behaviour/design.
- **UNSURE / UNDECIDED** — keep the current implementation available and avoid irreversible removal.

Never solve one disliked change by blindly resetting the entire repository to an earlier commit.

## 5. Make coherent commits

Prefer commits that each express one reason for change. This makes Git history useful for surgical recovery.

Examples:

- `Refine Y5 Place Value diagnostic prompts`
- `Add response timing to diagnostic questions`
- `Rework progression cards for mobile scanning`

Avoid commits such as `updates` or `changes`.

## 6. Before publishing a named release

1. Update the release version shown by the app.
2. Add the release to `versions-data.js` with a concise summary and separable change areas.
3. Run JavaScript syntax validation.
4. Let GitHub Pages deploy successfully.
5. Preserve the release with an immutable Git commit or `releases/vX.Y.Z` branch.
6. Compare it in Version Lab with the previous named release.

## 7. Development brief workflow

After trying a new release:

1. Open **Version Lab**.
2. Compare current and previous working versions.
3. Mark each change area Keep / Revert / Rework / Unsure.
4. Add precise notes where necessary.
5. Use **Copy development brief**.
6. Give that brief to ChatGPT with an instruction such as: `Action this Beyond 100 development brief.`

The brief explicitly tells the developer to preserve KEEP areas and avoid whole-version rollback.

## 8. Content changes deserve versioning too

The same system should be used when the UI is unchanged but the educational model changes substantially. For example, if the Place Value mastery definition is revised, record **Place Value mastery model** as a change area so the earlier wording remains easy to compare.

## 9. User data is not versioned with the UI

Firebase learner data and notes should remain forward-compatible wherever practical. Historical previews are for comparing application behaviour and content; they should not be used to migrate or overwrite current learner data.
