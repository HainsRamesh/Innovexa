const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set in Supabase secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body?.title ?? "").trim();
    const count = Number(body?.count ?? 5);

    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = "gpt-4o-mini";
    const input =
      `Generate ${count} punchy startup-style taglines (<= 12 words each) for: "${title}". ` +
      `Return ONLY the taglines, one per line.`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input }),
    });

    const raw = await openaiRes.text();

    if (!openaiRes.ok) {
      console.error("OpenAI failed:", openaiRes.status, raw);
      return new Response(
        JSON.stringify({ error: "OpenAI request failed", status: openaiRes.status, details: raw }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const json = JSON.parse(raw);

    // Extract text from Responses API
    const text =
      (typeof json?.output_text === "string" && json.output_text) ||
      (json?.output?.flatMap((o: any) => o?.content ?? [])
        ?.map((c: any) => c?.text)
        ?.filter(Boolean)
        ?.join("\n")) ||
      "";

    const taglines = text
      .split(/\r?\n/)
      .map((l: string) => l.replace(/^\s*[-*\d.)]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, count);

    return new Response(JSON.stringify({ taglines }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Function error:", e);
    return new Response(
      JSON.stringify({ error: "Function crashed", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
