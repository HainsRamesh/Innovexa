import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  innovation_id?: string;
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
  status: string;
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

function buildEmbeddingInput(row: InnovationRow): string {
  return [
    `Title: ${sanitize(row.title)}`,
    `Tagline: ${sanitize(row.tagline)}`,
    `Category: ${sanitize(row.category)}`,
    `Custom category: ${sanitize(row.custom_category)}`,
    `Description: ${sanitize(row.description)}`,
    `Without product: ${sanitize(row.without_product)}`,
    `With product: ${sanitize(row.with_product)}`,
  ]
    .map((line) => line || "")
    .join("\n");
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("apikey");
  console.log("upsert-innovation-embedding headers", {
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
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);

      if (userError || !userData?.user?.id) {
        console.error("JWT validation failed:", userError);
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = userData.user.id;

      // (keep your body parsing after this)
      const body = (await req.json()) as RequestBody;
      const innovationId = sanitize(body?.innovation_id);
      if (!innovationId) {
        return new Response(JSON.stringify({ error: "Missing innovation_id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }


    const { data: row, error: selectError } = await supabaseService
      .from("innovations")
      .select(
        "id, innovator_id, title, tagline, category, custom_category, description, without_product, with_product, status",
      )
      .eq("id", innovationId)
      .maybeSingle();

    if (selectError) {
      console.error("Select innovation error:", selectError);
      return new Response(JSON.stringify({ error: "Failed to fetch innovation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!row) {
      return new Response(JSON.stringify({ error: "Innovation not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.innovator_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.status !== "published" && row.status !== "featured") {
      return new Response(JSON.stringify({ error: "Innovation must be published or featured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddingInput = buildEmbeddingInput(row as InnovationRow);

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
      console.error("Embedding request failed:", embeddingRes.status, embeddingRaw);
      const status = embeddingRes.status === 429 ? 503 : 500;
      return new Response(JSON.stringify({ error: "Failed to generate embedding" }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const embeddingJson = JSON.parse(embeddingRaw);
    const embedding = embeddingJson?.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
      console.error("Malformed embedding response");
      return new Response(JSON.stringify({ error: "Embedding response malformed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await supabaseService
      .from("innovations")
      .update({
        embedding,
        embedding_model: EMBEDDING_MODEL,
        embedding_updated_at: new Date().toISOString(),
      })
      .eq("id", innovationId);

    if (updateError) {
      console.error("Update embedding error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save embedding" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        innovation_id: innovationId,
        embedding_model: EMBEDDING_MODEL,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("upsert-innovation-embedding error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to upsert embedding" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
