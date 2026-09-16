# ChatGPT review link

Beyond 100 v0.4 adds an expiring capability URL for reviewing Firebase-backed developer notes without sharing the parent Firebase login.

## Intended workflow

1. Add contextual notes in Beyond 100 and leave **Include in ChatGPT review queue** enabled.
2. Open **Notes → ChatGPT review link**.
3. Choose an expiry of 1–30 days and create a link.
4. Give that URL to ChatGPT with an instruction such as: `Review and action the safe Beyond 100 notes at this URL.`
5. The JSON feed contains only pending Beyond 100 review notes plus their stable anchors/text context.
6. After a requested change is committed and validation/deployment succeeds, ChatGPT can request the note's `actioned` status. The first status URL is read-only and returns a short-lived confirmation URL; only opening that second URL writes the status.
7. Back in the app, use **Sync note statuses** to merge the updated Firebase state.

## Security model

The review link is a bearer capability: possession of the link is sufficient to access the review feed until expiry/revocation. Treat it like a temporary password.

The capability:

- exposes only documents tagged `app: beyond100`, `kind: note` and still marked for review;
- does not expose the Firebase password, ID token or general database access;
- stores only a SHA-256 hash of the capability token in Firestore;
- expires after 1–30 days;
- can be revoked from the Beyond 100 Notes panel;
- sends `no-store`, `noindex` and `no-referrer` response headers;
- uses a two-step, 10-minute confirmation for write actions so a link preview/scanner cannot mark a note complete merely by opening an action URL.

Supported review states are:

- `actioned` — requested app change completed; removes the note from the pending review feed;
- `needs-user` — clarification or a decision is required; remains in the review feed;
- `open` — reopen a note for work.

## Firebase Functions

The HTTP/callable functions live in `nirav2000/Kk-syllabus/functions/beyond100-review.js` and are exported by that project's `functions/index.js`.

The Kk-syllabus repository currently deploys its GitHub Pages site automatically but does **not** automatically deploy Firebase Functions. The function code therefore needs to be published to the existing `kk-syllabus` Firebase project before the app's **Create review link** button can work.

From an authenticated Firebase CLI checkout of `nirav2000/Kk-syllabus`, the narrow deployment is:

```bash
npx firebase-tools deploy --only functions:createBeyond100ReviewLink,functions:revokeBeyond100ReviewLink,functions:beyond100Review --project kk-syllabus
```

This selective deployment leaves the existing `explain` function untouched.

## JSON response shape

The feed uses `schema: beyond100-review-v1` and returns:

- generation and expiry timestamps;
- repository/app identity;
- workflow instructions;
- pending note count;
- each note's ID, status, note text, semantic anchor, selected text, element context, section/topic, app version and timestamps;
- scoped request URLs for `actioned`, `needs-user` and `open`.

The status request URL returns a separate short-lived `confirmUrl`. A status is not changed until that confirmation URL is deliberately opened.
