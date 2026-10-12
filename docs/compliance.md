# Scoped privacy record checks

Checked 12 October 2026. New Zealand diligence records can contain staff and customer personal information. The operator decides the purpose, access controls and retention policy with their advisers. No command grants data-room access, deletes evidence or certifies legal compliance.

- **IPP5-review:** [Privacy Commissioner, principle 5](https://www.privacy.org.nz/privacy-principles/5/) requires reasonable safeguards against loss, misuse and unauthorised disclosure. The check lists documents whose next access review is missing or due. A review date is an internal control reminder, not a statutory deadline or proof that storage is secure.
- **IPP9-purpose:** [Privacy Commissioner, principle 9](https://www.privacy.org.nz/privacy-principles/9/) limits retention to the period needed for a lawful purpose. Personal documents without a recorded purpose need review.
- **IPP9-review:** The same source informs a check for missing or due retention review dates. No fixed number of days is prescribed here. The operator records the next review date, considering legal holds and transaction obligations. The system never deletes records automatically.

Run `npm run diligence -- compliance --json`. Each result includes the source URL. `review-document` records the operator's review purpose and next review dates. An empty result only means these fields pass these checks. It says nothing about cross-border disclosure, consent, statutory transaction approvals, access enforcement or overall compliance. This build does not calculate merger thresholds or give a deal approval opinion.

The independent request-review and signing checks are our workflow controls, not claimed legal requirements. The operator's actor label is attribution, not authentication. PostgreSQL row security is enabled and public grants revoked. Shared installations need reviewed roles and backup arrangements. Original documents stay in the operator's controlled storage; this system keeps locations and metadata only.
