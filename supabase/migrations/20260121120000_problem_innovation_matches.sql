-- 20260121120000_problem_innovation_matches.sql
-- Problem -> Innovation recommendation storage (Trigger A) + refresh state
-- Idempotent migration (safe to rerun)

-- Enable pgvector for similarity search (idempotent)
create extension if not exists vector with schema public;

-- Add embeddings to problems for matching
alter table public.problems
  add column if not exists embedding vector(1536),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

-- HNSW index for fast similarity search on problems (idempotent)
create index if not exists problems_embedding_hnsw_idx
  on public.problems
  using hnsw (embedding vector_cosine_ops);

--------------------------------------------------------------------------------
-- Cache table for problem-to-innovation matches
--------------------------------------------------------------------------------
create table if not exists public.problem_innovation_matches (
  id uuid primary key default gen_random_uuid(),
  -- NOTE: In your current schema org_id references auth.users(id).
  -- This treats "org" as the enterprise user's auth user id for now.
  org_id uuid not null references auth.users(id) on delete cascade,
  problem_id uuid not null references public.problems(id) on delete cascade,
  innovation_id uuid not null references public.innovations(id) on delete cascade,

  score_total numeric(6,2) not null,
  score_relevance numeric(6,2) not null,
  score_feasibility numeric(6,2) not null,
  score_impact numeric(6,2) not null,
  score_risk numeric(6,2) not null,

  reasons jsonb default '[]'::jsonb,
  matched_tags jsonb default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (org_id, problem_id, innovation_id)
);

alter table public.problem_innovation_matches enable row level security;

-- RLS: Enterprise user can read only their org_id matches
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'problem_innovation_matches'
      and policyname = 'Org can read its problem matches'
  ) then
    create policy "Org can read its problem matches"
      on public.problem_innovation_matches
      for select
      using (auth.uid() = org_id);
  end if;
end $$;

-- (Optional) Allow service role / edge functions to upsert rows
-- Edge functions normally use service role and bypass RLS, so this is not required.
-- If you ever call inserts from client (not recommended), you'd need INSERT/UPDATE policies.

create index if not exists problem_innovation_matches_problem_score_idx
  on public.problem_innovation_matches (problem_id, score_total desc);

create index if not exists problem_innovation_matches_org_score_idx
  on public.problem_innovation_matches (org_id, score_total desc);

create index if not exists problem_innovation_matches_innovation_idx
  on public.problem_innovation_matches (innovation_id);

-- Idempotent trigger for updated_at
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'problem_innovation_matches_updated_at'
  ) then
    create trigger problem_innovation_matches_updated_at
      before update on public.problem_innovation_matches
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

--------------------------------------------------------------------------------
-- Track org-level refreshes for rate limiting
--------------------------------------------------------------------------------
create table if not exists public.problem_match_refresh_state (
  org_id uuid primary key references auth.users(id) on delete cascade,
  refreshed_by uuid references auth.users(id) on delete set null,
  last_refreshed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.problem_match_refresh_state enable row level security;

-- RLS: Enterprise user can view only their refresh state row
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename  = 'problem_match_refresh_state'
      and policyname = 'Org can view its refresh state'
  ) then
    create policy "Org can view its refresh state"
      on public.problem_match_refresh_state
      for select
      using (auth.uid() = org_id);
  end if;
end $$;

-- Idempotent trigger for updated_at
do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'problem_match_refresh_state_updated_at'
  ) then
    create trigger problem_match_refresh_state_updated_at
      before update on public.problem_match_refresh_state
      for each row execute function public.update_updated_at_column();
  end if;
end $$;

--------------------------------------------------------------------------------
-- RPC for vector similarity against published/featured innovations
--------------------------------------------------------------------------------
create or replace function public.match_innovations_published(
  query_embedding vector(1536),
  match_count int default 10,
  optional_category text default null,
  exclude_ids uuid[] default '{}'
) returns table (
  id uuid,
  innovator_id uuid,
  title text,
  tagline text,
  category innovation_category,
  custom_category text,
  description text,
  similarity float
) language sql stable as $$
  select
    i.id,
    i.innovator_id,
    i.title,
    i.tagline,
    i.category,
    i.custom_category,
    i.description,
    1 - (i.embedding <=> query_embedding) as similarity
  from public.innovations i
  where i.status in ('published', 'featured')
    and i.embedding is not null
    and (optional_category is null or i.category::text = optional_category)
    and (coalesce(array_length(exclude_ids, 1), 0) = 0 or not (i.id = any (exclude_ids)))
  order by i.embedding <=> query_embedding asc
  limit least(greatest(match_count, 1), 100);
$$;
