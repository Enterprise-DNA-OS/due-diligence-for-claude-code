#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {parseCsv,pick} from './lib/csv.mjs';
import {table} from './lib/format.mjs';
export const reads={
 'deals':['Review all deal records','select * from deals order by close_date,name'],
 'requests':['Read requests and source snapshots','select r.*,d.name as deal from requests r join deals d on d.id=r.deal_id order by due,name'],
 'request-chase':['Chase unanswered requests','select * from request_chase order by days_overdue desc,deal,name'],
 'review-queue':['Review submitted evidence','select * from review_queue order by due,deal,name'],
 'red-flags':['Review unresolved major findings',"select d.name as deal,f.name,f.severity,f.owner,f.due,f.detail from findings f join deals d on d.id=f.deal_id where f.state='open' and f.severity in ('high','critical') order by f.due,f.name"],
 'findings':['Read all findings','select * from findings order by due,name'],
 'closing-readiness':['Check the signing review','select * from closing_readiness order by close_date,name'],
 'integration-week':['Review handover work','select * from integration_week order by due,deal,name'],
 'documents':['Read document locations and review dates','select * from documents order by name'],
 'compliance':['Check scoped privacy record prompts','select * from compliance_gaps order by rule,deal,record'],
 'owner-load':['Count open requests and overdue work',"select owner,count(*) as open_requests,count(*) filter(where due<current_date) as overdue from requests where state<>'approved' group by owner order by overdue desc,owner"],
 'workstreams':['Compare requests by workstream',"select d.name as deal,r.workstream,count(*) as requests,count(*) filter(where r.state='approved') as approved,count(*) filter(where r.due<current_date and r.state<>'approved') as overdue from requests r join deals d on d.id=r.deal_id group by d.name,r.workstream order by d.name,r.workstream"],
 'stale':['Find requests untouched for 30 days',"select d.name as deal,r.name,r.owner,r.updated_at from requests r join deals d on d.id=r.deal_id where r.state<>'approved' and r.updated_at<now()-interval '30 days' order by r.updated_at"],
 'attention':['Read overdue requests, risks and handover tasks',"select 'request' as kind,deal,name,owner,due from request_chase where due<current_date union all select 'finding',d.name,f.name,f.owner,f.due from findings f join deals d on d.id=f.deal_id where f.state='open' and (f.due<current_date or f.severity in ('high','critical')) union all select 'handover',deal,name,owner,due from integration_week where due<current_date order by due,kind,name"],
 'history':['Read the last 100 local operations','select * from history order by created_at desc,id limit 100']
};
export const usage={
 deal:'--deal=...',search:'--text=...',
 add:'--type=deal|request|finding|task|document --name=... --actor=... (see README for fields)',
 submit:'--request=... --response=... --evidence=... --actor=...',
 review:'--request=... --note=... --actor=... (independent from submitter)',
 reopen:'--request=... --reason=... --actor=...',
 resolve:'--finding=... --resolution=... --actor=...',
 complete:'--task=... --evidence=... --actor=...',
 'review-document':'--document=... --purpose=... --access-review=YYYY-MM-DD [--retention-review=YYYY-MM-DD] --actor=...',
 signoff:'--deal=... --decision=... --actor=...',
 log:'--deal=... --note=... --actor=...',
 import:'dealroom --file=export.csv --deal=... --actor=... [--mapping=file.json] [--dry-run]',
 export:'--out=exports/backup.json',
 'weekly-review':'Write a private review draft', 'draft-request':'--request=...','draft-decision':'--deal=...',help:'Show commands'
};
export const commands=[...Object.keys(reads),...Object.keys(usage)];
const types={deal:'deals',request:'requests',finding:'findings',task:'tasks',document:'documents'};
const allTables=[...Object.values(types),'notes','history'];
function req(o,k){if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}`);return o[k].trim();}
function date(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error('Expected a real YYYY-MM-DD date');return s;}
function choice(s,a){if(!a.includes(s))throw Error(`Expected one of: ${a.join(', ')}`);return s;}
function parse(args){const o={};for(const arg of args.filter(x=>x.startsWith('--'))){const i=arg.indexOf('='),k=arg.slice(2,i<0?undefined:i);if(k in o)throw Error(`Duplicate --${k}`);o[k]=i<0?true:arg.slice(i+1);}return o;}
const allowed={deal:['deal'],search:['text'],add:['type','name','target','owner','close-date','thesis','deal','workstream','due','priority','severity','detail','location','personal','purpose','access-review','retention-review','actor'],submit:['request','response','evidence','actor'],review:['request','note','actor'],reopen:['request','reason','actor'],resolve:['finding','resolution','actor'],complete:['task','evidence','actor'],'review-document':['document','purpose','access-review','retention-review','actor'],signoff:['deal','decision','actor'],log:['deal','note','actor'],import:['file','deal','actor','mapping','dry-run'],export:['out'],'draft-request':['request'],'draft-decision':['deal']};
export async function resolveRecord(db,type,value,lock=false){
 const tableName=types[type];if(!tableName)throw Error('Unknown record type');
 let rows=await db.query(`select * from ${tableName} where lower(name)=lower($1) or id::text=$1 order by name,id${lock?' for update':''}`,[value]);
 if(!rows.length)rows=await db.query(`select * from ${tableName} where starts_with(lower(name),lower($1)) or starts_with(id::text,$1) order by name,id${lock?' for update':''}`,[value]);
 if(rows.length!==1)throw Error(`${type} ${rows.length?'ambiguous':'not found'}: ${value}\n${rows.map(r=>`${r.id}  ${r.name}`).join('\n')||'Use the list command.'}`);
 return rows[0];
}
async function openDeal(db,id){const [d]=await db.query('select * from deals where id=$1 for update',[id]);if(d.state!=='diligence')throw Error('Signed-off diligence records are locked; integration tasks, notes and privacy reviews remain available');return d;}
function render(rows){return Array.isArray(rows)?(rows.length?table(rows,Object.keys(rows[0]).map(key=>({key,label:key,format:v=>v&&typeof v==='object'?JSON.stringify(v):v}))):'  (none)'):JSON.stringify(rows,null,2);}
function draft(name,body){const dir=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,'drafts');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,`${name}-${randomUUID()}.md`);fs.writeFileSync(file,body,{flag:'wx',mode:0o600});return {file};}
export async function run(db,args){
 const cmd=args[0]||'help',o=parse(args.slice(1)),pos=args.slice(1).filter(x=>!x.startsWith('--'));
 if(!commands.includes(cmd))throw Error(`Unknown command: ${cmd}`);
 for(const k of Object.keys(o))if(!['json',...(allowed[cmd]||[])].includes(k))throw Error(`Unknown --${k} for ${cmd}`);
 for(const k of ['json','dry-run'])if(k in o&&o[k]!==true)throw Error(`Use --${k} without a value`);
 if(pos.length&&!(cmd==='import'&&pos.length===1&&pos[0]==='dealroom'))throw Error('Unexpected argument. Use --field=value.');
 if(reads[cmd])return db.query(reads[cmd][1]);
 if(cmd==='help')return commands.map(command=>({command,usage:reads[command]?.[0]||usage[command]}));
 if(cmd==='search')return db.query("select 'deal' as kind,id,name from deals where strpos(lower(name||' '||target),lower($1))>0 union all select 'request',id,name from requests where strpos(lower(name),lower($1))>0 union all select 'finding',id,name from findings where strpos(lower(name||' '||detail),lower($1))>0 order by kind,name",[req(o,'text')]);
 if(cmd==='deal'){const d=await resolveRecord(db,'deal',req(o,'deal'));const out={deal:d};for(const t of ['requests','findings','tasks','documents','notes'])out[t]=await db.query(`select * from ${t} where deal_id=$1 order by created_at,id`,[d.id]);return out;}
 if(cmd==='export'){
 const backup={format:'due-diligence-backup-v1',exported_at:new Date().toISOString(),records:{}};
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const t of allTables)backup.records[t]=await db.query(`select * from ${t} order by id`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
 const file=path.resolve(process.env.OUTPUT_DIR||REPO_ROOT,req(o,'out'));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(backup,null,2)+'\n',{flag:'wx',mode:0o600});return {file,counts:Object.fromEntries(Object.entries(backup.records).map(([k,v])=>[k,v.length]))};
 }
 if(cmd==='weekly-review'||cmd.startsWith('draft-')){
 let body=`# ${cmd}\n\nPRIVATE DRAFT. Fictional data in the demo. Review before use. Nothing sent.\n\n`;
 if(cmd==='weekly-review')for(const c of ['closing-readiness','attention','review-queue','compliance'])body+=`## ${c}\n\n${render(await run(db,[c]))}\n\n`;
 else if(cmd==='draft-request'){const r=await resolveRecord(db,'request',req(o,'request'));body+=`To: ${r.owner}\nSubject: Evidence request: ${r.name}\n\nPlease provide the response and supporting evidence for ${r.name} (${r.workstream}), agreed due date ${r.due}.\n\nCurrent state: ${r.state}.\n`;}
 else body+=render(await run(db,['deal',`--deal=${req(o,'deal')}`]));
 return draft(cmd,body);
 }
 const actor=req(o,'actor');await db.exec('BEGIN');
 try{
 let row,result;
 if(cmd==='add'){
 const type=choice(req(o,'type'),Object.keys(types));let fields={name:req(o,'name')};
 if(type==='deal')fields={...fields,target:req(o,'target'),owner:req(o,'owner'),close_date:date(req(o,'close-date')),thesis:o.thesis||''};
 else{
 const d=await resolveRecord(db,'deal',req(o,'deal'),true);if(!['task','document'].includes(type))await openDeal(db,d.id);fields={...fields,deal_id:d.id,owner:req(o,'owner')};
 if(['request','finding','task'].includes(type))fields.due=date(req(o,'due'));
 if(type==='request')fields={...fields,workstream:req(o,'workstream'),priority:choice(o.priority||'normal',['normal','high','critical'])};
 if(type==='finding')fields={...fields,severity:choice(req(o,'severity'),['low','medium','high','critical']),detail:req(o,'detail')};
 if(type==='document')fields={...fields,location:req(o,'location'),personal:choice(o.personal||'false',['true','false'])==='true',purpose:o.purpose||'',access_review:o['access-review']?date(o['access-review']):null,retention_review:o['retention-review']?date(o['retention-review']):null};
 }
 const keys=Object.keys(fields);[row]=await db.query(`insert into ${types[type]}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(fields));
 }else if(['submit','review','reopen'].includes(cmd)){
 const r=await resolveRecord(db,'request',req(o,'request'),true);await openDeal(db,r.deal_id);
 if(cmd==='submit'){
 if(r.state!=='open')throw Error('Reopen before replacing a submitted or approved response');
 [row]=await db.query("update requests set state='submitted',response=$2,evidence=$3,submitted_by=$4 where id=$1 returning *",[r.id,req(o,'response'),req(o,'evidence'),actor]);
 }else if(cmd==='review'){
 if(r.state!=='submitted')throw Error('Only submitted evidence can be approved');if(r.submitted_by.toLowerCase()===actor.toLowerCase())throw Error('Reviewer must differ from submitter');
 [row]=await db.query("update requests set state='approved',reviewer=$2,reviewed_at=now(),review_note=$3 where id=$1 returning *",[r.id,actor,req(o,'note')]);
 }else{req(o,'reason');if(r.state==='open')throw Error('Request already open');[row]=await db.query("update requests set state='open',response=null,evidence=null,submitted_by=null,reviewer=null,reviewed_at=null,review_note=null where id=$1 returning *",[r.id]);result={...row,reopen_reason:o.reason};}
 }else if(cmd==='resolve'){
 const f=await resolveRecord(db,'finding',req(o,'finding'),true);await openDeal(db,f.deal_id);if(f.state==='resolved')throw Error('Finding already resolved');
 [row]=await db.query("update findings set state='resolved',resolution=$2,resolved_by=$3 where id=$1 returning *",[f.id,req(o,'resolution'),actor]);
 }else if(cmd==='complete'){
 const t=await resolveRecord(db,'task',req(o,'task'),true);if(t.state==='done')throw Error('Task already done');[row]=await db.query("update tasks set state='done',evidence=$2,completed_by=$3 where id=$1 returning *",[t.id,req(o,'evidence'),actor]);
 }else if(cmd==='review-document'){
 const d=await resolveRecord(db,'document',req(o,'document'),true);const retention=o['retention-review']?date(o['retention-review']):d.retention_review;
 if(d.personal&&!retention)throw Error('Personal document requires an operator-set retention review date');
 [row]=await db.query('update documents set purpose=$2,access_review=$3,retention_review=$4 where id=$1 returning *',[d.id,req(o,'purpose'),date(req(o,'access-review')),retention]);
 }else if(cmd==='signoff'){
 const d=await resolveRecord(db,'deal',req(o,'deal'),true);await openDeal(db,d.id);
 const [counts]=await db.query("select count(*)::int as total,count(*) filter(where state<>'approved')::int as pending from requests where deal_id=$1",[d.id]);
 const [risks]=await db.query("select count(*)::int as n from findings where deal_id=$1 and state='open' and severity in ('high','critical')",[d.id]);
 if(!counts.total||counts.pending||risks.n)throw Error('Signoff requires at least one request, all requests approved and no open high or critical findings');
 [row]=await db.query("update deals set state='signed-off',decision=$2,approved_by=$3,approved_at=now() where id=$1 returning *",[d.id,req(o,'decision'),actor]);
 }else if(cmd==='log'){
 const d=await resolveRecord(db,'deal',req(o,'deal'));[row]=await db.query('insert into notes(deal_id,actor,body) values($1,$2,$3) returning *',[d.id,actor,req(o,'note')]);
 }else if(cmd==='import'){
 if(pos[0]!=='dealroom')throw Error('Use import dealroom');const d=await resolveRecord(db,'deal',req(o,'deal'),true);await openDeal(db,d.id);
 const csv=parseCsv(fs.readFileSync(path.resolve(req(o,'file')),'utf8'));if(!csv.length)throw Error('No request rows in CSV');
 const mapping=o.mapping?JSON.parse(fs.readFileSync(path.resolve(o.mapping),'utf8')):{};
 const defaults={source_id:['Request ID','ID','Key'],name:['Request','Title','Name'],workstream:['List','Category','Workstream'],owner:['Assignee','Assigned to','Owner'],due:['Due Date','Due'],priority:['Priority']};
 for(const [k,v]of Object.entries(mapping))if(!(k in defaults)||typeof v!=='string'||!v.trim())throw Error('Mapping must map supported field names to column headings');
 const seen=new Set();let inserted=0,skipped=0;
 for(const [i,source]of csv.entries()){
 const values=Object.fromEntries(Object.keys(defaults).map(k=>[k,pick(source,...(mapping[k]?[mapping[k]]:defaults[k])).trim()]));
 for(const k of ['source_id','name','workstream','owner','due'])if(!values[k])throw Error(`Row ${i+2}: missing ${k}; map the export headings explicitly`);
 values.due=date(values.due);values.priority=choice(values.priority.toLowerCase()||'normal',['normal','high','critical']);
 const sourceId=`dealroom:${d.id}:${values.source_id}`;if(seen.has(sourceId))throw Error(`Duplicate source ID at row ${i+2}`);seen.add(sourceId);
 const [old]=await db.query('select * from requests where source_id=$1',[sourceId]);
 if(old){if(Object.keys(old.source_snapshot).length!==Object.keys(source).length||Object.keys(source).some(k=>old.source_snapshot[k]!==source[k]))throw Error(`Source ${values.source_id} changed; reconcile explicitly. Local records not overwritten.`);skipped++;continue;}
 await db.query('insert into requests(deal_id,name,workstream,owner,due,priority,source_id,source_snapshot) values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[d.id,values.name,values.workstream,values.owner,values.due,values.priority,sourceId,JSON.stringify(source)]);inserted++;
 }
 row=d;result={inserted,skipped,dry_run:!!o['dry-run'],note:'Request records only. Source status is retained in snapshot; imported requests start open. Files, permissions and approval history require separate migration.'};
 }
 await db.query('insert into history(actor,operation,record_id,detail) values($1,$2,$3,$4::jsonb)',[actor,cmd,row?.id||null,JSON.stringify(result||row)]);
 await db.exec(o['dry-run']?'ROLLBACK':'COMMIT');return result||row;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 let db;try{db=await getDb();const data=await run(db,process.argv.slice(2));console.log(process.argv.includes('--json')?JSON.stringify(data,null,2):render(data));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
