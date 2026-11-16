-- HAI DAT OFFICE / WRITER V2.7
-- Run once in Supabase SQL Editor. Never expose the service_role key in the browser.
create extension if not exists pgcrypto;

create table if not exists public.hd_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table if not exists public.hd_group_members (
  group_id uuid not null references public.hd_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('manager','member')),
  added_at timestamptz not null default now(),
  primary key (group_id,user_id)
);
create table if not exists public.hd_documents (
  id text primary key check (id ~ '^HDW-[0-9]{8}-[A-Z0-9]{8}$'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  title text not null default 'Tài liệu chưa đặt tên' check (char_length(title) <= 120),
  content_html text not null default '',
  content_type text not null default 'text/html',
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table if not exists public.hd_document_permissions (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.hd_documents(id) on delete cascade,
  subject_type text not null check (subject_type in ('user','group')),
  subject_id uuid not null,
  can_read boolean not null default false,
  can_comment boolean not null default false,
  can_edit boolean not null default false,
  can_copy boolean not null default false,
  can_download boolean not null default false,
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (not (can_comment or can_edit or can_copy or can_download) or can_read)
);
create unique index if not exists hd_doc_permissions_active_subject
  on public.hd_document_permissions(document_id,subject_type,subject_id) where revoked_at is null;
create table if not exists public.hd_access_requests (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.hd_documents(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  requested_read boolean not null default true,
  requested_comment boolean not null default false,
  requested_edit boolean not null default false,
  requested_copy boolean not null default false,
  requested_download boolean not null default false,
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  check (not (requested_comment or requested_edit or requested_copy or requested_download) or requested_read)
);
create table if not exists public.hd_document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.hd_documents(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.hd_access_audit (
  id bigint generated always as identity primary key,
  document_id text references public.hd_documents(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text,
  subject_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.hd_is_group_member(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.hd_group_members m where m.group_id=p_group and m.user_id=p_user); $$;

create or replace function public.hd_is_group_manager(p_group uuid, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.hd_groups g where g.id=p_group and g.owner_user_id=p_user)
   or exists(select 1 from public.hd_group_members m where m.group_id=p_group and m.user_id=p_user and m.role='manager'); $$;

create or replace function public.hd_has_doc_permission(p_document text, p_permission text, p_user uuid default auth.uid())
returns boolean language sql stable security definer set search_path=public
as $$
 select exists(
   select 1 from public.hd_documents d
   where d.id=p_document and d.deleted_at is null
   and (
     d.owner_user_id=p_user
     or exists(
       select 1 from public.hd_document_permissions p
       where p.document_id=d.id and p.revoked_at is null
       and case p_permission
         when 'read' then p.can_read
         when 'comment' then p.can_read and p.can_comment
         when 'edit' then p.can_read and p.can_edit
         when 'copy' then p.can_read and p.can_copy
         when 'download' then p.can_read and p.can_download
         else false end
       and (
         (p.subject_type='user' and p.subject_id=p_user)
         or (p.subject_type='group' and public.hd_is_group_member(p.subject_id,p_user))
       )
     )
   )
 );
$$;

alter table public.hd_groups enable row level security;
alter table public.hd_group_members enable row level security;
alter table public.hd_documents enable row level security;
alter table public.hd_document_permissions enable row level security;
alter table public.hd_access_requests enable row level security;
alter table public.hd_document_comments enable row level security;
alter table public.hd_access_audit enable row level security;

drop policy if exists hd_groups_select on public.hd_groups;
create policy hd_groups_select on public.hd_groups for select to authenticated
using (owner_user_id=auth.uid() or public.hd_is_group_member(id));
drop policy if exists hd_groups_insert on public.hd_groups;
create policy hd_groups_insert on public.hd_groups for insert to authenticated with check (owner_user_id=auth.uid());
drop policy if exists hd_groups_update on public.hd_groups;
create policy hd_groups_update on public.hd_groups for update to authenticated using (public.hd_is_group_manager(id)) with check (public.hd_is_group_manager(id));
drop policy if exists hd_groups_delete on public.hd_groups;
create policy hd_groups_delete on public.hd_groups for delete to authenticated using (owner_user_id=auth.uid());

drop policy if exists hd_group_members_select on public.hd_group_members;
create policy hd_group_members_select on public.hd_group_members for select to authenticated using (user_id=auth.uid() or public.hd_is_group_manager(group_id));
drop policy if exists hd_group_members_insert on public.hd_group_members;
create policy hd_group_members_insert on public.hd_group_members for insert to authenticated with check (public.hd_is_group_manager(group_id));
drop policy if exists hd_group_members_delete on public.hd_group_members;
create policy hd_group_members_delete on public.hd_group_members for delete to authenticated using (public.hd_is_group_manager(group_id));

drop policy if exists hd_documents_select on public.hd_documents;
create policy hd_documents_select on public.hd_documents for select to authenticated using (public.hd_has_doc_permission(id,'read'));
drop policy if exists hd_documents_insert on public.hd_documents;
create policy hd_documents_insert on public.hd_documents for insert to authenticated with check (owner_user_id=auth.uid());
drop policy if exists hd_documents_update on public.hd_documents;
create policy hd_documents_update on public.hd_documents for update to authenticated using (public.hd_has_doc_permission(id,'edit')) with check (public.hd_has_doc_permission(id,'edit'));
drop policy if exists hd_documents_delete on public.hd_documents;
create policy hd_documents_delete on public.hd_documents for delete to authenticated using (owner_user_id=auth.uid());

drop policy if exists hd_permissions_select on public.hd_document_permissions;
create policy hd_permissions_select on public.hd_document_permissions for select to authenticated
using (exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid())
  or (subject_type='user' and subject_id=auth.uid())
  or (subject_type='group' and public.hd_is_group_member(subject_id)));
drop policy if exists hd_permissions_insert on public.hd_document_permissions;
create policy hd_permissions_insert on public.hd_document_permissions for insert to authenticated
with check (granted_by=auth.uid() and exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));
drop policy if exists hd_permissions_update on public.hd_document_permissions;
create policy hd_permissions_update on public.hd_document_permissions for update to authenticated
using (exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()))
with check (granted_by=auth.uid() and exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));
drop policy if exists hd_permissions_delete on public.hd_document_permissions;
create policy hd_permissions_delete on public.hd_document_permissions for delete to authenticated
using (exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));

drop policy if exists hd_requests_select on public.hd_access_requests;
create policy hd_requests_select on public.hd_access_requests for select to authenticated
using (requester_user_id=auth.uid() or exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));
drop policy if exists hd_requests_insert on public.hd_access_requests;
create policy hd_requests_insert on public.hd_access_requests for insert to authenticated with check (requester_user_id=auth.uid());
drop policy if exists hd_requests_update on public.hd_access_requests;
create policy hd_requests_update on public.hd_access_requests for update to authenticated
using (exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()))
with check (exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));

drop policy if exists hd_comments_select on public.hd_document_comments;
create policy hd_comments_select on public.hd_document_comments for select to authenticated using (public.hd_has_doc_permission(document_id,'read'));
drop policy if exists hd_comments_insert on public.hd_document_comments;
create policy hd_comments_insert on public.hd_document_comments for insert to authenticated with check (author_user_id=auth.uid() and public.hd_has_doc_permission(document_id,'comment'));
drop policy if exists hd_comments_update on public.hd_document_comments;
create policy hd_comments_update on public.hd_document_comments for update to authenticated
using (author_user_id=auth.uid() or exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()))
with check (author_user_id=auth.uid() or exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));
drop policy if exists hd_comments_delete on public.hd_document_comments;
create policy hd_comments_delete on public.hd_document_comments for delete to authenticated
using (author_user_id=auth.uid() or exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));

drop policy if exists hd_audit_select on public.hd_access_audit;
create policy hd_audit_select on public.hd_access_audit for select to authenticated
using (actor_user_id=auth.uid() or exists(select 1 from public.hd_documents d where d.id=document_id and d.owner_user_id=auth.uid()));
drop policy if exists hd_audit_insert on public.hd_access_audit;
create policy hd_audit_insert on public.hd_access_audit for insert to authenticated with check (actor_user_id=auth.uid());

grant select,insert,update,delete on public.hd_groups,public.hd_group_members,public.hd_documents,public.hd_document_permissions,public.hd_access_requests,public.hd_document_comments,public.hd_access_audit to authenticated;
grant usage,select on sequence public.hd_access_audit_id_seq to authenticated;

-- Important: these policies protect access, but service_role bypasses RLS.
-- Never put service_role keys in the PWA. Keep document HTML private until authenticated.

-- Server-side copy operation: requires explicit can_copy permission and creates a new owner-owned ID.
create or replace function public.hd_copy_document(p_source_id text, p_new_id text, p_new_title text)
returns public.hd_documents
language plpgsql security definer set search_path=public
as $$
declare source_doc public.hd_documents; copied public.hd_documents;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_new_id !~ '^HDW-[0-9]{8}-[A-Z0-9]{8}$' then raise exception 'Invalid new document ID'; end if;
  if char_length(coalesce(p_new_title,'')) not between 1 and 120 then raise exception 'Invalid title'; end if;
  if not public.hd_has_doc_permission(p_source_id,'copy',auth.uid()) then raise exception 'Copy permission denied'; end if;
  select * into source_doc from public.hd_documents where id=p_source_id and deleted_at is null;
  if not found then raise exception 'Document unavailable'; end if;
  insert into public.hd_documents(id,owner_user_id,title,content_html,content_type,version)
  values(p_new_id,auth.uid(),p_new_title,source_doc.content_html,source_doc.content_type,1)
  returning * into copied;
  insert into public.hd_access_audit(document_id,actor_user_id,action,details)
  values(p_source_id,auth.uid(),'copy',jsonb_build_object('new_document_id',p_new_id));
  return copied;
end;
$$;
revoke all on function public.hd_copy_document(text,text,text) from public;
grant execute on function public.hd_copy_document(text,text,text) to authenticated;
