<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e476a830-8206-4eca-8e06-30bdeadde17a

## Run Locally

**Prerequisites:** Node.js 22.5 or later (for the built-in SQLite driver)


1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set your private API keys there.
3. Run the app:
   `npm run dev`

## Deploy to Render

The Render blueprint for this app is `akiba-ai-studio/render.yaml`. In Render,
create a Blueprint from this repository and set the Blueprint Path to
`akiba-ai-studio/render.yaml`; the repository-root blueprint configures a
different app. The service builds with `npm install && npm run build` and runs
with `npm start`.

The blueprint provisions a Starter web service with a 1 GB persistent disk
mounted at `/var/data`, so SQLite data survives service restarts. Render charges
for the service and persistent disk. Before using password recovery, set
`APP_URL` to the service's public HTTPS URL and configure `RESEND_API_KEY` and
`RESEND_FROM` with a verified sender. Set `GEMINI_API_KEY` to enable Gemini
features. Enter these values directly in Render's environment settings; never
commit them to the repository.

## Account recovery email

Akiba account access runs through the Express server. For password recovery,
configure Resend in a private `.env` file (do not commit it):

```env
APP_URL=http://localhost:3000
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM="Akiba <accounts@your-verified-domain.com>"
AKIBA_DATA_DIR=data
```

Verify the sender domain in Resend before using its address. In production, set
`APP_URL` to the public HTTPS origin and `RESEND_FROM` to a verified sender.
Keep `AKIBA_DATA_DIR` on persistent storage so accounts survive restarts. Start
the app with `npm start`; local development uses the same server with `npm run
dev`. The server loads `.env.local` first, then `.env`, and does not override
environment variables already supplied by the host. Restart the server after
changing either file. If Resend is not configured, the recovery form reports which
email settings are missing rather than pretending to send a message.

Reset links expire after 30 minutes and can only be used once. Account
passwords are stored as salted scrypt hashes in SQLite.

## Database

The SQL migration at `server/migrations/001_initial_schema.sql` creates users,
chamas, memberships, contributions, loans, payouts, and audit_logs, plus
sessions, announcements, and meetings. A membership is unique per
`(chama_id, user_id)` and holds that user's chama-specific role and status.
SQLite prepared statements use bound parameters for values.

The database file defaults to `data/akiba.sqlite`; set `AKIBA_DB_PATH` to
override it. Keep the database and its WAL files on persistent storage. On
first start, the app imports existing `data/accounts.json` account and chama
records into one chama and leaves that legacy file untouched.

## Backend RBAC

`server/rbac.js` exports `requireRole(allowedRoles)`. Authentication resolves
the current session's active chama membership from the database, and the
middleware checks its role on every protected API request. Admin-only examples
include `/api/admin/members`, `/api/admin/contributions`, `/api/admin/loans`,
`/api/admin/payouts`, and `/api/admin/settings`; unauthorized members receive
HTTP 403 and `You do not have permission to perform this action.`

The shared `/api/auth/login` verifies the password and returns active
memberships. If the user belongs to multiple chamas, the UI asks which one to
open; the response then includes `user.role` and `user.activeChama`. Switching
the selected chama rechecks the user's active membership server-side.

Successful login returns a chama-scoped context, for example:

```json
{
  "user": {
    "id": "user-id",
    "name": "Amina",
    "email": "amina@example.test",
    "role": "treasurer",
    "membershipId": "membership-id",
    "activeChama": { "id": "chama-id", "name": "Chama A" }
  },
  "memberships": [
    { "chamaId": "chama-id", "chamaName": "Chama A", "role": "treasurer", "status": "active" },
    { "chamaId": "other-id", "chamaName": "Chama B", "role": "member", "status": "active" }
  ]
}
```

Server routes compose authentication with the reusable role middleware, e.g.
`authenticate, requireRole(['admin'])`; the admin member, contribution, loan,
payout, and settings routes use that guard. The SQLite queries filter against
the active `chama_id` from the authenticated membership, not a caller-supplied
chama ID.

The `member` role can see its own profile, contribution and loan history,
announcements, and meetings, and can submit contributions and loan
applications. Financial corrections are updated through admin endpoints and
create audit entries; transaction rows cannot be deleted. Admin-only changes,
applications, reviews, and settings updates are recorded in `audit_logs`.

The least-privilege default for `treasurer`, `secretary`, and `chairperson` is
the member permission set until additional duties are explicitly defined.
Only `admin` receives management routes. This avoids inferring elevated rights
from a job title.

The first account created bootstraps the first chama admin. Thereafter an
admin creates accounts and assigns chama roles from the member directory.
Existing users can have separate roles in each chama.

## Frontend access guards

There is one shared login form. It routes `admin` users to the management
dashboard and other roles to the member dashboard. `src/components/utils/rbac.ts` contains
the frontend route/permission helpers; these only control presentation. The
backend remains authoritative, so hiding a control never substitutes for API
authorization.

The app's route decision follows this pattern:

```ts
if (authenticatedUser && !canAccessRole(authenticatedUser.role, ['admin'])) {
  return <MemberDashboard onLogout={logout} />;
}
// Continue to the admin dashboard only for role=admin.
```

## Testing

`npm test` exercises two-chama membership selection, distinct roles for one
user in different chamas, protected API responses, member write restrictions,
private-data scoping, audit logging, transaction deletion prevention, and
single-use password recovery. `npm run lint` checks the TypeScript frontend;
`npm run build` verifies the production bundle.
