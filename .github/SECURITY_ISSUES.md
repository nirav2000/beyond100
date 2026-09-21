# Beyond 100 Security Issues Log

This file records known security/privacy trade-offs that are intentionally accepted, deferred, or awaiting hardening. It is a GitHub-only engineering log and is not part of the in-app help.

## SI-001 — Persistent bearer link for the parent controller

**Status:** Accepted for convenience  
**Introduced:** v0.9.1  
**Scope:** Sai learner profile / Beyond 100 parent-controller functions  
**Automatic expiry:** None  
**Revocation:** Manual only, using **Disconnect controller** in Beyond 100

### Design

Beyond 100 can create a cryptographically random 256-bit controller key. The key is embedded only in the URL fragment of the parent-controller link:

`parent.html#control=<random-key>`

The same key remains valid across Focus sessions for the linked learner profile. Scanning the QR code or opening the link does not require a second Firebase login.

The key is a bearer capability: possession of the complete link is sufficient to use the permitted parent-controller functions.

### Intended permissions

The capability must be restricted to the dedicated controller document and may:

- read current Focus state for the linked learner;
- submit a limited set of Focus commands;
- update controller-presence metadata.

It must not provide general access to learner progress documents, assessment evidence, Notes, Firebase credentials, other learners, or collection listing.

### Known concerns

1. **No automatic expiry.** A copied or photographed controller link remains usable until explicitly revoked.
2. **Forwarding risk.** Anyone who obtains the full QR/link can use the permitted parent controls.
3. **Device persistence.** Browser history, screenshots, shared messages, backups, or bookmarks can retain the link.
4. **Public app code.** The implementation is public, so security must rely on the randomness and scoped Firestore rules, not obscurity.
5. **Revocation dependency.** The user must use Disconnect controller if a device or link is no longer trusted.

### Current mitigations

- 256-bit random token generated with `crypto.getRandomValues`;
- token placed in the URL fragment rather than query parameters;
- no token committed to GitHub;
- Firestore collection listing must be denied;
- unauthenticated access must be limited to the exact high-entropy document ID already known;
- controller writes must be limited to an allow-list of Focus commands/presence fields;
- owner-authenticated app remains the only party allowed to create, rotate, revoke, or alter the capability identity;
- revocation invalidates all copies of the existing QR/link;
- QR generation is local in the browser, not sent to an external QR service.

### Future hardening options

These are deliberately deferred rather than enabled now:

- per-device subkeys beneath the account-level controller;
- optional expiry/rotation;
- device approval and device list;
- read-only versus full-control capability levels;
- additional confirmation for particularly sensitive future commands;
- audit log of controller devices and commands.

## Review rule

Any future feature that widens what a bearer controller can read or change should add or update an entry here before widening the Firestore capability rules.
