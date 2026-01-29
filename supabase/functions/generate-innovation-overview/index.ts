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
  transcript?: string;
}

interface NarratorResponse {
  script: string;
  key_points: string[];
  emotion: "confident" | "friendly" | "serious";
  gestures: Array<{ t: number; action: string }>;
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
    const { title, tagline, category, description, transcript }: OverviewRequest = await req.json();

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

    // Robot Narrator prompt - structured JSON output
    const systemPrompt = `You are ZYNOVEXA's Robot Narrator - a professional, confident, and friendly AI presenter.

Your task is to create a spoken overview (20-30 seconds when read aloud) for an innovation demo.

RULES:
- Duration: 50-70 words (20-30 seconds spoken)
- Tone: professional, confident, friendly
- Use simple spoken language. No jargon. No marketing fluff.
- Do NOT say "this video", "click here", or reference any UI elements
- Do NOT invent facts. Only use the provided content.
- Answer clearly: What is this? What problem does it solve? Who benefits? What's the key impact?

OUTPUT FORMAT:
Return ONLY valid JSON with these exact keys:
{
  "script": "The spoken overview text...",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "emotion": "confident",
  "gestures": [
    {"t": 2, "action": "nod"},
    {"t": 7, "action": "open_palm_present"},
    {"t": 14, "action": "point"},
    {"t": 24, "action": "thumbs_up"}
  ]
}

Gesture actions available: nod, open_palm_present, point, thumbs_up, wave, gesture_left, gesture_right
Emotion options: confident, friendly, serious

The "t" in gestures represents seconds from start. Space gestures naturally throughout the script.`;

    const userPrompt = `Create the Robot Narrator overview for:

Title: ${title}
Tagline: ${tagline}
Category: ${categoryLabel}
Description: ${description}
Transcript: ${transcript || "(not provided)"}

Return ONLY the JSON object, no markdown or extra text.`;

    console.log("Generating robot narrator script for:", title);

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
        max_tokens: 500,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Generation unavailable" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error("Empty response from AI");
      return new Response(
        JSON.stringify({ error: "Empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up potential markdown code blocks
    content = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    // Parse and validate the JSON response
    let narratorData: NarratorResponse;
    try {
      narratorData = JSON.parse(content);
      
      // Validate required fields
      if (!narratorData.script || !Array.isArray(narratorData.key_points)) {
        throw new Error("Missing required fields in response");
      }
      
      // Ensure defaults
      narratorData.emotion = narratorData.emotion || "confident";
      narratorData.gestures = narratorData.gestures || [
        { t: 2, action: "nod" },
        { t: 7, action: "open_palm_present" },
        { t: 14, action: "point" },
        { t: 24, action: "thumbs_up" },
      ];
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError, "Content:", content);
      // Fallback: treat content as plain script
      narratorData = {
        script: content,
        key_points: [tagline],
        emotion: "confident",
        gestures: [
          { t: 2, action: "nod" },
          { t: 7, action: "open_palm_present" },
          { t: 14, action: "point" },
          { t: 24, action: "thumbs_up" },
        ],
      };
    }

    console.log("Generated narrator script:", narratorData.script.substring(0, 80) + "...");

    return new Response(
      JSON.stringify(narratorData),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Narrator generation error:", error);
    return new Response(
      JSON.stringify({ error: "Generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
