# Bring a DealRoom request register across

The supported switch is your diligence request register, not a complete hosted data room. First migrate an empty database and create your real deal with `add --type=deal`. Do not seed a production database.

1. In DealRoom, use the request or request-progress export available to your account. The [vendor help guide](https://dealroom.net/resources/help-guides/dealroom-help-guides) documents request reports exported to Excel. Check permissions and select the full request list, not an aggregate chart.
2. Save the worksheet with one request per row as UTF-8 CSV. Keep its stable request identifier and original columns. Convert dates explicitly to YYYY-MM-DD. The public guide does not guarantee universal column headings. Inspect your own export before mapping it.
3. Run the import once with `--dry-run` and an explicit mapping where headings differ. The included example is synthetic and is not a vendor export specimen.
4. Check counts, dates and owners, then repeat without `--dry-run`. Compare every request against the source before ending the old subscription.

```bash
npm run diligence -- import dealroom --file=examples/dealroom-requests.csv --deal="Project Kauri" --actor="Migration operator" --dry-run
```

Defaults accept Request ID/ID/Key, Request/Title/Name, List/Category/Workstream, Assignee/Assigned to/Owner, Due Date/Due, and Priority. ID, name, workstream, owner and due date are required. Priority accepts normal, high or critical, default normal when blank. Use `--mapping=examples/column-mapping.json` for other headings. Mapping keys are source_id, name, workstream, owner, due and priority. Names match without case sensitivity. CSV handles quoted commas, line breaks and doubled quotes. Empty, duplicate headings, uneven rows and invalid dates fail. A malformed batch rolls back in full.

The importer retains every source column in a snapshot. Requests start open, including source requests marked Completed. Review their response evidence locally. Identical repeated imports skip. Changed source rows fail for explicit reconciliation and do not overwrite local work. IDs are scoped to each deal. Download and retain your original files separately. Comments, attached file contents, permissions, watermarks, NDA records, source audit logs and approvals do not transfer through this importer. Enterprise DNA can scope those migrations and the controlled file-sharing system separately.

`export --out=exports/backup.json` writes all local records, notes and history without overwriting an existing file. It is an archival backup, not an input for the vendor CSV importer. Recovery requires a reviewed database restore procedure. Keep exports confidential.
