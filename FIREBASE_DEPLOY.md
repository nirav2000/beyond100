# Firebase Functions deployment for Beyond 100 review links

The Beyond 100 permanent ChatGPT review-link UI depends on three Firebase Functions that live in `nirav2000/Kk-syllabus/functions/`:

- `createBeyond100ReviewLink`
- `revokeBeyond100ReviewLink`
- `beyond100Review`

The existing Kk-syllabus GitHub Actions workflow only tests the Functions and deploys GitHub Pages. It does **not** deploy Firebase Functions.

Until those Functions are deployed to the `kk-syllabus` Firebase project, the permanent ChatGPT notes link can error even though the source code and GitHub Pages builds are green.

## One-time/manual deployment

From an authenticated checkout of `nirav2000/Kk-syllabus`:

```bash
npx firebase-tools deploy --only functions:createBeyond100ReviewLink,functions:revokeBeyond100ReviewLink,functions:beyond100Review --project kk-syllabus
```

After deployment, create the permanent link from Beyond 100 > Notes > Permanent ChatGPT notes link and reuse that URL in ChatGPT.

## CI option

A future GitHub Action can deploy these automatically, but only after a suitable Firebase/Google Cloud deployment credential is configured as a GitHub Actions secret or workload identity. Do not add a long-lived credential to source code.
