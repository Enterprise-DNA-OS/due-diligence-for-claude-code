insert into deals(id,name,target,owner,close_date,thesis) values
 ('10000000-0000-0000-0000-000000000001','Project Kauri','Fictional Kauri Advisory','Mere',current_date+14,'Acquire a recurring advisory book with stable client retention'),
 ('10000000-0000-0000-0000-000000000002','Project Harbour','Fictional Harbour Services','Alex',current_date+35,'Build a regional service team') on conflict do nothing;
insert into requests(id,deal_id,name,workstream,owner,due,priority,state,response,evidence,submitted_by,updated_at) values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Customer concentration schedule','Commercial','Mere',current_date-8,'critical','open',null,null,null,now()),
 ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Lease change of control consent','Legal','Alex',current_date-2,'high','submitted','Draft consent received','demo://lease-consent','Alex',now()),
 ('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002','Customer renewal dates','Commercial','Mere',current_date+4,'normal','open',null,null,null,now()-interval '35 days') on conflict do nothing;
insert into findings(id,deal_id,name,severity,owner,due,detail) values
 ('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Key client termination clause','high','Alex',current_date-3,'A fictional contract requires buyer review before signing'),
 ('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Unassigned transition work','medium','Mere',current_date+10,'Agree the client handover sequence') on conflict do nothing;
insert into tasks(id,deal_id,name,owner,due) values
 ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Confirm client handover owner','Mere',current_date-1),
 ('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Prepare first-week operating review','Alex',current_date+7) on conflict do nothing;
insert into documents(id,deal_id,name,location,owner,personal,purpose,access_review,retention_review) values
 ('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Staff continuity summary','demo://staff-summary','Mere',true,'',current_date-5,current_date-1),
 ('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','Renewal schedule','demo://renewals','Alex',false,'Review contract continuity',current_date+30,null) on conflict do nothing;
