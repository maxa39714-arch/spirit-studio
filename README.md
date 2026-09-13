# Spirit Studio — Setup & Testing

## ⚠️ Important: don't just double-click the HTML files
This site uses Firebase (Google Sign-In, Firestore) and JavaScript modules.
Both require the site to be served over http/https — opening files directly
(file:///...) will break login and data loading.

## Option A — Quick local test
```
npx serve .
```
or
```
python -m http.server 8000
```
Then open the printed URL (e.g. http://localhost:8000) — not a file:// path.

## Option B — Deploy for real (recommended)
```
npm install -g firebase-tools
firebase login
cd spirit-studio
firebase deploy --only hosting,firestore:rules
```
This gives you a live `https://anime-56524.web.app` URL.

## Before testing admin login
In Firebase Console:
1. **Authentication** → Sign-in method → enable **Google**
2. **Firestore Database** → Rules → paste `firestore.rules` → **Publish**
   (this is required — without it you'll get "Missing or insufficient
   permissions" when creating a series)

## No Firebase Storage needed
This project does **not** use Firebase Storage / file uploads (Google now
requires the paid Blaze plan just to enable Storage, even for free-tier
usage). Instead:
- **Poster / Banner** → paste an image URL (host images anywhere — Imgur,
  your own server, etc.)
- **Episode video** → paste a link and choose:
  - **Direct video link** (a link ending in a playable video file) →
    plays inside Spirit Studio's own built-in player
  - **Embed link** (an iframe URL from a video host like Streamtape) →
    plays inside that host's embedded player

## How content goes live
Everything on the site — home page, genres, trending, latest, series pages,
episodes — reads directly and in real time from Firestore. The moment the
admin creates a series or adds an episode in `admin.html`, it appears on
every device automatically — no manual refresh, no fake/sample data anywhere.

## Page map
- `index.html` — entry: Continue as Viewer / Continue as Admin (Google)
- `home.html` — live homepage (hero, trending, latest, genre rails)
- `genres.html` — browse all series by genre tab
- `trending.html` / `latest.html` — full live listings
- `series.html?id=...` — series detail + episode list
- `watch.html?id=...&ep=...` — video player (own player or embed)
- `admin.html` — protected admin panel:
  1. Create a series folder (title, genres, synopsis, banner URL, poster URL)
  2. Select that series from the list
  3. Add episodes into it (paste a video link, choose direct or embed)
