import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  problem_id?: string;
  refresh_org?: boolean;
};

type ProblemRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: string;
  requirements: string[] | null;
  tags: string[] | null;
  status: string;
  visibility: string;
  embedding: number[] | null;
  embedding_model: string | null;
  embedding_updated_at: string | null;
  updated_at: string;
  created_at: string;
};

type InnovationCandidate = {
  id: string;
  innovator_id: string;
  title: string;
  tagline: string;
  category: string;
  custom_category: string | null;
  description: string;
  similarity: number;
};

type InnovationRow = InnovationCandidate & {
  status?: string;
  visibility?: string;
  without_product?: string;
  with_product?: string;
};

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSION = 1536;
const MATCH_CANDIDATE_LIMIT = 80;
const STORED_MATCH_LIMIT = 30;
const REFRESH_PROBLEM_LIMIT = 20;
const REFRESH_MINUTES = 2;

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

function sanitize(value?: string | null): string {
  return (value ?? "").trim();
}

function buildProblemEmbeddingInput(row: ProblemRow): string {
  const requirements = row.requirements?.join("; ") ?? "";
  const tags = row.tags?.join(", ") ?? "";
  return [
    `Title: ${sanitize(row.title)}`,
    `Description: ${sanitize(row.description)}`,
    `Category: ${sanitize(row.category)}`,
    `Requirements: ${sanitize(requirements)}`,
    `Tags: ${sanitize(tags)}`,
    `Visibility: ${sanitize(row.visibility)}`,
  ]
    .map((line) => line || "")
    .join("\n");
}

function mapProblemCategoryToInnovation(category: string | null): string | null {
  switch ((category ?? "").toLowerCase()) {
    case "technology":
      return "saas";
    case "healthcare":
      return "healthtech";
    case "finance":
      return "fintech";
    case "sustainability":
      return "climatetech";
    case "education":
      return "edtech";
    case "infrastructure":
    case "manufacturing":
      return "hardware";
    case "agriculture":
      return "other";
    default:
      return null;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 2);
}

function extractKeywords(problem: ProblemRow): string[] {
  const keywords: string[] = [];
  if (problem.tags) keywords.push(...problem.tags);
  if (problem.requirements) keywords.push(...problem.requirements);
  keywords.push(problem.title, problem.description);
  return Array.from(new Set(tokenize(keywords.join(" "))));
}

function calculateScores(
  candidate: InnovationRow,
  similarity: number,
  problem: ProblemRow,
  keywords: string[],
): {
  score_total: number;
  score_relevance: number;
  score_feasibility: number;
  score_impact: number;
  score_risk: number;
  reasons: string[];
  matchedTags: string[];
} {
  const normalizedSim = Math.max(0, Math.min(1, similarity));
  const score_relevance = Math.round(normalizedSim * 40);

  const innovationText = [
    candidate.title,
    candidate.tagline,
    candidate.description,
    candidate.with_product ?? "",
    candidate.without_product ?? "",
  ].join(" ");

  const innovationTokens = new Set(tokenize(innovationText));
  const matchedTags = keywords.filter((kw) => innovationTokens.has(kw)).slice(0, 6);
  const coverageRatio = keywords.length > 0 ? matchedTags.length / keywords.length : 0;

  const statusWeight = candidate.status === "featured" ? 5 : 3;
  const feasibilityBase = 10 + statusWeight;
  const feasibilityFromCoverage = Math.round(Math.min(coverageRatio * 15, 12));
  const detailBonus =
    (candidate.with_product && candidate.with_product.length > 120 ? 3 : 0) +
    (candidate.without_product && candidate.without_product.length > 120 ? 2 : 0);
  const score_feasibility = Math.min(25, feasibilityBase + feasibilityFromCoverage + detailBonus);

  const categoryAligned =
    mapProblemCategoryToInnovation(problem.category) === candidate.category ? 6 : 0;
  const impactFromSimilarity = Math.round(normalizedSim * 15);
  const requirementWeight = Math.min(6, Math.round(coverageRatio * 10));
  const score_impact = Math.min(25, impactFromSimilarity + categoryAligned + requirementWeight);

  const riskPenalty =
    (normalizedSim < 0.7 ? (0.7 - normalizedSim) * 10 : 0) +
    (innovationTokens.size < 40 ? 2 : 0);
  const score_risk = Math.max(0, Math.min(10, 10 - Math.round(riskPenalty)));

  const score_total = score_relevance + score_feasibility + score_impact + score_risk;

  const reasons: string[] = [];
  reasons.push(`High semantic similarity (${(normalizedSim * 100).toFixed(1)}%) to the problem`);
  if (matchedTags.length > 0) {
    reasons.push(`Addresses key terms: ${matchedTags.slice(0, 3).join(", ")}`);
  }
  if (categoryAligned) {
    reasons.push(`Category alignment (${problem.category} → ${candidate.category})`);
  }
  if (detailBonus >= 4) {
    reasons.push("Clear implementation details provided");
  }
  if (score_risk >= 8) {
    reasons.push("Low delivery risk based on maturity signals");
  }

  while (reasons.length < 3) {
    reasons.push("Relevant based on vector search and metadata");
  }

  return {
    score_total,
    score_relevance,
    score_feasibility,
    score_impact,
    score_risk,
    reasons: reasons.slice(0, 5),
    matchedTags,
  };
}

async function ensureProblemEmbedding(
  problem: ProblemRow,
  supabaseService: ReturnType<typeof createClient>,
): Promise<number[]> {
  if (Array.isArray(problem.embedding) && problem.embedding.length === EMBEDDING_DIMENSION) {
    return problem.embedding;
  }

  const openAiKey = Deno.env.get("OPENAI_API_KEY_TEXT");
  if (!openAiKey) {
    throw new Error("Missing OPENAI_API_KEY_TEXT");
  }

  const embeddingInput = buildProblemEmbeddingInput(problem);
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
    throw new Error("Failed to generate embedding");
  }

  const embeddingJson = JSON.parse(embeddingRaw);
  const embedding = embeddingJson?.data?.[0]?.embedding;
  if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSION) {
    console.error("Malformed embedding response");
    throw new Error("Embedding response malformed");
  }

  const { error: updateError } = await supabaseService
    .from("problems")
    .update({
      embedding,
      embedding_model: EMBEDDING_MODEL,
      embedding_updated_at: new Date().toISOString(),
    })
    .eq("id", problem.id);

  if (updateError) {
    console.error("Update embedding error:", updateError);
    throw new Error("Failed to persist embedding");
  }

  return embedding;
}

async function loadProblem(
  supabaseService: ReturnType<typeof createClient>,
  problemId: string,
): Promise<ProblemRow | null> {
  const { data, error } = await supabaseService
    .from("problems")
    .select(
      "id, owner_id, title, description, category, requirements, tags, status, visibility, embedding, embedding_model, embedding_updated_at, updated_at, created_at",
    )
    .eq("id", problemId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load problem", error);
    throw new Error("Failed to load problem");
  }

  return (data as ProblemRow | null) ?? null;
}

async function fetchCandidates(
  supabaseService: ReturnType<typeof createClient>,
  embedding: number[],
  category: string | null,
): Promise<InnovationRow[]> {
  const { data, error } = await supabaseService.rpc("match_innovations_published", {
    query_embedding: embedding,
    match_count: MATCH_CANDIDATE_LIMIT,
    optional_category: category,
  });

  if (error) {
    console.error("match_innovations_published error:", error);
    throw new Error("Failed to search innovations");
  }

  return (data as InnovationCandidate[]).map((row) => row as InnovationRow);
}

async function hydrateCandidateDetails(
  supabaseService: ReturnType<typeof createClient>,
  candidateIds: string[],
): Promise<Map<string, Partial<InnovationRow>>> {
  if (candidateIds.length === 0) return new Map();
  const { data, error } = await supabaseService
    .from("innovations")
    .select("id, status, visibility, with_product, without_product")
    .in("id", candidateIds);

  if (error) {
    console.error("Failed to hydrate innovations", error);
    return new Map();
  }

  const map = new Map<string, Partial<InnovationRow>>();
  for (const row of data ?? []) {
    map.set(row.id as string, row as Partial<InnovationRow>);
  }
  return map;
}

async function storeMatches(
  supabaseService: ReturnType<typeof createClient>,
  orgId: string,
  problemId: string,
  matches: Array<InnovationRow & { scoring: ReturnType<typeof calculateScores> }>,
) {
  const rows = matches.slice(0, STORED_MATCH_LIMIT).map((m) => ({
    org_id: orgId,
    problem_id: problemId,
    innovation_id: m.id,
    score_total: m.scoring.score_total,
    score_relevance: m.scoring.score_relevance,
    score_feasibility: m.scoring.score_feasibility,
    score_impact: m.scoring.score_impact,
    score_risk: m.scoring.score_risk,
    reasons: m.scoring.reasons,
    matched_tags: m.scoring.matchedTags,
  }));

  const innovationIds = rows.map((r) => r.innovation_id);

  if (innovationIds.length > 0) {
    const inList = `(${innovationIds.map((id) => `"${id}"`).join(",")})`;
    const { error: deleteError } = await supabaseService
      .from("problem_innovation_matches")
      .delete()
      .eq("problem_id", problemId)
      .not("innovation_id", "in", inList);

    if (deleteError) {
      console.warn("Cleanup error (non-fatal):", deleteError);
    }
  } else {
    await supabaseService.from("problem_innovation_matches").delete().eq("problem_id", problemId);
  }

  const { error: upsertError } = await supabaseService
    .from("problem_innovation_matches")
    .upsert(rows, { onConflict: "org_id,problem_id,innovation_id" });

  if (upsertError) {
    console.error("Upsert matches error:", upsertError);
    throw new Error("Failed to store matches");
  }
}

async function processProblem(
  supabaseService: ReturnType<typeof createClient>,
  orgId: string,
  problemId: string,
) {
  const problem = await loadProblem(supabaseService, problemId);
  if (!problem) {
    throw new Error("Problem not found");
  }
  if (problem.owner_id !== orgId) {
    throw new Error("Forbidden");
  }
  if (problem.status === "draft") {
    return { stored: 0, skipped: true, problem_id: problem.id };
  }

  const embedding = await ensureProblemEmbedding(problem, supabaseService);
  const candidates = await fetchCandidates(
    supabaseService,
    embedding,
    mapProblemCategoryToInnovation(problem.category),
  );
  const detailsMap = await hydrateCandidateDetails(
    supabaseService,
    candidates.map((c) => c.id),
  );

  const keywords = extractKeywords(problem);
  const scored = candidates.map((c) => {
    const enriched = { ...c, ...(detailsMap.get(c.id) ?? {}) } as InnovationRow;
    const scoring = calculateScores(enriched, c.similarity ?? 0, problem, keywords);
    return { ...enriched, scoring };
  });

  scored.sort((a, b) => b.scoring.score_total - a.scoring.score_total);
  await storeMatches(supabaseService, orgId, problem.id, scored);

  return {
    stored: Math.min(scored.length, STORED_MATCH_LIMIT),
    skipped: false,
    problem_id: problem.id,
  };
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  const apiKeyHeader = req.headers.get("apikey") ?? req.headers.get("apikey");
  console.log("generate-problem-innovation-matches headers", {
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
    const body = (await req.json()) as RequestBody;
    const refreshOrg = Boolean(body?.refresh_org);
    const problemId = sanitize(body?.problem_id);

    if (!refreshOrg && !problemId) {
      return new Response(JSON.stringify({ error: "Missing problem_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (refreshOrg) {
      const { data: refreshState } = await supabaseService
        .from("problem_match_refresh_state")
        .select("last_refreshed_at")
        .eq("org_id", userId)
        .maybeSingle();

      if (refreshState?.last_refreshed_at) {
        const last = new Date(refreshState.last_refreshed_at);
        const nextAllowed = new Date(last.getTime() + REFRESH_MINUTES * 60 * 1000);
        if (nextAllowed > new Date()) {
          const retryAfter = Math.ceil((nextAllowed.getTime() - Date.now()) / 1000);
          return new Response(
            JSON.stringify({
              error: `Refresh is limited to once every ${REFRESH_MINUTES} minutes.`,
              code: "rate_limited",
              retry_after_seconds: retryAfter,
            }),
            {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let { data: problems, error: problemsError } = await supabaseService
        .from("problems")
        .select("id, owner_id, title, description, category, requirements, tags, status, visibility, embedding, embedding_model, embedding_updated_at, updated_at, created_at")
        .eq("owner_id", userId)
        .neq("status", "draft")
        .gte("updated_at", thirtyDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(REFRESH_PROBLEM_LIMIT);

      if (problemsError) {
        console.error("Failed to load problems for refresh", problemsError);
        return new Response(JSON.stringify({ error: "Failed to load problems" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!problems || problems.length === 0) {
        const fallback = await supabaseService
          .from("problems")
          .select("id, owner_id, title, description, category, requirements, tags, status, visibility, embedding, embedding_model, embedding_updated_at, updated_at, created_at")
          .eq("owner_id", userId)
          .neq("status", "draft")
          .order("updated_at", { ascending: false })
          .limit(REFRESH_PROBLEM_LIMIT);
        problems = fallback.data ?? [];
      }

      const results = [];
      for (const p of problems ?? []) {
        try {
          const res = await processProblem(supabaseService, userId, p.id);
          results.push(res);
        } catch (err) {
          console.error("Problem refresh failed", p.id, err);
        }
      }

      await supabaseService
        .from("problem_match_refresh_state")
        .upsert({
          org_id: userId,
          refreshed_by: userId,
          last_refreshed_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({
          ok: true,
          refreshed_count: results.length,
          results,
          last_refreshed_at: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const result = await processProblem(supabaseService, userId, problemId);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-problem-innovation-matches error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate matches" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
