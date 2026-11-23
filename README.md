# Asan Sarf & Nahw — Quiz Academy

A free, public, responsive Arabic grammar quiz website built from **four existing question banks**. No account, database, API keys, npm installation, or server-side application is needed.

## What is included?

| Book | Quiz sections | Questions |
| --- | ---: | ---: |
| Asan Sarf I | 36 | 270 |
| Asan Sarf II | 27 | 286 |
| Asan Nahw I | 31 | 230 |
| Asan Nahw II | 61 | 380 |
| **Total** | **155** | **1,166** |

The existing JSON banks have been copied **without editing the question content**. The four original PDFs are included so each question can link to its scanned source page.

## Features

- Mobile-friendly Arabic/Urdu-first interface, with cover images and dark mode
- Book dashboard and searchable/filterable lessons
- Four answer choices, immediate explanations and feedback
- Lesson results, answer review and retry
- Local-only progress tracking (the browser's `localStorage`)
- Export and import progress backup in JSON format
- Original PDFs with links to the relevant source page
- Fully static files; public access without authentication

**Privacy note:** Progress is saved on each person's browser/device. It is *not* synchronized across devices, and it can be lost if their browser storage is cleared. Users can export a progress backup from **میری پیش رفت**.

## Run locally

Do not double-click `index.html`, because browsers restrict loading local JSON via `file://`. Run any basic local HTTP server from the extracted ZIP's top-level folder:

```sh
python -m http.server 8000
```

Open <http://localhost:8000>.

Alternatively, if you have Node.js installed:

```sh
npx serve .
```

No build process is required.

## Deploy from GitHub to Vercel

1. Create a new GitHub repository, for example `asan-sarf-nahw-quizzes`.
2. Extract this ZIP. **Upload the contents of the extracted directory to the repository root**. You must see `index.html` at the root, alongside `assets/`, `books/`, `data/`, and `vercel.json`.
3. Go to <https://vercel.com/new>, sign in, and import that GitHub repository.
4. Set **Framework Preset** to **Other**. Leave the **Build Command empty** and set **Output Directory** to `.` (project root) if Vercel requests it. No environment variables are needed.
5. Select **Deploy**. Vercel provides a public `*.vercel.app` URL. Future GitHub commits trigger new deployments automatically.

Quick terminal option if you're comfortable with Git:

```sh
git init
git add .
git commit -m "Initial Asan Sarf and Nahw quiz academy"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/asan-sarf-nahw-quizzes.git
git push -u origin main
```

Then import it into Vercel as above. Make sure you created the empty GitHub repository first.

### Alternative: deploy without GitHub

At <https://vercel.com/new> (or Vercel Drop if available in your account), you may deploy static files directly. This project is designed primarily for the GitHub → Vercel workflow.

## File structure

```text
index.html               Main website
assets/
  app.js                 Front-end quiz logic
  styles.css             Responsive styles
  favicon.svg            Site icon
  covers/                Four book covers
books/                    Four original scanned PDFs
data/                     Four original JSON question banks
tests/validate-banks.mjs  Content validation (optional Node 22+)
vercel.json               Static site headers/config
robots.txt
README.md
.gitignore
```

## Validate source data

With Node 22+ installed:

```sh
node tests/validate-banks.mjs
```

This checks all 1,166 questions for four distinct options, a valid answer, explanation, and a source-page reference within its PDF.

## Customization

- Rename the site or edit navigation text in `index.html`.
- Edit styles and colors in `assets/styles.css`.
- Update the book display metadata in the `CATALOG` array in `assets/app.js`.
- Maintain the original schema in `data/*.json` when adding or editing questions.

## Source material and publication

The question banks and scans are derived from the four files provided for the educational project. **Before publishing the included scanned PDFs and any text publicly, confirm that you have permission to distribute those materials.** If PDF redistribution is not permitted, remove the `books/*.pdf` files and the PDF links in the UI before deploying, or substitute your own licensed source content.

Quizzes are educational adaptations; they are not guaranteed to reproduce every printed exercise verbatim. For scholarly review, consult the original textbook and verify Arabic orthography and tashkeel as needed.
