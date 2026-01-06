import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RewriteRequest = {
  text?: string;
  tone?: "professional" | "friendly" | "concise";
  maxWords?: number;
};

function extractOutputText(result: any): string | null {
  // Most common: output_text is a string
  if (typeof result?.output_text === "string" && result.output_text.trim()) {
    return result.output_text.trim();
  }

  // Fallback: scan output array
  const output = result?.output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (typeof c?.text === "string" && c.text.trim()) {
            return c.text.trim();
          }
        }
      }
    }
  }

  return null;
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
    const { text, tone = "professional", maxWords = 150 } =
      (await req.json()) as RewriteRequest;

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt =
      `Rewrite the following innovation description to be clearer and easier to understand while staying ${tone} and professional.\n` +
      `Rules:\n` +
      `- Do NOT add any new claims or facts.\n` +
      `- Preserve ALL details already mentioned; only improve wording and structure.\n` +
      `- No headings, no bullets. Return ONLY the rewritten paragraph.\n` +
      `- Keep it within ${maxWords} words.\n\n` +
      `Original:\n${text.trim()}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        // ✅ simplest + correct for Responses API
        input: prompt,
        max_output_tokens: 400,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      console.error("OpenAI error:", response.status, raw);
      throw new Error(raw || "OpenAI request failed");
    }

    const result = JSON.parse(raw);
    const rewritten = extractOutputText(result);

    if (!rewritten) {
      console.error("Unexpected OpenAI response:", result);
      throw new Error("Model response did not contain rewritten text");
    }

    return new Response(JSON.stringify({ rewritten }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("rewrite-description error:", error);
    return new Response(JSON.stringify({ error: "Failed to rewrite description" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
