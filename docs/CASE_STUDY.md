# JobBoard: a role-based job board, built and shipped end to end

**Live demo:** https://job-board-rho-green.vercel.app · **Code:** https://github.com/leobertcamoro101-lab/JobBoard

## What it is

A job board with two roles. Employers post jobs, review applicants, and move each application through a pipeline (pending, reviewed, accepted, rejected). Job seekers browse and search, apply as a guest or logged in, keep a profile and resume, and watch the status of every application. I built it to practice the whole path from database to deployment, instead of stopping at a tutorial app that only runs on localhost.

## Stack

React, Vite and TypeScript on the frontend, with Tailwind CSS, TanStack Query, Zustand, React Hook Form and Zod. Laravel with Sanctum token auth and PostgreSQL on the backend. Vercel hosts the frontend, and Railway hosts the API, the database and a volume for uploads. GitHub Actions runs the tests.

## Decisions worth explaining

**Authorization lives in the API, not the UI.** The interface hides things an applicant shouldn't see, such as the Post a Job button and the employer dashboard, but that is only cosmetic. The API checks every protected action itself. Only a job's owner can edit it, delete it, list its applicants or change an applicant's status. Posting requires the employer role. A resume link appears for an employer only if the applicant allowed it. Writing tests for these rules surfaced a real gap: the "create job" endpoint only required a login, so an applicant's token could post jobs. It now checks the role, and a test pins that down.

**One users table with a role.** Instead of separate applicant and employer tables and guards, there is one `users` table with a `role`, plus a profile table for each role. Login, tokens and password handling are written once, and the role decides what each person can reach.

**A stateless two-step signup.** Signup is split in two: account details, then a file upload plus an optional emailed code. My first version kept the step-1 details in the PHP session. That failed as soon as I tested the endpoints with cURL, because each request arrived without the cookie, and it wouldn't be reliable between two domains anyway. I moved the pending data into a `pending_registrations` table (JSON payload plus an expiry), so each step is an independent request. An environment switch turns the emailed code off. I don't own a domain yet, and the email provider only delivers to the account owner until one is verified.

**Frontend structure.** One shared Zod schema drives each form and its types. TanStack Query handles server state and refreshes it after changes, and Zustand holds the auth state. A small bridge module lets the Axios 401 handler reset auth state without a circular import. Route guards are role-aware, and login sends you back to the page you were trying to reach. Pages are lazy-loaded, with a loading boundary and an error screen for stale chunks after a deploy. Shared Card, Modal and Avatar components keep the screens consistent, and the avatar falls back to initials if an image fails to load.

## Production problems I had to debug

**Migrations that "ran" on the wrong database.** `railway run php artisan migrate` reported "Nothing to migrate" while production had no `role` column. My CLI was linked to the Postgres service, which exposes `PGHOST`-style variables, but Laravel reads `DB_HOST`-style names. So it silently fell back to my local `.env`. Two pieces of evidence settled it: `config:show` printed my local host, and a direct `psql` query through the database proxy showed the real table was empty. I ran the migrations from my machine with explicit connection overrides instead. The lesson I took away is to check which database a command is touching before trusting its output.

**A constraint hidden in a column.** Accepting an applicant failed in production with a check-constraint error, even though the column looked like plain text. Laravel's `enum()` on Postgres creates a hidden `CHECK`, and the original migration allowed `shortlisted` where my app used `accepted`. I found it by querying `pg_constraint` and replaced it with a migration that also mapped the old data.

**Uploads that vanished.** Resumes disappeared after redeploys because the container's filesystem is ephemeral, and the `public/storage` symlink doesn't exist on a fresh deploy because it's gitignored. I attached a Railway volume at `storage/app/public` and create the symlink on boot.

## Quality and safety

- **[Tests: 14 passed] feature tests** run against a real PostgreSQL database: ownership rules, applying, signup, profile and password changes. The base test class refuses to run unless the database name ends in `_test` and the host is local, so a misconfigured run can never wipe development or production data. 
- Wrote a Playwright end-to-end test covering the full hiring flow, and ran it in GitHub Actions alongside [45] API feature tests on every push. 
- Isolated end-to-end runs on a throwaway Postgres database and API, with a guard that aborts if they ever touch real data.
- Form labels and error messages are programmatically linked to their fields, and Playwright tests check it.

- **CI** runs the API tests on a Postgres service container and type-checks and builds the frontend on every push.
- **Rate limiting** applies to login, signup, code confirmation and resend, keyed by email and IP. That needed two production settings: trusting Railway's proxy so Laravel sees real visitor IPs, and a persistent cache store, since counters on the `array` store reset on every request.
- **Passwords and uploads:** strength rules are enforced on the client and the server. Changing a password requires the current one and signs out other devices. Uploads are validated by type and size, and replaced files are deleted.

## Known limitations

Email verification is off in the demo, and there is no password reset by email yet, since both need a verified sending domain. Uploaded resumes sit on a public disk under unguessable file names. One Playwright test drives the whole hiring flow in a browser (employer signs up and posts, applicant signs up with a resume and applies, employer accepts, applicant sees the decision). It runs against its own throwaway API and database, and a guard test aborts the run if the API ever points at data it didn’t create.

## How I worked

I built this with AI assistance (Claude), using it for scaffolding, code review and debugging, while making the design decisions and running and verifying everything myself. [Keep, reword or remove this section, but be ready to explain any file in the repo in an interview.]