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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, tagline, category, description }: OverviewRequest = await req.json();

    // Validate input
    if (!title || !tagline || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: title, tagline, description" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const categoryLabel = categoryLabels[category] || category || "Innovation";

    const systemPrompt = `You create concise, spoken-style overviews for innovations. Your overviews must:
- Be natural and conversational when read aloud (60-90 words, ~20-30 seconds)
- Use simple, clear language without jargon or filler
- Highlight the core value proposition and real-world impact
- Sound professional and credible
- Be a single flowing paragraph with no formatting
- Start with what the innovation does, not meta-references
- NEVER say "this video", "in this overview", or reference the UI
- NEVER use buzzwords like "revolutionary", "game-changing", or "cutting-edge"`;

    const userPrompt = `Create a spoken overview for this innovation:

Title: ${title}
Tagline: ${tagline}
Category: ${categoryLabel}
Description: ${description}

Generate a 60-90 word spoken overview that would take about 20-30 seconds to read aloud. Make it engaging and highlight what makes this innovation special.`;

    console.log("Generating overview for:", title);

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
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate overview" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const overview = data.choices?.[0]?.message?.content?.trim();

    if (!overview) {
      console.error("No overview generated:", data);
      return new Response(
        JSON.stringify({ error: "No overview generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generated overview:", overview.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ overview }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating overview:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
