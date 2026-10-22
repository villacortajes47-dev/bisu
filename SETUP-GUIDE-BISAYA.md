# BISU AI REFLECTION GRADER 2026 — BISAYA SETUP

## Unsa ang naa sa website?
- Instructor Google login (imo ra gyud nga email ang tugotan)
- Google Classroom course / assignment / student submission list
- AI checker sa reflection answer nga picture, PDF, Word/DOCX, Google Doc ug TXT
- 100-point reflection rubric; mahimo nimong i-adjust
- Suggested score ug personalized comment (ma-edit nimo)
- Instructor approval sa final score
- CSV export para sa Excel
- Classroom draft grade sync **kung supported sa Google API**

## DILI pa automatic
- Dili automatic ma-post ang private comments sa Google Classroom. Kopyaha ang suggested comment ug i-paste sa Classroom.
- Kasagarang existing assignments nga manually gihimo sa Google Classroom dili tugotan sa Google nga update-an og grade pinaagi sa laing app. Kung mao ni, i-copy ang score ug i-encode manually sa Classroom.
- Dili mapreserba ang approvals kung i-refresh o isira ang tab. I-export ang CSV pirmi.
- Wala pay live Vercel URL hangtod ikaw maoy mo-deploy niini.

## A. Pag-upload sa GitHub
1. I-extract ang ZIP.
2. Adto sa https://github.com/new ug paghimo og **Private repository**: `BISU-AI-Reflection-Grader-2026`.
3. Pilia **uploading an existing file**.
4. I-upload ang TANANG files ug folder sa extracted project (ang sulod, dili kinahanglan ang ZIP).
5. Importante: iapil ang `app/`, `lib/`, `package.json`, `next.config.mjs`, `README.md`, `.env.example`, `.gitignore`.
6. Ayaw pag-upload sa `.env.local` o bisan unsang password ug API secret.
7. Pislita ang **Commit changes**.

## B. Google Cloud (kinahanglan para maka-connect sa Google Classroom)
1. Ablihi https://console.cloud.google.com/
2. Himo og Cloud Project.
3. Sa API Library, i-enable ang **Google Classroom API** ug **Google Drive API**.
4. Sa Google Auth Platform, configure ang OAuth consent screen ug i-add ang imong email sa Test Users, kung Testing status.
5. Pangitaa ang Data Access / Scopes. I-apil ang scopes nga naa sa README.md.
6. Create **OAuth Client**: **Web application**.
7. Authorized redirect URI: `https://IMO-VERCEL-URL.vercel.app/api/auth/callback/google`
8. Kopyaha ang Client ID ug Client Secret, pero ayaw pagpadala og secrets sa public chat.
9. Kung organization Google account, pangayo og authorization sa inyong Google Workspace admin kung kinahanglan.

## C. OpenAI API
1. Ablihi https://platform.openai.com/api-keys.
2. Create API key ug configure billing/budget. Lahi ang API billing sa ChatGPT Plus.
3. Ayaw ibutang ang API key sulod sa GitHub files. Environment Variables ra sa Vercel.
4. Sundon ang privacy policies sa BISU sa dili pa gamiton ang tinuod nga student data.

## D. Vercel
1. Ablihi https://vercel.com/new. Connect imong GitHub account.
2. Import `BISU-AI-Reflection-Grader-2026`.
3. Framework: Next.js.
4. Set Vercel Environment Variables:
   - `NEXTAUTH_URL` = `https://IMO-VERCEL-URL.vercel.app`
   - `NEXTAUTH_SECRET` = long random secret
   - `GOOGLE_CLIENT_ID` = Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET` = Google OAuth Client Secret
   - `ADMIN_EMAIL` = exact imong Google email nga gigamit sa Classroom
   - `OPENAI_API_KEY` = OpenAI API key
   - `OPENAI_MODEL` = `gpt-4.1-mini`
5. Ang secret mahimo gamit sa Terminal: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
6. Deploy. Siguroa nga sakto ang Vercel URL nga nakasulat sa Google Authorized Redirect URI.

## E. Sa pagtudlo / pag-check
1. Login sa website gamit ang imong instructor Google account.
2. Pilia ang class ug reflection assignment.
3. Click student nga **turned in**.
4. Click **Evaluate with AI**.
5. Basaha ang original answer ug i-verify kung sakto ang AI suggested score.
6. Pwede nimo usbon ang final score ug feedback comment.
7. Pislita **Approve final score**.
8. **Copy feedback** ug paste sa Google Classroom private comment manually.
9. Pislita **Try saving draft grade to Classroom**; kung mo-error ug manual entry, ikaw mo-encode sa Classroom.
10. **Export approved grades** sa dili pa i-refresh ang browser tab.

## Importanteng pag-amping
- Dili paghatag og final score gamit sa AI output lamang; i-check sa instructor.
- Ang blurry/illegible photo kinahanglang reupload o manual assessment.
- Kinahanglan school-approved data processing kung real student work na.
- Dili kini hosting ug configuration service. Kini downloadable source project; ikaw o inyong campus IT mao'y mag-set up og Cloud credentials ug deployment.
