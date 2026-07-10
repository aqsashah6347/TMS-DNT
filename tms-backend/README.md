# TMS Backend — Setup Guide (start to finish)

This connects to your existing React frontend. Follow these steps in order.

## 1. Install SQL Server (if you don't already have it from the CRM project)

You likely already have this set up for DreamsPortal CRM. If so, skip to step 2 —
you can reuse the same SQL Server instance, just with a new database.

If not: install **SQL Server Express** (free) and **SSMS** (SQL Server Management
Studio) so you have a UI to run SQL scripts and look at tables.

## 2. Create the database

1. Open SSMS, connect to your local SQL Server.
2. Open `src/db/schema.sql` from this folder, run it (F5). This creates the
   `tms_db` database and every table.
3. Open `src/db/seed.sql`, run it. This adds 3 test users, a team, a project,
   and 2 tasks so you have something to see immediately.
   - Every seeded user's password is `Password123`.

## 3. Configure your environment variables

1. Copy `.env.example` to a new file called `.env` in this same folder.
2. Fill in `DB_USER`, `DB_PASSWORD`, `DB_SERVER` to match your SQL Server login
   (same values you use for the CRM project).
3. Leave everything else as-is for local development.

**Never commit `.env` to GitHub** — it has secrets in it. It's already covered
by a sensible `.gitignore`.

## 4. Install dependencies and run the server

```bash
cd tms-backend
npm install
npm run dev
```

If everything is right, you'll see:
```
✅ Connected to SQL Server: tms_db
🚀 TMS backend running on http://localhost:5000
```

Visit `http://localhost:5000/api/health` in your browser — you should see
`{"status":"ok"}`. That confirms the server itself works, even before you
touch the database.

## 5. Connect your frontend

Nothing to change! `axiosInstance.js` already points to
`http://localhost:5000/api`, which is exactly where this server runs.

1. Start your frontend as usual (`npm run dev` inside `task-system`).
2. Go to the login page and log in with `aqsa@example.com` / `Password123`.
3. Since that seeded user doesn't have 2FA turned on, you'll be logged in
   directly. To test the OTP flow, set `two_factor_enabled = 1` for a user in
   the database, log in with them, and watch your **backend terminal** — the
   OTP code gets printed there (no real email is sent yet).

## 6. How the pieces fit together (for when you get lost)

```
Frontend request  →  routes/*.js        (which URL maps to which function)
                   →  middleware/auth.js (checks your login token first)
                   →  controllers/*.js  (the actual logic + SQL query)
                   →  config/db.js      (the shared database connection)
```

Every route file follows the same shape as your CRM's `LeadController.js`
patterns you already know: `pool.request().input(...).query(...)`.

## 7. What's built vs. what's next

**Fully working:** login + OTP 2FA, tasks (create/read/update/soft-delete +
completion stats), projects, teams, notifications, and basic user/admin
management.

**Not built yet** (these existed as empty files or mock-only stores in your
frontend, so there was no contract to match yet):
- Real-time chat (`inbox/chat`) — this needs WebSockets (Socket.io), which is
  a bigger topic on its own. Happy to build this next as a separate step.
- Full analytics endpoints beyond completion stats (workload distribution,
  overdue metrics) — these are just more SQL queries on the same `tms_tasks`
  table; I can add them once you tell me which chart needs real data first.
- Fine-grained permission enforcement (`tms_permissions` table exists, but no
  routes check it yet — right now only `role === "admin"` is enforced).

My suggestion: get steps 1–5 working first so you can log in and see real
tasks. Then come back and we'll wire up projects/teams/notifications in your
frontend (their `api/*.js` files are currently empty), one at a time.
