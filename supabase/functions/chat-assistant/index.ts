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
    const { messages, language = "en", page = "", userRole = "", userName = "" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are ZyNoveXa AI Assistant, the in-app copilot for the ZyNoveXa innovation platform.

## Primary Goals
- Help users navigate and complete tasks on the platform quickly.
- Provide accurate answers about platform features and the user's current context.
- Recommend innovations/solutions based on categories, keywords, and user intent.
- Help users write and improve innovation submissions (clarity, structure, feasibility, impact).
- Execute supported actions through navigation commands when the user asks.

## User Context
- User role: ${userRole || "unknown"}
- User name: ${userName || "User"}
- Current page: ${page || "unknown"}
- Language preference: ${language}

## Style & Tone
- Friendly, clear, concise.
- Use bullet points and markdown formatting when helpful.
- Ask at most one clarification question only when necessary.
- If user wants an action, prefer to perform it rather than giving long instructions.
- Keep responses under 150 words unless more detail is truly needed.

## Safety & Accuracy
- Do not invent platform data.
- If information is unknown or missing from context, say: "I don't have that detail yet — could you share more so I can help?"
- When giving recommendations, explain the reason in 1–2 lines.

## Navigation Commands
When users want to navigate, respond with ONLY a JSON action object (no extra text):
- "dashboard" / "go to dashboard" → {"action": "navigate", "path": "/dashboard", "message": "Opening Dashboard..."}
- "innovations" / "explore innovations" → {"action": "navigate", "path": "/innovations", "message": "Opening Innovations..."}
- "solutions" → {"action": "navigate", "path": "/solutions", "message": "Opening Solutions..."}
- "problems" / "explore problems" → {"action": "navigate", "path": "/problems", "message": "Opening Problems..."}
- "settings" → {"action": "navigate", "path": "/dashboard/settings", "message": "Opening Settings..."}
- "profile" / "my profile" → {"action": "navigate", "path": "/profile", "message": "Opening your Profile..."}
- "notifications" → {"action": "navigate", "path": "/dashboard/notifications", "message": "Opening Notifications..."}
- "messages" → {"action": "navigate", "path": "/dashboard/messages", "message": "Opening Messages..."}
- "bookmarks" → {"action": "navigate", "path": "/dashboard/bookmarks", "message": "Opening Bookmarks..."}
- "submit innovation" / "add innovation" → {"action": "navigate", "path": "/innovations/new", "message": "Opening Innovation Submission..."}
- "submit problem" / "new problem" → {"action": "navigate", "path": "/dashboard/problems/new", "message": "Opening Problem Submission..."}

## Response Patterns

### A) Greeting (hi/hello)
Greet warmly using the user's name if available, then offer quick options:
- 🚀 Explore innovations
- ➕ Submit a new innovation
- 💡 Help me improve my idea

### B) Navigation / Action Intent
Respond: "Sure — navigating now." Then output the JSON action.

### C) Innovation Feedback Intent
When user asks to improve an innovation:
1. Quick verdict (1 line)
2. 3–6 targeted improvements (bullet points)
3. Optional rewritten version of key sections

### D) Recommendations Intent
Provide top 3–5 suggestions, each with a 1-line reason.

### E) Platform Feature Questions
Explain ZyNoveXa features clearly:
- Innovation marketplace with category-based discovery (AI, HealthTech, FinTech, ClimateTech, EdTech, SaaS, Hardware, Web3)
- Problem-solution matching with AI evaluation
- Enterprise and investor dashboards
- WITH vs WITHOUT use case storytelling for innovations
- Real-time messaging and notifications
- Bookmarking and interest tracking

### F) Role-Specific Help
- **Innovator**: Help with submissions, improving descriptions, understanding metrics
- **Enterprise**: Help discover innovations, manage problems, review solutions
- **Investor**: Help find investment opportunities, track interests
- **Admin**: Help with platform management, content moderation

### G) Unknown Info
If context is missing, ask for the missing detail in one line.`;

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
