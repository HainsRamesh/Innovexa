import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = { title?: string; count?: number };

function stripCodeFences(s: string): string {
  return (s || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

function extractJsonArray(s: string): string[] {
  const cleaned = stripCodeFences(s);

  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x).trim()).filter(Boolean);
    }
  } catch {}

  // Fallback: find first [...] block and parse it
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = cleaned.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) {
        return parsed.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {}
  }

  // Last fallback: split lines and clean bullets
  return cleaned
    .split("\n")
    .map((l) => l.replace(/^[\s,*\-–\d.)]+/, "").trim())
    .filter((l) => l.length >= 8 && !["[", "]"].includes(l));
}

function cleanTaglines(taglines: string[], count: number): string[] {
  const banned = new Set(["```json", "```", "json", "[", "]"]);

  return taglines
    .map((t) => String(t ?? "").trim())
    // remove wrapping quotes from strings like "\"Tagline\""
    .map((t) => t.replace(/^"+|"+$/g, "").trim())
    // drop fence tokens / brackets / junk
    .filter((t) => t.length > 0)
    .filter((t) => !banned.has(t))
    .filter((t) => !t.includes("```"))
    // remove any leftover leading/trailing commas
    .map((t) => t.replace(/^,+|,+$/g, "").trim())
    // basic quality gate so schema doesn't fail
    .filter((t) => t.length >= 10 && t.length <= 200)
    .slice(0, count);
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
    // Authentication check
    const authHeader = req.headers.get("Authorization");
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

    const userId = claimsData.claims.sub;
    console.log(`Authenticated request from user: ${userId}`);

    const { title, count = 5 } = (await req.json()) as ReqBody;
    const cleanTitle = (title ?? "").trim();

    if (!cleanTitle) {
      return new Response(JSON.stringify({ error: "Title is required" }), {
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

    const prompt = [
      `Generate exactly ${count} short, catchy, professional taglines for: "${cleanTitle}".`,
      `Rules:`,
      `- Each tagline under 12 words`,
      `- No numbering, no bullets, no code fences`,
      `- Return ONLY a valid JSON array of strings (no extra text)`,
      `Example: ["Tagline 1","Tagline 2"]`,
    ].join("\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: prompt,
        max_output_tokens: 200,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      console.error("OpenAI error:", response.status, raw);
      return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = JSON.parse(raw);
    const outputText: string =
      (typeof json?.output_text === "string" && json.output_text) ||
      json?.output?.[0]?.content?.[0]?.text ||
      "";

    const parsed = extractJsonArray(outputText);
    const cleaned = cleanTaglines(parsed, count);

    if (cleaned.length === 0) {
      console.error("No taglines parsed/cleaned. Raw output:", outputText);
      return new Response(JSON.stringify({ error: "Failed to parse taglines" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ taglines: cleaned }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-taglines error:", err);
    return new Response(JSON.stringify({ error: "Failed to generate taglines" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
