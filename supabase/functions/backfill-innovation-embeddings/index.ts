import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-backfill-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type BackfillRequest = {
  batch_size?: number;
};

type InnovationRow = {
  id: string;
  innovator_id: string;
  title: string;
  tagline: string;
  category: string;
  custom_category: string | null;
  description: string;
  without_product: string;
  with_product: string;
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableOpenAI(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2,
  baseDelayMs = 400,
  maxDelayMs = 4000,
): Promise<Response> {
  let lastRes: Response | null = null;
  let lastErr: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      lastRes = res;

      if (res.ok) return res;
      if (!isRetryableOpenAI(res.status) || attempt === retries) return res;

      const retryAfter = res.headers.get("retry-after");
      let delayMs: number | null = null;
      if (retryAfter) {
        const parsed = Number(retryAfter);
        if (Number.isFinite(parsed)) delayMs = parsed * 1000;
      }

      const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const jitter = Math.floor(Math.random() * exp);
      const backoffMs = delayMs ? Math.max(delayMs, jitter) : jitter;

      await sleep(backoffMs);
      continue;
    } catch (e) {
      lastErr = e;
      if (attempt === retries) break;

      const exp = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const jitter = Math.floor(Math.random() * exp);
      await sleep(jitter);
    }
  }

  if (lastRes) return lastRes;
  throw lastErr ?? new Error("Request failed");
}

function sanitize(s?: string | null): string {
  return (s ?? "").trim();
}

function buildEmbeddingInput(payload: InnovationRow): string {
  return [
    `Title: ${sanitize(payload.title)}`,
    `Tagline: ${sanitize(payload.tagline)}`,
    `Category: ${sanitize(payload.category)}`,
    `Custom category: ${sanitize(payload.custom_category)}`,
    `Description: ${sanitize(payload.description)}`,
    `Without product: ${sanitize(payload.without_product)}`,
    `With product: ${sanitize(payload.with_product)}`,
  ]
    .map((line) => line || "")
    .join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const adminSecret = Deno.env.get("EMBEDDING_BACKFILL_SECRET");
    const providedSecret = req.headers.get("x-backfill-secret");
    if (!adminSecret || !providedSecret || adminSecret !== providedSecret) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = (await req.json().catch(() => ({}))) as BackfillRequest;
    const rawBatch = body?.batch_size ?? 100;
    const batchSize = Math.min(Math.max(rawBatch, 10), 200);

    const { data: rows, error: selectError } = await supabase
      .from("innovations")
      .select(
        "id, innovator_id, title, tagline, category, custom_category, description, without_product, with_product",
      )
      .eq("status", "published")
      .is("embedding", null)
      .order("created_at", { ascending: true })
      .limit(batchSize);

    if (selectError) {
      console.error("Backfill select error:", selectError);
      return new Response(JSON.stringify({ error: "Failed to fetch rows" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No rows to backfill" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY_TEXT");
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY_TEXT" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updates: { id: string; embedding: number[]; embedding_model: string; embedding_updated_at: string }[] = [];

    for (const row of rows as InnovationRow[]) {
      const embeddingInput = buildEmbeddingInput(row);

      const embeddingRes = await fetchWithRetry(
        "https://api.openai.com/v1/embeddings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: EMBEDDING_MODEL,
            input: embeddingInput,
            dimensions: EMBEDDING_DIMENSION,
            encoding_format: "float",
          }),
        },
        2,
        400,
      );

      const raw = await embeddingRes.text();
      if (!embeddingRes.ok) {
        console.error("Embedding generation failed for", row.id, embeddingRes.status, raw);
        return new Response(
          JSON.stringify({
            error: "Embedding generation failed",
            failed_id: row.id,
            status: embeddingRes.status,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const json = JSON.parse(raw);
      const embedding = json?.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
        console.error("Unexpected embedding shape for", row.id);
        return new Response(
          JSON.stringify({ error: "Malformed embedding response", failed_id: row.id }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      updates.push({
        id: row.id,
        embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString(),
      });
    }

    const { error: upsertError } = await supabase
      .from("innovations")
      .upsert(updates, { onConflict: "id", returning: "minimal" });

    if (upsertError) {
      console.error("Backfill upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to save embeddings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        processed: updates.length,
        message: `Backfilled ${updates.length} innovations`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("backfill-innovation-embeddings error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to backfill embeddings" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
