# AGENTS.md — propellus-site-preview

Instructions for coding agents (Codex, Claude Code, etc.) working in this repo.
Owner of deployment and the propellus.ai switchover: **Mehsum** (`mehsum@propellus.co`).

## What this repo is

A static HTML/CSS/JS marketing site for Propellus. There's no build step and no package manager.
**The live site root is whichever was updated most recently: the newest dated release folder or the repo root.**

The deploy compares the last git commit that touched the **newest dated folder** with the last git commit that
touched the **root site files** (everything except dated folders, `.github/`, `AGENTS.md` and `.nojekyll`), and publishes
the more recent one at `/`. If a single commit touches both, the folder wins. Logic: `.github/scripts/pick-site-dir.sh`.

- **Release a new version as a folder:** add a complete copy of the site in a new folder named
  `<mon><DD><YYYY>-updated/` (for example `dec012026-updated/`), with `index.html` at its top level, and push to `main`.
  It is published at `/`, never at `/<folder>/`.
- **Or update the root:** edit the root files (`index.html` and the rest) and push. If that's the most recent change,
  the root is published.
- **Folder name rules:** a three-letter lowercase month (`jan` to `dec`), a two-digit day, a four-digit year, then
  `-updated`. Folders that don't match, or that have no `index.html`, are ignored. Only the newest dated folder counts:
  editing an older dated folder does nothing.
- **Watch out:** after a root edit goes live, a later commit that touches the newest folder (even a small fix) switches
  the live site back to that folder. Keep working in one place, or copy changes into both.
- **Rolling back:** push a fix to whichever source is live, or delete or rename the newest folder.
- Dated folders are never served under their own path. `.git/`, `.github/` and this `AGENTS.md` are never served.
- Every deploy writes `/deploy-version.txt` (commit ID and source folder) so you can check what's live:
  `curl https://main.dp4asw0uk11mm.amplifyapp.com/deploy-version.txt`

## How deployment works today

Pushing to `main` deploys the site automatically. No human or agent needs to do anything.

- **On push to `main`:** deploys right away.
- **Every 10 minutes:** a scheduled check redeploys if the live `deploy-version.txt` doesn't match `main`.
  This catches commits pushed with `[skip ci]`, which suppresses the push trigger. Such commits go live within about 10
  minutes (GitHub's schedule can lag). Avoid `[skip ci]` if you want deploys right away.
- **Manual:** **Actions** tab → "Deploy to AWS Amplify" → **Run workflow** (or
  `gh workflow run deploy-amplify.yml --ref main`).

| Item | Value |
|---|---|
| AWS account | `164793262137` (prod.propellus) |
| Region | `ap-southeast-1` |
| Amplify app | `propellus-site-preview`, app ID `dp4asw0uk11mm` (manual-deploy app, not Git-connected) |
| Branch / URL | `main` → https://main.dp4asw0uk11mm.amplifyapp.com |
| Workflow | `.github/workflows/deploy-amplify.yml` |
| Deploy role | `arn:aws:iam::164793262137:role/propellus-site-preview-amplify-deploy` |
| Role permissions | inline policy `amplify-deploy`: `CreateDeployment`, `StartDeployment`, `GetJob`, `ListJobs` on this app only |
| Auth | GitHub OIDC provider `token.actions.githubusercontent.com` (no stored AWS keys or repo secrets) |

On push to `main`, the workflow:
1. Picks the most recently updated source: the newest dated folder or the repo root.
2. Assumes the deploy role through OIDC and zips that folder.
3. Calls `amplify create-deployment`, uploads the zip, then calls `start-deployment`.
4. Polls until the job reaches `SUCCEED`.

Check results in the repo's **Actions** tab. If a run fails, the live site keeps its previous version.

### Gotcha: OIDC subject format

This repo uses GitHub's **immutable OIDC subject** format, which includes owner and repo IDs.
The deploy role's trust policy must match it exactly:

```
repo:mehsum-Propellus@186271546/propellus-site-preview@1443989663:ref:refs/heads/main
```

Check it with:

```
gh api repos/mehsum-Propellus/propellus-site-preview/actions/oidc/customization/sub
```

The plain `repo:mehsum-Propellus/propellus-site-preview:...` form is rejected with
"Not authorized to perform sts:AssumeRoleWithWebIdentity". If the repo is renamed or
transferred, update the trust policy.

### Why it isn't a native Amplify Git connection

The setup was done by a collaborator with write (not admin) access. Amplify's native GitHub
connection needs repo admin to install its webhook. The repo owner (Mehsum) **can** switch to a native
connection; see "Optional: switch to a native Amplify Git connection" below.

## propellus.ai is served by this repo (switchover done 2026-11-18)

`propellus.ai` and `www.propellus.ai` were moved to Amplify app `dp4asw0uk11mm` (this repo) on **2026-11-18 at 05:08 UTC**.
Pushes to `main` now update https://propellus.ai directly.

| Item | Value |
|---|---|
| Domain association | `propellus.ai` on app `dp4asw0uk11mm`: apex and `www` → branch `main`, status `AVAILABLE` |
| CloudFront | `d1xy7x1cezitcw.cloudfront.net` (apex A alias + `www` CNAME in Route 53) |
| Certificate | Amplify-managed, `*.propellus.ai` + `propellus.ai` |
| Previous app | `propellus-website` (`d1stqdxblqjwws`, repo `propellus-org/propellus-website`): **kept as a fallback, with no domain attached** |

Don't delete `propellus-website` without explicit approval. Keep it for at least a week after the switchover in case a rollback is needed.

The Route 53 hosted zone `propellus.ai.` (`Z08827602C5OK0ZE45J8N`) holds **many unrelated
production records**, including a `*.propellus.ai` wildcard, MX/SPF/Google verification TXT records,
`admin`, `agency`, `supplier`, `api`, `partner`, `travel`, `dev`/`qa`/`uat` environments, and NS delegations
for `prod.propellus.ai` and `v3.propellus.ai`. The switchover changed **only** the apex A alias and the `www` CNAME
(confirmed by a full zone diff: 160 records before and after). Don't edit or delete anything else.

## One-time AWS CLI setup (Mehsum's machine)

Prerequisite: Frank creates Mehsum's IAM Identity Center user and assigns it access to account
`164793262137`. Mehsum then accepts the emailed invite and sets a password and MFA. If no invite has
arrived, stop and ask Frank.

Then, on Mehsum's machine (the agent can run these, and Mehsum clicks "Allow" in the browser):

```bash
# Install the AWS CLI v2 if it's missing (macOS)
brew install awscli

aws configure sso --profile propellus-prod
#   SSO session name:        propellus
#   SSO start URL:           https://d-96676cd646.awsapps.com/start
#   SSO region:              ap-southeast-1
#   Scopes:                  (press Enter for default)
#   -> browser opens: sign in as mehsum@propellus.co and approve
#   Account:                 164793262137
#   Role:                    (the permission set Frank assigned)
#   Default region:          ap-southeast-1
#   Output format:           json

export AWS_PROFILE=propellus-prod
aws sts get-caller-identity   # Account must be 164793262137
```

When the session expires, run `aws sso login --profile propellus-prod`.

Always confirm `aws sts get-caller-identity` shows account `164793262137` before you make changes.

## Switchover runbook (completed 2026-11-18; kept for reference and rollback)

The cutover took about 4.5 minutes from detach to `AVAILABLE`. The steps below are what was run.

Do this **only when Mehsum/Frank give the go-ahead**. Agree on a time window first: expect
a few minutes to roughly 30 minutes of the domain being unavailable or showing certificate errors
while Amplify re-issues the certificate.

### 0. Preflight (read-only)

```bash
export AWS_PROFILE=propellus-prod AWS_REGION=ap-southeast-1
NEW=dp4asw0uk11mm   # propellus-site-preview
OLD=d1stqdxblqjwws  # propellus-website (current propellus.ai)
ZONE=Z08827602C5OK0ZE45J8N

aws sts get-caller-identity --query Account --output text          # 164793262137
aws amplify list-domain-associations --app-id $OLD                  # propellus.ai should be here, AVAILABLE
aws amplify list-domain-associations --app-id $NEW                  # should be empty
curl -sI https://main.$NEW.amplifyapp.com | head -1                 # 200: the new site is healthy

# Back up the current state for rollback
mkdir -p ~/propellus-switchover-backup
aws amplify get-domain-association --app-id $OLD --domain-name propellus.ai \
  > ~/propellus-switchover-backup/old-domain-association.json
aws route53 list-resource-record-sets --hosted-zone-id $ZONE \
  > ~/propellus-switchover-backup/propellus.ai-zone.json
```

Stop if anything differs from what's described above (for example, the domain is already on another app,
or the new site isn't returning 200), and report it to Mehsum/Frank.

### 1. Detach the domain from the old app

```bash
aws amplify delete-domain-association --app-id $OLD --domain-name propellus.ai
# Wait until it disappears:
aws amplify list-domain-associations --app-id $OLD
```

Amplify may remove the apex/`www` records it manages. **Don't delete any other records yourself.**

### 2. Attach the domain to the new app

```bash
aws amplify create-domain-association --app-id $NEW --domain-name propellus.ai \
  --sub-domain-settings prefix=,branchName=main prefix=www,branchName=main
```

The hosted zone is in the same account, so Amplify creates the certificate-validation CNAME and
the apex/`www` records automatically.

### 3. Watch until AVAILABLE

```bash
aws amplify get-domain-association --app-id $NEW --domain-name propellus.ai \
  --query 'domainAssociation.{status:domainStatus,reason:statusReason,subs:subDomains[].{p:subDomainSetting.prefix,verified:verified,dns:dnsRecord}}'
```

Statuses progress through `CREATING`, `PENDING_VERIFICATION`, `PENDING_DEPLOYMENT`, then `AVAILABLE`. Poll every
minute or so. If it sits in `PENDING_VERIFICATION` for more than about 30 minutes, check that the validation CNAME
in `certificateVerificationDNSRecord` exists in the zone.

### 4. Verify

```bash
dig +short propellus.ai
dig +short www.propellus.ai
curl -sI https://propellus.ai | head -1
curl -sI https://www.propellus.ai | head -1
curl -s https://propellus.ai | grep -o '<title>[^<]*'
# Should match the title in this repo's index.html
```

Also open both URLs in a browser and confirm the certificate is valid.
Spot-check that unrelated subdomains still resolve, for example `dig +short admin.propellus.ai` and
`dig +short api.propellus.ai`. Compare against the backup.

### Rollback

To roll back to the old site, reverse the steps: move the domain back to the old app.
Expect another 5-minute gap. Frank has backups of the pre-switchover state in `~/propellus-switchover-backup/` on his machine.

```bash
aws amplify delete-domain-association --app-id $NEW --domain-name propellus.ai
# wait until it's gone, then:
aws amplify create-domain-association --app-id $OLD --domain-name propellus.ai \
  --sub-domain-settings prefix=,branchName=main prefix=www,branchName=main
```

Then repeat step 3 against `$OLD`. Use `~/propellus-switchover-backup/` to compare DNS state.

### After a successful switchover

- Leave the `propellus-website` app in place (without the domain) for at least a week as a fallback.
  Delete it only with explicit approval.
- Pushes to `main` in this repo now update https://propellus.ai directly.

## Optional: switch to a native Amplify Git connection

Mehsum is the repo owner, so he can connect Amplify to GitHub directly instead of using
the Actions workflow. **Do this before or well after the switchover, not during it.**

1. In the Amplify console (account `164793262137`, `ap-southeast-1`), choose **Create new app**, then
   **GitHub**, authorize as the repo owner, and pick `mehsum-Propellus/propellus-site-preview` on branch `main`.
   It's a static site, but the build must still publish the **newest dated folder** as the root. In `amplify.yml`, set a
   build command that runs `DIR=$(bash .github/scripts/pick-site-dir.sh)` and copies `$DIR` to a `dist/` folder, then use
   `dist` as `baseDirectory`.
2. Confirm the new app's `main.<newAppId>.amplifyapp.com` URL serves the site.
3. Point the domain (or the switchover runbook) at the new app ID instead of `dp4asw0uk11mm`.
4. Remove the now-redundant pieces:
   - Delete `.github/workflows/deploy-amplify.yml` (commit to `main`).
   - Delete the IAM role `propellus-site-preview-amplify-deploy` and its inline policy.
   - Delete Amplify app `dp4asw0uk11mm`.
   - Delete the GitHub OIDC provider **only if** no other IAM role trusts it. Check with
     `aws iam list-roles` and look for `token.actions.githubusercontent.com`.

## Rules for agents

- Keep the site static: no build tooling unless a human asks for it.
- Never commit AWS credentials, tokens, or `.env` files. This repo is **public**.
- Run `aws sts get-caller-identity` before any AWS change, and confirm account `164793262137`.
- Get explicit human approval before you change DNS, Amplify domain associations, or IAM.
