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
  // Responses API commonly returns output_text as a string
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
  // ✅ CORS preflight must return OK (2xx) + CORS headers
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

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 400,
      }),
    });

    const raw = await openaiRes.text();

    if (!openaiRes.ok) {
      console.error("OpenAI error:", openaiRes.status, raw);
      return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(raw);
    const rewritten = extractOutputText(result);

    if (!rewritten) {
      console.error("Unexpected OpenAI response:", result);
      return new Response(
        JSON.stringify({ error: "Model response missing rewritten text" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
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
