-- Enable pgvector for similarity search
create extension if not exists vector with schema public;

-- Embedding storage for innovations
alter table public.innovations
  add column if not exists embedding vector(1536),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

-- HNSW index optimized for cosine distance
create index if not exists innovations_embedding_hnsw_idx
  on public.innovations
  using hnsw (embedding vector_cosine_ops);

-- RPC to fetch similar published innovations
create or replace function public.match_innovations_published(
  query_embedding vector(1536),
  match_count int default 10,
  category_filter innovation_category default null,
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
    order by i.embedding <=> query_embedding asc

  from public.innovations i
  where i.status in ('published', 'featured')
    and i.embedding is not null
    and (category_filter is null or i.category = category_filter)
    and (coalesce(array_length(exclude_ids, 1), 0) = 0 or not (i.id = any (exclude_ids)))
  order by i.embedding <=> query_embedding asc
  limit least(greatest(match_count, 1), 50);
$$;
