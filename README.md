# CoachNow

A sports coaching marketplace for Dubai — parents find and book coaches,
coaches manage their schedule and earnings, admins oversee the platform.

## Backend: Firestore (shared, real-time)

Bookings, coaches, and the user signup directory are stored in **Firestore**
(Firebase's cloud database), not the browser. This means a booking made on
one phone shows up immediately on any other device — no refresh needed.

Config lives in `src/lib/firebase.ts`. The relevant collections:

- `coaches` — every coach's profile (sport, price, hours, etc.)
- `bookings` — every booking, with live status/payment updates
- `users` — a directory of everyone who's registered or logged in, used by
  the Admin → Users page

The first time the app ever runs against an empty database, it seeds itself
with the 8 demo coaches and 8 demo bookings automatically — you don't need
to add anything manually.

### Security rules

Firebase's "test mode" rules **expire automatically after 30 days**, after
which the database denies all access and the site breaks. The file
`firestore.rules` in this repo contains a replacement that doesn't expire.

To apply it: Firebase Console → your project → **Build → Firestore
Database → Rules** → paste the contents of `firestore.rules` → **Publish**.

**Important caveat:** these rules are intentionally open (anyone with the
project's public config can read/write). That's because the app's
login system is a simple demo-style check, not real Firebase
Authentication — so Firestore has no way to verify "is this person actually
an admin" yet. This isn't a regression: the app had no real server-side
security before this either. The proper long-term fix is wiring up real
Firebase Authentication so rules can check `request.auth` and restrict
writes by role. Worth doing before this handles real customer payments
data at scale.

### Verifying it actually syncs across devices

After deploying:
1. Open the live site on your phone, book a test session as the "Parent
   Demo" account.
2. Open the live site on a completely different device (or a different
   browser, or an incognito window) and log in as "Admin Demo" →
   Bookings. The booking from step 1 should be there.

## Local development

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub, import into Vercel (auto-detects Vite). No environment
variables needed — the Firebase config is intentionally public (that's
normal for Firebase web apps; real security comes from the rules above,
not from hiding the config).
