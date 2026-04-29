import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// NVIDIA Riva ASR via NIM HTTP endpoint (Parakeet CTC)
// Accepts base64 audio (webm/opus or wav) and returns the transcript.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const STT_KEY = Deno.env.get("NVIDIA_API_KEY");
    if (!STT_KEY) throw new Error("NVIDIA_API_KEY not configured");

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
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { audio, mimeType } = (await req.json()) as {
      audio: string;
      mimeType?: string;
    };
    if (!audio) throw new Error("Missing audio");

    // NVIDIA NIM ASR endpoint (Parakeet CTC 1.1B). Accepts base64 audio.
    const nvRes = await fetch(
      "https://ai.api.nvidia.com/v1/speech/nvidia/parakeet-ctc-1.1b-asr",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STT_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          audio_content: audio,
          encoding: mimeType?.includes("wav") ? "LINEAR_PCM" : "OGG_OPUS",
          language_code: "en-US",
          sample_rate_hertz: 48000,
        }),
      }
    );

    if (!nvRes.ok) {
      const t = await nvRes.text();
      console.error("NVIDIA STT error", nvRes.status, t);
      return new Response(
        JSON.stringify({ error: `STT error: ${nvRes.status}`, detail: t }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await nvRes.json();
    // Response shape: { text: "..." } or { transcripts: [{transcript: "..."}] }
    const text: string =
      data.text ??
      data.transcript ??
      data.transcripts?.[0]?.transcript ??
      data.results?.[0]?.alternatives?.[0]?.transcript ??
      "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("speech-to-text error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
