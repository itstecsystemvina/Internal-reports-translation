# BCCV · S-Tec System

Weekly work reports (báo cáo công việc tuần) with automatic Vietnamese → Korean translation.

- **Employees** sign in with their company email, fill in this week's work and next week's plan, and submit (Thursday–Friday by default).
- **Admins** see a status board (dates across the top, one row per employee, green = submitted, red = not) and open any report to see the original next to its Korean translation. They can fix either side, re-run the translation, and export both versions as Word files.

Built with Next.js, Neon Postgres and Google Gemini.

---

## Deploy to Vercel

1. **Push this folder to GitHub** and import the repository at [vercel.com/new](https://vercel.com/new). Keep the default settings (Framework: Next.js).
2. **Add the database:** in the Vercel project, open **Storage → Create Database → Neon (Postgres)** and connect it to the project. This sets `DATABASE_URL` for you.
3. **Add environment variables** under **Settings → Environment Variables**:

   | Name | Value |
   |---|---|
   | `SESSION_SECRET` | A long random string. Generate one with `openssl rand -base64 32`. |
   | `GEMINI_API_KEY` | A key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). |
   | `CRON_SECRET` | A long random string. Protects the daily translation job (runs 00:05 Vietnam time and translates reports whose deadline has passed). |
   | `DEFAULT_PASSWORD` | Starting password for the first admin and for new employees (at least 6 characters). Keep it out of the repository and share it with staff privately. |

4. **Redeploy** (Deployments → ⋯ → Redeploy). Each deploy creates or updates the database tables and makes sure the default admin exists.
5. Sign in as **tunglam@stecsystem.com.vn** with the `DEFAULT_PASSWORD` you set, then change your password under **Đổi mật khẩu**.
6. Open **Nhân viên → Nhập từ Excel**, choose the staff list (.xlsx), pick the sheet, check the preview and import. Only name, email, department and position are read; nothing else in the file is stored.
7. Open **Cài đặt** and press **Dịch thử** to check that translation works.

## Accounts and passwords

- New employees start with the default password: `DEFAULT_PASSWORD`, or the one saved in **Cài đặt** (which takes over once saved). They can change it themselves after signing in.
- Admins can reset anyone's password back to the default from **Nhân viên**.
- Roles: **Admin** (status board, all reports, employees, settings) and **Nhân viên** (own reports only). Admins can also write their own reports.
- **Cần nộp báo cáo hằng tuần** controls whether a person appears on the status board. It is off for the default admin.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without `DATABASE_URL`, the app uses a built-in file database in `.pglite/` (delete the folder to start over). Put `DEFAULT_PASSWORD=...` (needed to create the first admin) and, to translate, `GEMINI_API_KEY=...` in a `.env.local` file (see `.env.example`).

Never commit staff lists or other spreadsheets: the repository is public. Import them through the app instead.

## Changing the database structure

Edit `lib/db/schema.ts`, then run `npm run db:generate`. This writes a new SQL file to `drizzle/`. Commit it; the next deploy applies it.
