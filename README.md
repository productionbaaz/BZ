# Baaz Portal — React app (Firebase backend)

Real React project (Vite), backed by Firebase Authentication + Firestore.
GitHub builds and deploys it automatically on every push.

## Why Firebase

Fast, genuinely shared across every device, and edits sync live —
if two people have the same sheet open, they see each other's changes
appear without refreshing. Security (who can see/edit what) is
enforced by Firestore's own rules on Google's servers, not by this
app's JavaScript.

## One-time Firebase setup

1. Go to https://console.firebase.google.com → "Add project" → give it
   any name → finish the wizard (Google Analytics is optional, skip it
   if you want).
2. In your new project: click the **Web** icon (`</>`) to register a
   web app. Give it any nickname, click Register. It shows a
   `firebaseConfig` object — copy the whole thing.
3. Open `src/firebase.js` in this project and paste your real values
   over the `PASTE_...` placeholders.
4. In the Firebase console left sidebar: **Build → Authentication →
   Get started**. Click "Email/Password" under Sign-in method, enable
   it, Save.
5. **Build → Firestore Database → Create database**. Choose
   "Start in production mode", pick any location, Enable.
6. In Firestore, click the **Rules** tab. Delete what's there and paste
   in the entire contents of `firestore.rules` (included in this
   project). Click **Publish**.

That's the whole backend — no server to deploy, no code to run.

## GitHub setup

1. Replace everything in your repo with the contents of this folder
   (all files and folders, including the hidden `.github` folder and
   `.gitignore`).
2. Settings → Pages → Source → "GitHub Actions".
3. Push/commit. Check the Actions tab for the build.

## URLs

- Employee login: `https://<you>.github.io/main/`
- Manager/CEO login: `https://<you>.github.io/main/manager.html`

Sign up once as Owner on the manager URL — this also seeds all the
default sheets automatically. Then use Settings to create employee
accounts and any extra sheets.

## Sharing sheets with anyone by email

In Settings → Manage Sheets, each sheet has a Share icon (the small
three-dots-connected icon). Type an email and pick "Can view" or
"Can edit", click Share. That person doesn't need an employee account —
they go to the Employee Login page and click "Log in or sign up as a
guest" to create a free guest account with that same email. A guest
account by itself grants zero access to anything; it only unlocks
whatever's been explicitly shared with that exact email. The shared
sheet then shows up for them in both the sidebar and the sheet tabs,
same as any other sheet — view-only shares disable editing/adding/
deleting rows and show a "View only" badge.

## Known limitations of this pure-client setup (no server code at all)

- **Employee password reset** sends them a reset-link email instead of
  letting the manager type a new password directly — Firebase's client
  SDK can't set another account's password without a server-side Admin
  SDK, which this setup deliberately avoids to stay server-free.
- **Deleting an employee** removes their profile and all sheet access
  immediately (they're locked out on next login), but their underlying
  Firebase Auth sign-in record isn't fully deleted — same reason as
  above. Harmless, just a residual entry you won't otherwise notice.
- Firebase's free (Spark) tier has generous but real daily limits
  (tens of thousands of reads/writes) — more than enough for a small
  team, but worth knowing if usage ever grows a lot.
