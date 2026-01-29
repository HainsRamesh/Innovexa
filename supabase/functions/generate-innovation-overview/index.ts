import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OverviewRequest {
  title: string;
  tagline: string;
  category: string;
  description: string;
}

const categoryLabels: Record<string, string> = {
  ai: "Artificial Intelligence",
  healthtech: "Health Tech",
  fintech: "Financial Technology",
  climatetech: "Climate Tech",
  edtech: "Education Technology",
  saas: "Software as a Service",
  hardware: "Hardware and IoT",
  web3: "Web3 and Blockchain",
  other: "Innovation",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, tagline, category, description }: OverviewRequest = await req.json();

    if (!title || !tagline || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryLabel = categoryLabels[category] || category || "Innovation";

    // Executive briefing prompt - clear, structured, high-value
    const systemPrompt = `You are an executive briefing specialist. Create concise, high-impact innovation summaries.

Your briefings must:
- Be exactly 50-70 words (20-25 seconds when spoken)
- Answer these questions in order:
  1. What is this? (one sentence)
  2. What problem does it solve? (one sentence)
  3. Who benefits? (brief mention)
  4. What's the key impact? (one sentence)
- Use clear, executive-friendly language
- Be a single flowing paragraph
- Sound natural when read aloud

NEVER:
- Say "this video", "this overview", or reference any UI
- Use buzzwords like "revolutionary", "game-changing", "cutting-edge", "innovative"
- Include filler words or marketing fluff
- Repeat information from the tagline verbatim
- Start with "This is" or "Here is"

START directly with the innovation name or what it does.`;

    const userPrompt = `Create an executive briefing for:

TITLE: ${title}
TAGLINE: ${tagline}
CATEGORY: ${categoryLabel}
DESCRIPTION: ${description}

Generate a 50-70 word spoken briefing. Be direct, clear, and insightful.`;

    console.log("Generating executive briefing for:", title);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 150,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Return generic error - client handles gracefully
      return new Response(
        JSON.stringify({ error: "Generation unavailable" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const overview = data.choices?.[0]?.message?.content?.trim();

    if (!overview) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({ error: "Empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generated briefing:", overview.substring(0, 80) + "...");

    return new Response(
      JSON.stringify({ overview }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Briefing generation error:", error);
    return new Response(
      JSON.stringify({ error: "Generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
