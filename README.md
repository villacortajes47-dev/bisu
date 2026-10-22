# BISU AI Reflection Grader 2026

A teacher-controlled starter web app built with Next.js for **Google Classroom + OpenAI-assisted grading** of Automotive Technology post-reporting reflections. Designed for GitHub -> Vercel deployment.

## What actually works (after configuration)

- Google instructor sign-in (strict `ADMIN_EMAIL` allowlist)
- Import active Classroom courses, existing assignments, rosters, and student submissions
- Fetch up to three readable attached Google Drive files per submission (images, PDF, DOCX, Google Docs, Google Slides, Google Sheets, text)
- Manual image / PDF / DOCX / text upload when Classroom cannot retrieve a submission
- AI-generated suggested rubric scores / editable individual comments using an OpenAI API key
- Instructor can adjust score/comments, then click **Approve** (no automatic grading)
- Export teacher-approved scores and comments as CSV for Excel
- Try saving an **instructor-approved draft grade** through the Classroom API where eligible

## Important limitations — not a one-click production integration

1. **Grade sync to existing assignments may be blocked by Google.** The Classroom `studentSubmissions.patch` API requires that **the same Google developer project created that coursework** (or grade-sync add-on attachment). Existing coursework created manually in Google Classroom is usually ineligible. The app handles this with an explicit *manual entry required* message and calculated points.
2. **No private feedback post through the ordinary Classroom API.** Use **Copy feedback**, open the assignment and paste the comment yourself. Google Classroom does not provide a general student submission private-comment create endpoint in its API.
3. **No persistent database in this starter.** Reviewed and approved results only exist in the current browser tab until refresh/navigation. Export CSV often. For multi-teacher production deployment add a proper encrypted DB and review audit log.
4. Google OAuth and Google Drive read-only scopes are **sensitive/restricted**; Google consent screen test users, Google Workspace administrator approvals, app verification and/or security assessment can apply. Do not publish to a wider audience before completing applicable reviews and privacy controls.
5. **Student privacy:** Get institutional authorization before sharing student work with a third-party AI service. Files are processed by Google and OpenAI in memory and not deliberately persisted by this app. The service providers have their own processing and retention policies; review contracts, settings, lawful basis and your school's rules. Avoid collecting information not needed for grading.
6. **AI is not the final assessor**: teachers need to inspect illegible handwriting, incorrect OCR, false assumptions and overly confident scoring before approval.
7. A paid OpenAI API account and separately billed model usage are needed; a ChatGPT subscription does not automatically supply API credit.
8. Google OAuth testing mode refresh tokens may expire after 7 days, requiring re-login.
9. The starter has no automated background jobs, no automatic student notifications, and no automatic grade release.

## 1. Create Google Cloud project

1. Visit https://console.cloud.google.com/ and create/select a project.
2. Enable **Google Classroom API** and **Google Drive API** in **APIs & Services > Library**.
3. Configure the **Google Auth Platform / OAuth consent screen** and choose the appropriate audience. For external Testing, add the instructor email as a test user.
4. In **Data Access**, register these scopes:
   - `openid`, `email`, `profile`
   - `https://www.googleapis.com/auth/classroom.courses.readonly`
   - `https://www.googleapis.com/auth/classroom.rosters.readonly`
   - `https://www.googleapis.com/auth/classroom.coursework.students`
   - `https://www.googleapis.com/auth/drive.readonly`
5. In **Clients**, create **OAuth client ID** of type **Web application**.
6. Add your redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Vercel: `https://YOUR-PROJECT.vercel.app/api/auth/callback/google`
7. Copy the OAuth Client ID and Client Secret. The school workspace administrator may need to authorize the application.

## 2. Create OpenAI API key

1. Visit https://platform.openai.com/api-keys and create an API key (subject to school policy and approval).
2. Enable API billing as needed and set budget and usage alerts.
3. The starter defaults to `gpt-4.1-mini`, a vision-capable model, but you can change `OPENAI_MODEL` to a supported vision/file-input + structured-output model.

## 3. Run locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your keys, ADMIN_EMAIL, and NEXTAUTH_URL
npm run dev
```

Open http://localhost:3000

Generate a random NextAuth secret using `openssl rand -base64 32` or another secure random generator. Do not expose keys to the browser or commit `.env.local`.

## 4. GitHub & Vercel

1. Create a new **private** GitHub repo (recommended while testing).
2. Upload all project files **except** `.env.local`, `node_modules`, and `.next`.
3. In https://vercel.com/new , import your GitHub repo.
4. Choose the Next.js framework. Add these **server-side** Environment Variables:

| Variable | Example |
|---|---|
| NEXTAUTH_URL | `https://YOUR-PROJECT.vercel.app` |
| NEXTAUTH_SECRET | long random 32+ character secret |
| GOOGLE_CLIENT_ID | from Google Cloud |
| GOOGLE_CLIENT_SECRET | from Google Cloud |
| ADMIN_EMAIL | your instructor Google email |
| OPENAI_API_KEY | from OpenAI API |
| OPENAI_MODEL | `gpt-4.1-mini` |

5. Deploy, then copy your exact `https://...vercel.app/api/auth/callback/google` into the Google OAuth **Authorized redirect URIs**. Deploy again if environment settings change.
6. Sign in using `ADMIN_EMAIL`, select a class and assignment, select a turned-in student, and click **Evaluate with AI**.
7. Check the original reflection and correct any inaccurate rubric suggestions. Click **Approve**.
8. Copy private feedback into Google Classroom. Try saving a **draft grade** or manually enter the calculated grade when restricted.
9. Export approved scores to CSV **before refreshing** the site.

## Student image requirements

- Good lighting; entire sheet visible; legible writing; no heavy blur
- Manual upload: 1–3 files; each <=3MB and <=4MB combined (Vercel request size constraint)
- Classroom Drive imports: up to 3 files, max 8MB/file and 15MB combined (the route is server-to-server)
- A filename or separate text can reveal student names to Google or OpenAI through file metadata. Remove sensitive data from source files where practical.

## Architecture

```
Browser (instructor only)
  -> NextAuth Google OAuth (encrypted HttpOnly JWT session)
  -> Server API for Classroom, student roster, Drive files
  -> Server-only OpenAI Responses API (vision / PDF / DOCX)
  -> Browser review and explicit approval
  -> CSV export / conditional Classroom draft grade API
  -> Feedback copy and manual posting
```

This is an educational starter, **not** yet a fully-audited enterprise or institutional production system. Before real graded use, implement audit logging, school privacy policy/consent workflow, password/key rotation, teacher authorization and operational safeguards appropriate for your environment.
