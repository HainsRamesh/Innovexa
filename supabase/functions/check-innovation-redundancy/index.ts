import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RedundancyRequest = {
  innovator_id?: string;
  title?: string;
  tagline?: string;
  category?: string;
  custom_category?: string | null;
  description?: string;
  without_product?: string;
  with_product?: string;
};

type MatchRow = {
  id: string;
  innovator_id: string;
  title: string;
  tagline: string;
  category: string;
  custom_category: string | null;
  description: string;
  similarity: number;
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

function buildEmbeddingInput(payload: RedundancyRequest): string {
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

function bucketForSimilarity(similarity: number): "Likely duplicate" | "Very similar" | "Related" | null {
  if (similarity >= 0.9) return "Likely duplicate";
  if (similarity >= 0.82) return "Very similar";
  if (similarity >= 0.75) return "Related";
  return null;
}

function makeSnippet(description: string): string {
  const clean = sanitize(description);
  if (clean.length <= 160) return clean;
  return `${clean.slice(0, 157)}...`;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("apikey");
  console.log("check-innovation-redundancy headers", {
    hasAuth: !!authHeader,
    hasApiKey: !!apiKeyHeader,
    bearer: authHeader?.startsWith("Bearer "),
  });

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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RedundancyRequest;
    const {
      innovator_id,
      title,
      tagline,
      category,
      custom_category,
      description,
      without_product,
      with_product,
    } = body;
    
    const allowedCategories = new Set([
      "ai",
      "healthtech",
      "fintech",
      "climatetech",
      "edtech",
      "saas",
    ]);

    if (!category || typeof category !== "string" || !allowedCategories.has(category)) {
      return new Response(JSON.stringify({ error: "Invalid category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const required = [
      ["innovator_id", innovator_id],
      ["title", title],
      ["tagline", tagline],
      ["category", category],
      ["description", description],
      ["without_product", without_product],
      ["with_product", with_product],
    ];

    const missing = required.filter(([, val]) => !val || typeof val !== "string" || !val.trim());
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `Missing fields: ${missing.map(([k]) => k).join(", ")}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const embeddingInput = buildEmbeddingInput({
      innovator_id,
      title,
      tagline,
      category,
      custom_category: custom_category ?? null,
      description,
      without_product,
      with_product,
    });

    const openAiKey = Deno.env.get("OPENAI_API_KEY_TEXT");
    if (!openAiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY_TEXT" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const embeddingRaw = await embeddingRes.text();
    if (!embeddingRes.ok) {
      console.error("Embedding error:", embeddingRes.status, embeddingRaw);
      const status = embeddingRes.status === 429 ? 503 : 500;
      return new Response(
        JSON.stringify({ error: "Failed to generate embedding" }),
        {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const embeddingJson = JSON.parse(embeddingRaw);
    const embedding = embeddingJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
      console.error("Unexpected embedding response shape");
      return new Response(
        JSON.stringify({ error: "Embedding response malformed" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Phase 1: category-scoped search
    const matchCount = 10;
    const categoryMatchesRes = await supabase.rpc("match_innovations_published", {
      query_embedding: embedding,
      match_count: matchCount,
      category_filter: category,
    });

    if (categoryMatchesRes.error) {
      console.error("match_innovations_published error:", categoryMatchesRes.error);
      return new Response(JSON.stringify({ error: "Failed to search innovations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const combined: MatchRow[] = [];
    const seen = new Set<string>();

    const addMatches = (rows: MatchRow[] | null | undefined) => {
      for (const row of rows ?? []) {
        if (!seen.has(row.id)) {
          seen.add(row.id);
          combined.push(row);
        }
      }
    };

    addMatches(categoryMatchesRes.data as MatchRow[]);

    const remaining = matchCount - combined.length;
    if (remaining > 0) {
      const fallbackRes = await supabase.rpc("match_innovations_published", {
        query_embedding: embedding,
        match_count: remaining,
        category_filter: null,
        exclude_ids: [...seen],
      });

      if (fallbackRes.error) {
        console.error("fallback search error:", fallbackRes.error);
        return new Response(JSON.stringify({ error: "Failed to search innovations" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      addMatches(fallbackRes.data as MatchRow[]);
    }

    combined.sort((a, b) => b.similarity - a.similarity);

    const titleLower = sanitize(title).toLowerCase();
    const duplicates = combined.filter(
      (m) =>
        m.innovator_id === innovator_id &&
        sanitize(m.title).toLowerCase() === titleLower &&
        m.similarity >= 0.92,
    );

    if (duplicates.length > 0) {
      const matches = duplicates.map((m) => ({
        id: m.id,
        title: m.title,
        tagline: m.tagline,
        category: m.category,
        similarity: m.similarity,
        bucket: bucketForSimilarity(m.similarity),
        snippet: makeSnippet(m.description),
      }));

      return new Response(
        JSON.stringify({
          block: true,
          reason: "This submission matches an existing post by the same user",
          matches,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const filtered = combined
      .filter((m) => m.similarity >= 0.75)
      .map((m) => ({
        id: m.id,
        title: m.title,
        tagline: m.tagline,
        category: m.category,
        similarity: m.similarity,
        bucket: bucketForSimilarity(m.similarity),
        snippet: makeSnippet(m.description),
      }));

    const warning = filtered[0]?.similarity >= 0.82;

    return new Response(
      JSON.stringify({
        block: false,
        warning: Boolean(warning),
        matches: filtered,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("check-innovation-redundancy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check redundancy" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
