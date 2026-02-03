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
  videoUrl?: string;
}

interface NarratorResponse {
  script: string;
  key_points: string[];
  emotion: "confident" | "friendly" | "serious";
  robot_theme: "healthcare" | "finance" | "education" | "climate" | "ai" | "security" | "general";
}

// Extract video ID from YouTube URL
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Fetch YouTube transcript using a public API
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    console.log("Fetching transcript for video:", videoId);
    
    // Try using YouTube's timedtext API (works for videos with captions)
    const captionUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`;
    
    const response = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.events) {
        const transcript = data.events
          .filter((e: any) => e.segs)
          .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (transcript.length > 50) {
          console.log("Transcript fetched successfully, length:", transcript.length);
          return transcript;
        }
      }
    }
    
    // Fallback: Try to get auto-generated captions
    const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&name=English+(auto-generated)&fmt=json3`;
    const autoResponse = await fetch(autoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (autoResponse.ok) {
      const autoData = await autoResponse.json();
      if (autoData.events) {
        const autoTranscript = autoData.events
          .filter((e: any) => e.segs)
          .map((e: any) => e.segs.map((s: any) => s.utf8).join(''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (autoTranscript.length > 50) {
          console.log("Auto transcript fetched, length:", autoTranscript.length);
          return autoTranscript;
        }
      }
    }
    
    console.log("No transcript available for video:", videoId);
    return null;
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { title, tagline, category, description, transcript, videoUrl }: OverviewRequest = await req.json();

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

    // Try to fetch YouTube transcript if video URL is provided
    let videoTranscript = transcript;
    if (videoUrl && !transcript) {
      const videoId = extractYouTubeVideoId(videoUrl);
      if (videoId) {
        const fetchedTranscript = await fetchYouTubeTranscript(videoId);
        if (fetchedTranscript) {
          videoTranscript = fetchedTranscript;
        }
      }
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

    const categoryLabel = categoryLabels[category] || category || "Innovation";

    // Map category to robot theme
    const categoryToTheme: Record<string, string> = {
      ai: "ai",
      healthtech: "healthcare",
      fintech: "finance",
      climatetech: "climate",
      edtech: "education",
      saas: "general",
      hardware: "security",
      web3: "finance",
      other: "general",
    };
    const defaultTheme = categoryToTheme[category] || "general";

    // Different prompt based on whether we have a transcript
    const hasTranscript = videoTranscript && videoTranscript.length > 50;
    
    const systemPrompt = hasTranscript 
      ? `You are an expressive AI presenter explaining a video about an innovation.

CRITICAL RULES:
- ONLY use information from the transcript. Do NOT invent facts.
- Duration: 60-90 words (30-45 seconds when spoken)
- Tone: engaging, enthusiastic, professional
- Structure: What it does → How it helps → Why it's unique → Future potential
- Do NOT mention "Zynovexa", "our platform", or any company names
- Do NOT say "this video", "welcome", or reference any UI elements
- Speak directly about the innovation as if introducing it to an interested viewer

EMOTION GUIDE:
- Use "confident" for technical/professional innovations
- Use "friendly" for consumer-focused or social impact innovations  
- Use "serious" for healthcare, security, or critical infrastructure

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "script": "The spoken explanation of the innovation...",
  "key_points": ["Key point 1", "Key point 2", "Key point 3"],
  "emotion": "confident",
  "robot_theme": "${defaultTheme}"
}`
      : `You are an expressive AI presenter introducing an innovation to interested viewers.

RULES:
- Duration: 60-90 words (30-45 seconds spoken)
- Tone: engaging, enthusiastic yet professional
- Structure: What it does → How it helps users/businesses → Why it's unique → Future possibilities
- Do NOT mention "Zynovexa", "our platform", or any company names
- Do NOT say "click here", or reference any UI elements
- Only use the provided information. Do NOT invent facts.
- Make the listener excited about this innovation

EMOTION GUIDE:
- Use "confident" for technical/enterprise innovations
- Use "friendly" for consumer or social impact innovations
- Use "serious" for healthcare, security, or infrastructure

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "script": "The spoken overview...",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "emotion": "confident",
  "robot_theme": "${defaultTheme}"
}`;

    const userPrompt = hasTranscript
      ? `Summarize this YouTube video transcript in 20-30 seconds of spoken text.

Video Title: ${title}
Category: ${categoryLabel}

TRANSCRIPT:
${videoTranscript ? videoTranscript.substring(0, 3000) : ''}

Return ONLY the JSON object.`
      : `Create an overview for:

Title: ${title}
Tagline: ${tagline}
Category: ${categoryLabel}
Description: ${description}

Return ONLY the JSON object.`;

    console.log("Generating robot overview for:", title, "hasTranscript:", hasTranscript);

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
        temperature: 0.5,
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
      narratorData.robot_theme = narratorData.robot_theme || (defaultTheme as NarratorResponse["robot_theme"]);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError, "Content:", content);
      // Fallback: treat content as plain script
      narratorData = {
        script: content,
        key_points: [tagline],
        emotion: "confident",
        robot_theme: defaultTheme as NarratorResponse["robot_theme"],
      };
    }

    console.log("Generated script:", narratorData.script.substring(0, 80) + "...");

    return new Response(
      JSON.stringify({
        ...narratorData,
        transcript_used: hasTranscript,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Generation error:", error);
    return new Response(
      JSON.stringify({ error: "Generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
