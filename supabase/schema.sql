-- Supabase SQL Editor에서 프로젝트 소유자가 한 번 실행합니다.
create table if not exists public.notebooks (
 user_id uuid primary key references auth.users(id) on delete cascade,
 document jsonb not null default '{"version":1,"categories":[],"entries":[]}',
 revision bigint not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now()
);
create table if not exists public.note_operations (
 user_id uuid not null references auth.users(id) on delete cascade,
 operation_id uuid not null,
 primary key(user_id,operation_id)
);
alter table public.notebooks enable row level security;
alter table public.note_operations enable row level security;
create policy notebook_owner on public.notebooks for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy operation_owner on public.note_operations for all to authenticated
 using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
-- 직접 쓰기를 차단하여 서버 버전 검사를 우회하지 못하게 합니다.
revoke all on public.notebooks, public.note_operations from anon, authenticated;

create or replace function public.note_read() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
 select jsonb_build_object('document',document,'revision',revision) into result from public.notebooks where user_id=uid;
 return coalesce(result,'{"document":{"version":1,"categories":[],"entries":[]},"revision":0}'::jsonb);
end $$;

create or replace function public.note_save(p_document jsonb,p_expected_revision bigint,p_operation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); current_revision bigint; result jsonb;
begin
 if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
 if p_operation_id is null or p_expected_revision is null then raise exception 'INVALID_REQUEST'; end if;
 if p_document is null or p_document->>'version' is distinct from '1'
  or jsonb_typeof(p_document->'entries') is distinct from 'array'
  or jsonb_typeof(p_document->'categories') is distinct from 'array'
  or pg_column_size(p_document)>10485760 then raise exception 'INVALID_DOCUMENT'; end if;
 if exists(select 1 from jsonb_array_elements(p_document->'entries') e
  where jsonb_typeof(e->'amount') is distinct from 'number' or (e->>'amount')::numeric<=0
  or e->>'type' not in ('income','expense') or e->>'type' is null
  or coalesce(e->>'id','')='' or coalesce(e->>'categoryId','')=''
  or coalesce(e->>'date','') !~ '^\d{4}-\d{2}-\d{2}$'
  or length(coalesce(e->>'memo',''))>500) then raise exception 'INVALID_ENTRY'; end if;
 if exists(select 1 from jsonb_array_elements(p_document->'categories') c
  where coalesce(c->>'id','')='' or length(trim(coalesce(c->>'name','')))=0 or length(c->>'name')>40) then raise exception 'INVALID_CATEGORY'; end if;
 if (select count(*) from jsonb_array_elements(p_document->'entries')) <> (select count(distinct e->>'id') from jsonb_array_elements(p_document->'entries') e)
  or (select count(*) from jsonb_array_elements(p_document->'categories')) <> (select count(distinct c->>'id') from jsonb_array_elements(p_document->'categories') c)
  then raise exception 'DUPLICATE_ID'; end if;
 insert into public.notebooks(user_id) values(uid) on conflict do nothing;
 select revision into current_revision from public.notebooks where user_id=uid for update;
 if exists(select 1 from public.note_operations where user_id=uid and operation_id=p_operation_id) then
  return public.note_read();
 end if;
 if current_revision<>p_expected_revision then raise exception 'NOTE_CONFLICT'; end if;
 update public.notebooks set document=p_document,revision=revision+1,updated_at=now() where user_id=uid;
 insert into public.note_operations(user_id,operation_id) values(uid,p_operation_id);
 return public.note_read();
end $$;
revoke all on function public.note_read(),public.note_save(jsonb,bigint,uuid) from public,anon;
grant execute on function public.note_read(),public.note_save(jsonb,bigint,uuid) to authenticated;
