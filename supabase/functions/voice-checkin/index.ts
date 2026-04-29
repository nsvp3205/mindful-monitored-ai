import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

const SYSTEM_PROMPT = `You are Elara, a warm, patient voice companion for elderly users doing a daily check-in.
Rules:
- Keep replies to 1-2 short sentences (spoken aloud).
- Ask one gentle question at a time about sleep, mood, meals, pain, or how their day is going.
- Be encouraging and never robotic.
- After 3-5 exchanges, gracefully wrap up by summarizing how they seem.
- At the END of every reply, on a NEW line, output a hidden tag: [MOOD:happy] or [MOOD:neutral] or [MOOD:sad] reflecting the user's latest message. If unsure, use neutral. If the user shows distress, use sad.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const NVIDIA_LLM_API_KEY =
      Deno.env.get("NVIDIA_LLM_API_KEY") ?? Deno.env.get("NVIDIA_API_KEY");
    if (!NVIDIA_LLM_API_KEY) throw new Error("NVIDIA_LLM_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, finalize } = (await req.json()) as {
      messages: ChatMsg[];
      finalize?: boolean;
    };

    const nvRes = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "nvidia/llama-3.1-nemotron-70b-instruct",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          temperature: 0.7,
          max_tokens: 200,
          stream: false,
        }),
      }
    );

    if (!nvRes.ok) {
      const t = await nvRes.text();
      console.error("NVIDIA error", nvRes.status, t);
      return new Response(
        JSON.stringify({ error: `NVIDIA API error: ${nvRes.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await nvRes.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";

    // Extract mood tag
    const moodMatch = raw.match(/\[MOOD:(happy|neutral|sad)\]/i);
    const mood = (moodMatch?.[1]?.toLowerCase() ?? "neutral") as
      | "happy"
      | "neutral"
      | "sad";
    const reply = raw.replace(/\[MOOD:[^\]]+\]/gi, "").trim();

    // If finalize, persist a check-in row
    let checkInId: string | null = null;
    if (finalize) {
      const transcript = messages
        .filter((m) => m.role !== "system")
        .map((m) => `${m.role === "user" ? "User" : "Elara"}: ${m.content}`)
        .join("\n");

      const { data: ins, error: insErr } = await supabase
        .from("check_ins")
        .insert({ user_id: user.id, mood, notes: transcript })
        .select("id")
        .maybeSingle();
      if (insErr) console.error("insert check_in error", insErr);
      checkInId = ins?.id ?? null;

      if (mood === "sad") {
        await supabase.from("alerts").insert({
          user_id: user.id,
          type: "mood",
          severity: "warning",
          message: "Daily check-in detected low mood.",
        });
      }
    }

    return new Response(
      JSON.stringify({ reply, mood, checkInId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("voice-checkin error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
