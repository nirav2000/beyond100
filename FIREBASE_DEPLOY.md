# Firebase setup for Beyond 100 static review feed

Beyond 100 v0.6 no longer requires Firebase Functions for the permanent ChatGPT notes link.

The app publishes a sanitized review snapshot to one document under:

`beyond100_review_feeds/{long-random-capability-id}`

The permanent GitHub Pages URL is:

`https://nirav2000.github.io/beyond100/review.html#<capability-id>`

Only notes explicitly marked **For review** are copied into that feed document.

## One remaining Firebase deployment

The Firestore rules in `nirav2000/Kk-syllabus/firestore.rules` have been updated so:

- only an exact long random feed ID can be fetched anonymously;
- collection listing is forbidden;
- create/update/delete remain restricted to the authenticated parent account;
- the wider learner/progress database remains owner-only.

Those rules still need to be published to the `kk-syllabus` Firebase project once.

### Option A — Firebase Console

1. Open Firebase Console → `kk-syllabus` → Firestore Database → **Rules**.
2. Replace the rules with the current contents of `nirav2000/Kk-syllabus/firestore.rules`.
3. Click **Publish**.

### Option B — Firebase CLI

From an authenticated checkout of `nirav2000/Kk-syllabus`:

```bash
npx firebase-tools deploy --only firestore:rules --project kk-syllabus
```

No Firebase Functions deployment is required for the v0.6 review feed.

## After publishing the rule

1. Open Beyond 100.
2. Sign in under **Notes → Firebase sync** if necessary.
3. Under **Permanent ChatGPT review page**, click **Create / publish**.
4. Copy the generated `review.html#...` URL and give it to ChatGPT once.
5. Keep adding notes normally. While the app is open and authenticated, the review feed is refreshed automatically.

Treat the capability URL like a password. Use **Replace** or **Revoke** in Beyond 100 if it is ever shared accidentally.
