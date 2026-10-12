create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table deals (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0), target text not null, owner text not null,
 close_date date not null, state text not null default 'diligence' check(state in ('diligence','signed-off')),
 thesis text not null default '', approved_by text, approved_at timestamptz, decision text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table requests (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), name text not null,
 workstream text not null, owner text not null, due date not null, priority text not null default 'normal' check(priority in ('normal','high','critical')),
 state text not null default 'open' check(state in ('open','submitted','approved')), response text, evidence text, submitted_by text,
 reviewer text, reviewed_at timestamptz, review_note text, source_id text unique, source_snapshot jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(state='open' or (length(trim(response))>0 and length(trim(evidence))>0 and submitted_by is not null)),
 check(state<>'approved' or (reviewer is not null and reviewed_at is not null and lower(reviewer)<>lower(submitted_by)))
);
create table findings (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), name text not null,
 severity text not null check(severity in ('low','medium','high','critical')), owner text not null, due date not null,
 detail text not null, state text not null default 'open' check(state in ('open','resolved')), resolution text, resolved_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(state<>'resolved' or (length(trim(resolution))>0 and resolved_by is not null))
);
create table tasks (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), name text not null, owner text not null,
 due date not null, state text not null default 'open' check(state in ('open','done')), evidence text, completed_by text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(state<>'done' or (length(trim(evidence))>0 and completed_by is not null))
);
create table documents (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), name text not null,
 location text not null, owner text not null, personal boolean not null default false,
 purpose text not null default '', access_review date, retention_review date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table notes (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null references deals(id), actor text not null, body text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table history (
 id uuid primary key default gen_random_uuid(), actor text not null, operation text not null, record_id uuid, detail jsonb not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
do $$ declare t text; begin foreach t in array array['deals','requests','findings','tasks','documents','notes','history'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop; end $$;
create index on requests(deal_id,state,due);
create index on findings(deal_id,state);
create index on tasks(deal_id,due);
create index on documents(deal_id);
create view request_chase as select r.id,d.name as deal,r.name,r.workstream,r.owner,r.priority,r.due,
 greatest(current_date-r.due,0) as days_overdue from requests r join deals d on d.id=r.deal_id where r.state='open';
create view review_queue as select r.id,d.name as deal,r.name,r.workstream,r.submitted_by,r.due,r.evidence from requests r join deals d on d.id=r.deal_id where r.state='submitted';
create view closing_readiness as select d.id,d.name,d.close_date,d.state,
 (select count(*) from requests r where r.deal_id=d.id and r.state<>'approved') as unapproved_requests,
 (select count(*) from findings f where f.deal_id=d.id and f.state='open' and f.severity in ('high','critical')) as open_major_findings,
 (select count(*) from tasks t where t.deal_id=d.id and t.state='open') as integration_tasks from deals d;
create view integration_week as select t.id,d.name as deal,t.name,t.owner,t.due,greatest(current_date-t.due,0) as days_overdue from tasks t join deals d on d.id=t.deal_id where t.state='open';
create view compliance_gaps as
 select 'IPP9-purpose' as rule,d.name as deal,x.name as record,'Personal document has no recorded purpose' as issue,'https://www.privacy.org.nz/privacy-principles/9/' as source from documents x join deals d on d.id=x.deal_id where x.personal and trim(x.purpose)=''
 union all select 'IPP9-review',d.name,x.name,'Personal document retention review missing or due','https://www.privacy.org.nz/privacy-principles/9/' from documents x join deals d on d.id=x.deal_id where x.personal and (x.retention_review is null or x.retention_review<=current_date)
 union all select 'IPP5-review',d.name,x.name,'Document access review missing or due','https://www.privacy.org.nz/privacy-principles/5/' from documents x join deals d on d.id=x.deal_id where x.access_review is null or x.access_review<=current_date;
revoke all on request_chase,review_queue,closing_readiness,integration_week,compliance_gaps from public;
