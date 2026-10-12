# Due Diligence for Claude Code

The fictional demo is Harbour Acquisition Partners. Read records before advising. Never present demo records as actual transaction evidence.

- Run the matching .claude/commands recipe through npm run diligence. All runtimes share this CLI.
- Stay on main. Never change repository visibility, send, publish or delete records.
- Every write requires --actor. It is an attribution label, not authentication.
- A response needs supporting evidence before independent review. Reopening clears prior evidence and review; history retains the recorded change.
- Signoff requires all requests approved and no open high or critical findings. It records an internal decision, not a legal approval or executed transaction. Integration tasks continue afterwards.
- Original documents stay in controlled storage. Locations and review dates here do not enforce external file access.
- Read docs/compliance.md before interpreting privacy prompts. Review dates are operator-set, not statutory deadlines.
- Import uses a request-level CSV saved from the vendor Excel report. Map headings and dry-run first. Never treat source Completed as local approval.
- Keep database files, exports, drafts and credentials out of git. Use one embedded writer.
- Back up before schema changes. Never edit an applied migration. Test changes on disposable data first.
- TEST_DATABASE_URL is only for a fresh disposable database. Tests ignore the normal DATABASE_URL.

## Files

scripts/diligence.mjs is the CLI. supabase/migrations holds schema changes. scripts/lib/db.mjs chooses PostgreSQL or PGlite. views.json and documents.json control private reports. brand.json sets the business name, logo and colours. AGENTS.md routes every coding agent here.

## Commands

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

/customise: Back up, write the next migration, update all queries and tests, test on disposable data, then migrate within the authorised change.
/new-view: Add a read-only query and render it privately. No server or editing buttons.
