# Due Diligence for Claude Code

Keep acquisition requests, evidence reviews, deal risks and handover actions in a database you own. Know what still blocks the signing review.

## Three ways to run it

- **Do it yourself.** Use the MIT-licensed free version with Claude Code, Codex, OpenCode or Cursor. You arrange database hosting, agent usage, backups and controlled document storage.
- **We customise it.** Enterprise DNA brings your DealRoom request history across, adds your review rules, fields and the screens your team needs. One setup fee, then an agreed retainer for ongoing work.
- **We run it for you.** Omni by Enterprise DNA installs, connects, backs up and operates your version. One setup fee, then a monthly retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=dealroom&utm_medium=readme).

## Try fictional data

```bash
npm install
npm run demo
npm run diligence -- request-chase
npm run diligence -- review-queue --json
npm run view
npm run docs
```

Requires Node 20 or newer. Without DATABASE_URL, PGlite keeps records in .data/db. Set DATABASE_URL for PostgreSQL with the same migrations. Row security is enabled and public access revoked. A shared deployment needs reviewed identities and roles. --actor records a name; it does not authenticate it. Run one embedded writer at a time. Real document contents remain in separately controlled storage.

## The weekly work

Chase unanswered requests, review submitted evidence, discuss red flags, prepare the signing decision and track integration work. Submission and review are separate. A reviewer cannot approve their own submission. Reopening clears the previous response and approval while recording the operation in history. Signoff locks the diligence requests and findings; integration tasks, privacy reviews and notes continue. The internal signoff is not legal advice or an executed acquisition.

- /deals: Review all deal records
- /requests: Read requests and source snapshots
- /request-chase: Chase unanswered requests
- /review-queue: Review submitted evidence
- /red-flags: Review unresolved major findings
- /findings: Read all findings
- /closing-readiness: Check the signing review
- /integration-week: Review handover work
- /documents: Read document locations and review dates
- /compliance: Check scoped privacy record prompts
- /owner-load: Count open requests and overdue work
- /workstreams: Compare requests by workstream
- /stale: Find requests untouched for 30 days
- /attention: Read overdue requests, risks and handover tasks
- /history: Read the last 100 local operations
- /deal: --deal=...
- /search: --text=...
- /add: --type=deal|request|finding|task|document --name=... --actor=... (see README for fields)
- /submit: --request=... --response=... --evidence=... --actor=...
- /review: --request=... --note=... --actor=... (independent from submitter)
- /reopen: --request=... --reason=... --actor=...
- /resolve: --finding=... --resolution=... --actor=...
- /complete: --task=... --evidence=... --actor=...
- /review-document: --document=... --purpose=... --access-review=YYYY-MM-DD [--retention-review=YYYY-MM-DD] --actor=...
- /signoff: --deal=... --decision=... --actor=...
- /log: --deal=... --note=... --actor=...
- /import: dealroom --file=export.csv --deal=... --actor=... [--mapping=file.json] [--dry-run]
- /export: --out=exports/backup.json
- /weekly-review: Write a private review draft
- /draft-request: --request=...
- /draft-decision: --deal=...
- /help: Show commands

/customise changes the system through a migration. /new-view adds a private read-only report. Every CLI command supports --json. Dates use YYYY-MM-DD. Names match without case sensitivity; partial IDs work, and ambiguous matches list candidates and exit 1. No command sends or publishes.

## Add records

Every add needs --type, --name and --actor. Required fields by type:

| Type | Required fields | Optional fields |
|---|---|---|
| deal | target, owner, close-date | thesis |
| request | deal, owner, due, workstream | priority: normal, high or critical |
| finding | deal, owner, due, severity, detail | none |
| task | deal, owner, due | none |
| document | deal, owner, location | personal=true or false, purpose, access-review, retention-review |

Flags use --field=value. Quote values with spaces. A document record is a location and review metadata, not an uploaded file.

## Ten questions your diligence records answer

These queries work today. DealRoom has its own reporting; we do not claim it cannot answer equivalent questions.

- Which unanswered requests are furthest overdue? `request-chase`
- Which responses still need independent review? `review-queue`
- Which deals combine unapproved requests and major findings? `closing-readiness`
- Which high-risk findings need a decision before signing? `red-flags`
- Which owners carry the most overdue requests? `owner-load`
- Which workstreams have the biggest approval backlog? `workstreams`
- Which handover actions are overdue after signoff? `integration-week`
- Which requests have gone untouched for thirty days? `stale`
- Which personal documents need a purpose or retention review? `compliance`
- Who reopened a request and why? `history`

## Your first hour: ten things to ask for

1. Put our name and logo on the decision pack.
2. Show requests overdue before the proposed signing date.
3. Show evidence awaiting independent review.
4. Explain the unresolved major findings.
5. Record a reviewed response with its evidence location.
6. Draft the weekly diligence review.
7. Show the handover work by owner.
8. Add our investment committee reference through a migration.
9. Change our internal signoff rule and test it.
10. Test our exported request list before saving it.

## Bring your request register across

```bash
npm run diligence -- import dealroom --file=examples/dealroom-requests.csv --deal="Project Kauri" --actor="Migration operator" --dry-run
```

The example is fictional. For real use, migrate an empty database and create your real deal first. Save the vendor Excel request report as UTF-8 CSV, inspect the columns and map different headings explicitly. The [switch guide](docs/replace-dealroom.md) explains supported fields and exclusions. Identical imports skip, changed source rows fail for explicit reconciliation, and malformed batches roll back. Source statuses remain snapshots, never local approvals. Attachments, permissions, comments and historical approvals need separate migration.

## Documents, privacy checks and backups

Set brand.json once. npm run docs renders a decision pack and an integration handover plan per deal. npm run view renders the diligence week and the integration/privacy review. Outputs stay in docs-out/, views/ and drafts/. [Why no front end](docs/why-no-front-end.md) explains the scope. This free base is an operator-managed register, not a hosted virtual data room or certified file-sharing service.

The compliance command checks documented purpose, access review and retention review fields. [Sources and limits](docs/compliance.md) cite NZ privacy principles 5 and 9. An empty check is not legal certification.

export --out=exports/backup.json archives all seven record groups including history, without overwriting an existing file. A backup contains confidential records. Recovery needs a reviewed restore process; the vendor importer does not restore backups.

## Validation

npm test uses a temporary database and checks every CLI command, review/signoff guards, import rollback, repeats, mappings, CSV edge cases, dates, ambiguity, private drafts, backups and escaped HTML. CI runs Linux and Windows on Node 20 and 22 plus PostgreSQL 17. Local test results and remote CI results are reported separately.

MIT licence. Independent of DealRoom. Product names belong to their respective owners. [Research and scoring](docs/research.md).
