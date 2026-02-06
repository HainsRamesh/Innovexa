import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are ZyNoveXa AI Assistant, a helpful, friendly, and knowledgeable assistant for the ZyNoveXa innovation platform.

Your capabilities:
1. Answer questions about ZyNoveXa features (FinOps automation, innovation matching, problem-solution marketplace)
2. Help users navigate the platform
3. Explain how to submit innovations, problems, or solutions
4. Provide guidance on using the dashboard and other features

Navigation Commands - When users want to navigate, respond with a JSON action:
- For "open dashboard", "go to dashboard", "dashboard" → respond with: {"action": "navigate", "path": "/dashboard", "message": "Opening Dashboard..."}
- For "open innovations", "innovations page" → respond with: {"action": "navigate", "path": "/innovations", "message": "Opening Innovations..."}
- For "open solutions", "solutions" → respond with: {"action": "navigate", "path": "/solutions", "message": "Opening Solutions..."}
- For "open problems", "explore problems" → respond with: {"action": "navigate", "path": "/problems", "message": "Opening Problems..."}
- For "settings", "open settings" → respond with: {"action": "navigate", "path": "/dashboard/settings", "message": "Opening Settings..."}
- For "my profile", "profile" → respond with: {"action": "navigate", "path": "/profile", "message": "Opening your Profile..."}

When responding to navigation requests, ONLY output the JSON object, nothing else.

For all other questions, respond naturally in a helpful and concise manner. Keep responses under 150 words unless more detail is needed.

Current language preference: ${language}`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
