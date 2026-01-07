import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  title?: string;
  count?: number;
};

function extractOutputText(result: any): string {
  if (typeof result?.output_text === "string") return result.output_text;
  const out = result?.output;
  if (Array.isArray(out)) {
    for (const item of out) {
      const content = item?.content;
      if (Array.isArray(content)) {
        for (const c of content) {
          if (typeof c?.text === "string") return c.text;
        }
      }
    }
  }
  return "";
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
    const { title, count = 5 } = (await req.json()) as ReqBody;

    const cleanTitle = (title ?? "").trim();
    const n = Math.max(1, Math.min(10, Number(count) || 5));

    if (!cleanTitle) {
      return new Response(JSON.stringify({ error: "title is required" }), {
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
      `Generate ${n} short, catchy taglines for this innovation title: "${cleanTitle}".\n` +
      `Rules:\n` +
      `- Each tagline should be 6–12 words.\n` +
      `- Professional, clear, no hype, no emojis.\n` +
      `- Return ONLY a JSON array of strings.\n`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 300,
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
    const text = extractOutputText(result).trim();

    let taglines: string[] = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) taglines = parsed.map(String);
    } catch {
      // fallback: split lines if model didn't return JSON
      taglines = text
        .split("\n")
        .map((s) => s.replace(/^[\-\d\.\)\s]+/, "").trim())
        .filter(Boolean);
    }

    taglines = taglines.slice(0, n);

    return new Response(JSON.stringify({ taglines }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-taglines error:", e);
    return new Response(JSON.stringify({ error: "Failed to generate taglines" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
