-- ThreatLens Supabase schema: scans, communications (+ pgvector similarity
-- search), and daily threat_stats aggregates.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- scans: every URL / content / media / verify request handled by the API.
-- `type` distinguishes which analyzer produced the row; `shap_json` holds
-- the model's per-feature explanation, `rules_triggered` holds the
-- separate heuristic-overlay hits, kept apart so the UI can render them
-- as distinct panels (model evidence vs. rule evidence).
-- ---------------------------------------------------------------------
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  url text,
  risk_score numeric not null,
  verdict text not null check (verdict in ('SAFE', 'SUSPICIOUS', 'PHISHING', 'SYNTHETIC_SUSPECTED', 'INCONCLUSIVE', 'LIKELY_AUTHENTIC')),
  shap_json jsonb not null default '[]'::jsonb,
  rules_triggered jsonb not null default '[]'::jsonb,
  type text not null check (type in ('url', 'content', 'media', 'communication')),
  timestamp timestamptz not null default now()
);

create index if not exists scans_timestamp_idx on scans (timestamp desc);
create index if not exists scans_verdict_idx on scans (verdict);
create index if not exists scans_type_idx on scans (type);

-- ---------------------------------------------------------------------
-- communications: hash registry of known-authentic SEBI/exchange
-- communications, plus a fixed-size text embedding for near-duplicate /
-- altered-copy similarity search via pgvector (exact hash match alone
-- would miss a scam message that copies 95% of an official notice).
-- ---------------------------------------------------------------------
create table if not exists communications (
  id uuid primary key default gen_random_uuid(),
  hash text not null unique,
  source text not null,
  verified boolean not null default true,
  embedding vector(384),
  timestamp timestamptz not null default now()
);

create index if not exists communications_hash_idx on communications (hash);
create index if not exists communications_embedding_idx
  on communications using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Cosine-similarity nearest neighbor search, called via supabase-py's
-- `.rpc("match_communications", {...})` from backend/embeddings.py when an
-- exact hash lookup misses, to catch lightly-altered copies of real notices.
create or replace function match_communications(
  query_embedding vector(384),
  match_threshold float default 0.92,
  match_count int default 3
)
returns table (
  id uuid,
  source text,
  similarity float
)
language sql stable
as $$
  select
    communications.id,
    communications.source,
    1 - (communications.embedding <=> query_embedding) as similarity
  from communications
  where communications.embedding is not null
    and 1 - (communications.embedding <=> query_embedding) > match_threshold
  order by communications.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------
-- threat_stats: daily aggregates, refreshed by refresh_threat_stats().
-- Wire this to a daily pg_cron job (or a Supabase Edge Function on a
-- schedule) calling `select refresh_threat_stats();`.
--
-- `accuracy` is NOT computed from live traffic — production scans have no
-- ground-truth label, so there's nothing to score against. It's passed in
-- from the model's last training-run holdout accuracy (see
-- ml/train.py's saved metrics) and just carried forward into each day's
-- row until the next retrain updates it. This is documented rather than
-- silently faked as a "daily" number that doesn't actually vary daily.
-- ---------------------------------------------------------------------
create table if not exists threat_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  phishing_count int not null default 0,
  deepfake_count int not null default 0,
  accuracy numeric not null default 0,
  total_scans int not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function refresh_threat_stats(
  target_date date default current_date,
  model_accuracy numeric default null
)
returns void
language plpgsql
as $$
declare
  v_total int;
  v_phishing int;
  v_deepfake int;
  v_accuracy numeric;
begin
  select count(*) into v_total
  from scans
  where timestamp::date = target_date;

  select count(*) into v_phishing
  from scans
  where timestamp::date = target_date and verdict = 'PHISHING';

  select count(*) into v_deepfake
  from scans
  where timestamp::date = target_date and type = 'media' and verdict = 'SYNTHETIC_SUSPECTED';

  select coalesce(
    model_accuracy,
    (select accuracy from threat_stats where date = target_date),
    (select accuracy from threat_stats order by date desc limit 1),
    0
  ) into v_accuracy;

  insert into threat_stats (date, phishing_count, deepfake_count, accuracy, total_scans, updated_at)
  values (target_date, v_phishing, v_deepfake, v_accuracy, v_total, now())
  on conflict (date) do update set
    phishing_count = excluded.phishing_count,
    deepfake_count = excluded.deepfake_count,
    accuracy = excluded.accuracy,
    total_scans = excluded.total_scans,
    updated_at = excluded.updated_at;
end;
$$;
