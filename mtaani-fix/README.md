# MtaaFix

MtaaFix is a neighbourhood issue reporting app with an Express API and a shared SQLite database.
Its shared visual system includes a locally served community-unity background image.

## Run locally

Use Node.js 20 or newer.

```sh
npm install
npm start
```

Open `http://localhost:3000`. The server binds to `127.0.0.1` by default and creates `data/mtaafix.sqlite` on first run. Keep the database file private; it is excluded from Git.

## Accounts and administrator access

Create a regular account at `/pages/register.html`. Passwords must be at least 12 characters.

### Location catalog and local administrators

The database models configurable administrative levels and parent-child location units. Resident registration, report visibility, administrator assignments, resident counts, and local announcements use those relationships; residents are not assigned by free-typing a county or ward.

A local starter catalog is included at `seeds/kenya-administrative-units.json` for development and demo work. Replace it with a verified Kenya county → sub-county → ward source before public deployment, because the app validates all 47 counties, level coverage, source metadata, and parent-child relationships before enabling location signup. Global OCHA boundary downloads that list countries (ADM0) are country outlines, not Kenya county/ward lookup data. The [HDX Kenya COD-AB dataset](https://data.humdata.org/dataset/cod-ab-ken) is a separate, Kenya-specific source; it covers only administrative levels 0–2 and describes itself as non-official, so it still cannot satisfy the required ward hierarchy.

The catalog format is JSON with `source` metadata (`title`, `url`, `license`), ordered `levels` (`key`, `label`, `parentKey`, `sortOrder`, `residentRegistration`), and `units` (`code`, `levelKey`, `parentCode`, `name`). Startup validates all 47 counties and the parent-child relationships before enabling location signup. Users with an older account can set their location on the report page after the catalog is installed.

Once an authoritative catalog is installed, a trusted operator can approve a registered account and assign its exact administrative path from the project directory. Record the approving operator and, where appropriate, a short verification note:

   ```sh
   npm run admin:promote -- person@example.com "Kiambu > Kiambaa > Ruaka" "Chief" "Project operator" "Verified appointment"
   ```

The administrator title is a configurable label; it is not hard-coded to “Chief”. Assignments may target a county, sub-county, ward, or another configured level. Approval, approver, verification note, assigned unit, title, and timestamp are recorded; each CLI approval is also retained in the audit history. Every administrator API requires a matching approved assignment; changing an assignment without its approval does not grant access. Sign out, then sign in again.

Residents can edit their name, optional phone number, and neighbourhood; their report history remains attached to each report’s original area. In-app notifications are private to their recipient and cover new reports for approved local administrators, report status changes for the reporting resident, and local announcements for residents in the assigned area. The administrator dashboard includes resident/report counts, issue-category totals, and monthly status totals for the assigned area. Reports and local notices are scoped to the resident’s registered unit and relevant parent administration; hiding a page link is not access control.

## Report follow-up

New reports receive a sequential tracking number such as `MTF-2026-00001`; existing reports keep their original IDs. Residents can search for a report by its tracking number on the community board and open its status timeline and evidence.

Reports can include up to three JPEG, PNG, or WebP photos (1.5 MB each), an optional priority, and optional exact coordinates. Location sharing requires an explicit browser permission request. Exact coordinates and attached photos are shown only to residents of the report's ward and its reporting resident/assigned administrator as applicable; coordinates are visible only to the report owner and assigned administrator. Photos are stored in the SQLite database, so keep database files and backups private.

The community board can be searched by report ID, category, location, status, priority, and date range. Residents in the same ward can support a report once per account or flag it as fake, spam, inappropriate, or a duplicate. Flags go to the assigned area's administrators for review; duplicate reports are flagged for human review and are not automatically merged.

Administrators can change priority and status, add an optional action note, reply privately to the reporting resident, and see reports grouped by ward and local area. Every status change records its time and actor in the permanent report timeline. The timeline also shows submission, first review, resolution, and resident confirmations. Residents in the same ward can message only on their own reports, and can vote yes/no after an administrator marks a report resolved. Votes are limited to one per resident and can be updated.

Residents can attach up to three before photos. Administrators can add up to three after photos from report details. Area administrators can review or dismiss resident flags, filter reports by category, priority, status, and date, and see overdue issues, average resolution time, totals, issue-category trends, and local hotspots. The dashboard marks unresolved reports older than 14 days as overdue. A problem hotspot is shown when at least three reports for the same category and local area were created in the last 30 days. These thresholds are simple operational defaults, not statutory service targets.

The report form is responsive for mobile use and warns residents that MtaaFix is not an emergency service. Immediate or life-threatening emergencies should be directed to the appropriate local emergency service. Local administrators can publish notices to residents in their assigned area; those notices appear on the community board and generate in-app notifications.

## Deployment notes

For a public deployment:

- Set `NODE_ENV=production` and `APP_ORIGIN` to the exact public HTTPS origin.
- Set `DATA_DIR` to persistent storage; local SQLite data must not live on an ephemeral service filesystem.
- Set `ALLOW_REGISTRATION=false` until the location catalog is verified against an authoritative source.
- Serve the app over HTTPS. Session cookies are marked `Secure` in production.
- If the app is behind one trusted reverse proxy, set `TRUST_PROXY=1`. Do not trust arbitrary client-supplied proxy headers.
- Configure the host and port using `HOST` and `PORT`; back up the SQLite database on persistent storage securely.
- Decide who is allowed to receive administrator access and promote accounts only from a trusted server operator shell.

The repository-root Render Blueprint in `../render.yaml` configures the Node web service, a persistent
SQLite disk, HTTPS/proxy settings, a health check, and disabled public registration.
Render supplies `RENDER_EXTERNAL_URL`, which the app uses as its production origin
unless `APP_ORIGIN` is explicitly set. The included location catalog is demo-only;
public registration should remain disabled until a verified dataset is installed.

This starter does not provide email verification, password reset, SMS/email notifications, or account deletion.
