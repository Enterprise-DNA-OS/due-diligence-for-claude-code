-- Include stable deal IDs in privacy reports and expose post-signoff handover status.
create or replace view integration_week as select t.id,d.name as deal,t.name,t.owner,t.due,greatest(current_date-t.due,0) as days_overdue,d.state as deal_state from tasks t join deals d on d.id=t.deal_id where t.state='open';
create or replace view compliance_gaps as
 select 'IPP9-purpose' as rule,d.name as deal,x.name as record,'Personal document has no recorded purpose' as issue,'https://www.privacy.org.nz/privacy-principles/9/' as source,d.id as deal_id from documents x join deals d on d.id=x.deal_id where x.personal and trim(x.purpose)=''
 union all select 'IPP9-review',d.name,x.name,'Personal document retention review missing or due','https://www.privacy.org.nz/privacy-principles/9/',d.id from documents x join deals d on d.id=x.deal_id where x.personal and (x.retention_review is null or x.retention_review<=current_date)
 union all select 'IPP5-review',d.name,x.name,'Document access review missing or due','https://www.privacy.org.nz/privacy-principles/5/',d.id from documents x join deals d on d.id=x.deal_id where x.access_review is null or x.access_review<=current_date;
