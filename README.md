# CoachNow

A sports coaching marketplace for Dubai — parents find and book coaches,
coaches manage their schedule and earnings, admins oversee the platform.

## Backend: Firestore (shared, real-time) + real Firebase Authentication

Bookings, coaches, and the user signup directory are stored in **Firestore**
(Firebase's cloud database), not the browser. A booking made on one phone
shows up immediately on any other device — no refresh needed.

Login/signup uses **real Firebase Authentication** — actual email/password
accounts, not a fake check. Config lives in `src/lib/firebase.ts`.

Collections:
- `coaches` — every coach's profile (sport, price, hours, etc.)
- `bookings` — every booking, with live status/payment updates
- `users` — a profile document per account (name, phone, role), keyed by
  that person's real Firebase Auth user ID

The first time the app ever runs against an empty database, it seeds itself
with the 8 demo coaches and 8 demo bookings automatically.

### One-time setup: enable Email/Password sign-in

1. Firebase Console → your project → **Build → Authentication**.
2. If you haven't already, click **Get started**.
3. Go to the **Sign-in method** tab → click **Email/Password** → toggle it
   **Enabled** → **Save**.

### One-time setup: create the 3 demo accounts

The "Parent Demo / Coach Demo / Admin Demo" buttons on the login page need
real accounts to exist in Firebase Auth (the app can't create these for you
automatically — that needs admin access this app intentionally doesn't have).

In Firebase Console → **Authentication → Users → Add user**, create these
three, all with the password `demo123`:

| Email | Password |
|---|---|
| `parent@demo.com` | `demo123` |
| `ahmed@coach.com` | `demo123` |
| `admin@coachnow.ae` | `demo123` |

You only need to do this once. The first time each one logs in, the app
automatically creates their profile (name, role) in Firestore — you don't
need to set anything else up manually.

### Security rules

`firestore.rules` in this repo contains real, auth-based rules — not the
wide-open "anyone can read/write" rules from before. Apply them: Firebase
Console → **Build → Firestore Database → Rules** → paste the contents of
`firestore.rules` → **Publish**.

**Honest limitation worth knowing:** writes (creating/editing a booking or
profile) are fully locked down to the right person. Reads are gated on
"must be logged in" rather than "must be *your* data" — that's because the
app currently fetches whole collections and filters in the browser, and
Firestore can't partially filter an open collection query via rules (a
`list` request is either fully allowed or fully denied). So a signed-in
person could theoretically read other people's bookings/contact info if
they wrote custom code to do it, even though the app's own interface never
lets them. Fully closing that gap means rewriting the data-fetching to use
scoped queries (e.g. `where('parentId', '==', uid)`) instead of "fetch
everything and filter in JavaScript" — a bigger change, worth doing before
this handles a lot of real customer data, but not blocking for now.

### Verifying it actually works

1. Open the live site, register a real (non-demo) account, confirm it logs
   you in and lands on the right dashboard.
2. Log out, log back in with the same email/password — should work.
3. Try a wrong password — should show "Incorrect email or password",
   not crash.
4. Open the live site on a second device, book a test session as Parent
   Demo, then check Admin → Bookings on the first device — it should be
   there.

## Local development

```bash
npm install
npm run dev
```

## Deploy

Push to GitHub, import into Vercel (auto-detects Vite). No environment
variables needed — the Firebase config is intentionally public (that's
normal for Firebase web apps; real security comes from the rules above and
from Authentication, not from hiding the config).

