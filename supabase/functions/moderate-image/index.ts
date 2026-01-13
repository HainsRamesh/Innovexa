import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEMP_BUCKET = "temp-uploads";
const APPROVED_BUCKET = "innovations";
const QUARANTINE_BUCKET = "quarantine-uploads";
const PENDING_CACHE_WINDOW_MS = 60_000;

type ModerationRequest = {
  asset_id?: string;
  bucket: string;
  path: string;
  user_id: string;
  kind: "cover" | "gallery";
  innovation_id?: string | null;
};

type ModerationDecision = {
  decision: "approve" | "reject";
  reasons: string[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function parseRetryAfter(headerValue: string | null): number | null {
  if (!headerValue) return null;

  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) {
    return seconds * 1000;
  }

  const date = new Date(headerValue).getTime();
  if (!Number.isNaN(date)) {
    const delta = date - Date.now();
    return delta > 0 ? delta : null;
  }

  return null;
}

async function fetchWithBackoff(
  requestFn: () => Promise<Response>,
  attempts = 3,
  baseDelayMs = 500,
): Promise<{ response: Response; exhausted: boolean }> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    lastResponse = await requestFn();

    if (lastResponse.status !== 429) {
      return { response: lastResponse, exhausted: false };
    }

    if (attempt === attempts - 1) {
      break;
    }

    const retryAfter = parseRetryAfter(lastResponse.headers.get("retry-after"));
    const backoffMs = retryAfter ?? baseDelayMs * 2 ** attempt;
    await sleep(backoffMs);
  }

  if (!lastResponse) {
    throw new Error("No response received from request");
  }

  return { response: lastResponse, exhausted: true };
}

function evaluateModeration(result: any): ModerationDecision {
  const output = result?.results?.[0];
  const categories = output?.categories ?? {};
  const scores = output?.category_scores ?? {};

  const thresholds: Record<string, number> = {
    sexual: 0.4,
    "sexual/minors": 0.1,
    violence: 0.45,
    "violence/graphic": 0.35,
    "self-harm": 0.3,
    "self-harm/intent": 0.25,
    "self-harm/instructions": 0.25,
    hate: 0.45,
    "hate/threatening": 0.35,
    harassment: 0.45,
    "harassment/threatening": 0.35,
    abuse: 0.35,
  };

  const reasons: string[] = [];

  for (const [key, threshold] of Object.entries(thresholds)) {
    const flagged = categories?.[key] === true;
    const score = typeof scores?.[key] === "number" ? scores[key] : 0;
    if (flagged || score >= threshold) {
      reasons.push(`${key} ${(score * 100).toFixed(0)}%`);
    }
  }

  if (reasons.length > 0) {
    return { decision: "reject", reasons };
  }

  return { decision: "approve", reasons };
}

async function updateAssetStatus(
  supabaseAdmin: ReturnType<typeof createClient>,
  assetId: string,
  values: Record<string, any>,
) {
  await supabaseAdmin
    .from("media_assets")
    .update({ ...values, moderated_at: new Date().toISOString() })
    .eq("id", assetId);
}

// Convert bytes -> base64 (chunked to avoid call stack issues)
function toBase64(u8: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < u8.length; i += chunkSize) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as ModerationRequest;
    const { asset_id, bucket, path, user_id, kind, innovation_id } = body;

    if (!asset_id || !bucket || !path || !user_id || !kind) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!openAiKey || !supabaseUrl || !serviceRoleKey) {
      console.error("Missing environment variables");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check existing asset status to avoid duplicate moderation attempts
    const { data: assetRow, error: assetLookupError } = await supabaseAdmin
      .from("media_assets")
      .select("status, bucket, path, public_url, moderation_result, moderated_at")
      .eq("id", asset_id)
      .single();

    if (assetLookupError) {
      console.error("Failed to load media asset row", assetLookupError);
    } else if (assetRow) {
      const existingStatus = assetRow.status as ModerationDecision["decision"] | "pending" | "error";
      const recentModeration =
        assetRow.moderated_at && Date.now() - new Date(assetRow.moderated_at).getTime() < PENDING_CACHE_WINDOW_MS;

      if (existingStatus === "approved") {
        return new Response(
          JSON.stringify({
            status: "approved",
            publicUrl: assetRow.public_url,
            path: assetRow.path,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (existingStatus === "rejected") {
        const storedDecision = assetRow.moderation_result
          ? evaluateModeration(assetRow.moderation_result)
          : { reasons: ["Unsafe content detected"] };
        return new Response(
          JSON.stringify({
            status: "rejected",
            reasons: storedDecision.reasons,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (existingStatus === "pending" && recentModeration) {
        return new Response(JSON.stringify({ status: "pending" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const sourceBucket = assetRow?.bucket || bucket;
    const sourcePath = assetRow?.path || path;

    // Download the image bytes once (we also reuse these bytes for approve/quarantine upload)
    const download = await supabaseAdmin.storage.from(sourceBucket).download(sourcePath);
    if (download.error || !download.data) {
      console.error("Failed to download temp image", download.error);
      await updateAssetStatus(supabaseAdmin, asset_id, { status: "error" });
      return new Response(JSON.stringify({ error: "Unable to retrieve image for processing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await download.data.arrayBuffer();
    const contentType = download.data.type || "image/jpeg";

    // Build a data URL so OpenAI doesn't need to fetch a signed URL
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = toBase64(bytes);
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Call OpenAI Moderations with rate-limit aware retry/backoff
    const { response: moderationRes, exhausted } = await fetchWithBackoff(
      () =>
        fetch("https://api.openai.com/v1/moderations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "omni-moderation-latest",
            input: [
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          }),
        }),
      3,
      500,
    );

    const moderationJson = await moderationRes.json().catch(() => null);

    if (moderationRes.status === 429 && exhausted) {
      console.warn("OpenAI moderation rate limited after retries");
      await updateAssetStatus(supabaseAdmin, asset_id, { status: "error" });
      return new Response(JSON.stringify({ error: "Rate limited, please try again" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!moderationRes.ok) {
      const msg = moderationJson?.error?.message ?? JSON.stringify(moderationJson);
      console.error("OpenAI moderation error", moderationRes.status, moderationJson);
      await updateAssetStatus(supabaseAdmin, asset_id, { status: "error" });
      return new Response(JSON.stringify({ error: `Moderation failed: ${msg}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moderationResult = moderationJson;
    const decision = evaluateModeration(moderationResult);

    const fileName = sourcePath.split("/").pop() ?? `image-${Date.now()}`;
    const fileExt = fileName.includes(".") ? fileName.split(".").pop() ?? "jpg" : "jpg";

    if (decision.decision === "reject") {
      // Drop the unsafe image from the temp bucket
      await supabaseAdmin.storage.from(sourceBucket).remove([sourcePath]);

      // Optionally retain a copy in quarantine for audit
      await supabaseAdmin.storage
        .from(QUARANTINE_BUCKET)
        .upload(`${user_id}/${fileName}`, arrayBuffer, { contentType, upsert: false })
        .catch((error) => console.error("Quarantine upload failed", error));

      await updateAssetStatus(supabaseAdmin, asset_id, {
        status: "rejected",
        moderation_result: moderationResult,
      });

      return new Response(
        JSON.stringify({
          status: "rejected",
          reasons: decision.reasons,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Approved: move to public bucket and clean up temp copy
    const approvedPath = `approved/${user_id}/${crypto.randomUUID()}.${fileExt}`;
    const upload = await supabaseAdmin.storage.from(APPROVED_BUCKET).upload(approvedPath, arrayBuffer, {
      contentType,
      upsert: false,
    });

    if (upload.error) {
      console.error("Failed to store approved image", upload.error);
      await updateAssetStatus(supabaseAdmin, asset_id, { status: "error" });
      return new Response(JSON.stringify({ error: "Unable to store approved image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseAdmin.storage.from(sourceBucket).remove([sourcePath]);

    const { data: publicData } = supabaseAdmin.storage.from(APPROVED_BUCKET).getPublicUrl(approvedPath);
    const publicUrl = publicData?.publicUrl;

    await updateAssetStatus(supabaseAdmin, asset_id, {
      status: "approved",
      bucket: APPROVED_BUCKET,
      path: approvedPath,
      public_url: publicUrl,
      innovation_id: innovation_id ?? null,
      moderation_result: moderationResult,
    });

    console.log(`Image approved for ${user_id} (${kind}) -> ${approvedPath}`);

    return new Response(
      JSON.stringify({
        status: "approved",
        publicUrl,
        path: approvedPath,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("moderate-image error", error);
    return new Response(JSON.stringify({ error: "Internal error during moderation" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
