import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// NVIDIA Riva TTS (FastPitch HiFi-GAN) via NIM HTTP endpoint.
// Returns base64-encoded WAV audio.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TTS_KEY = Deno.env.get("NVIDIA_TTS_API_KEY");
    if (!TTS_KEY) throw new Error("NVIDIA_TTS_API_KEY not configured");

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

    const { text, voice } = (await req.json()) as { text: string; voice?: string };
    if (!text) throw new Error("Missing text");

    const nvRes = await fetch(
      "https://ai.api.nvidia.com/v1/speech/nvidia/fastpitch-hifigan-tts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TTS_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          text,
          encoding: "LINEAR_PCM",
          sample_rate_hertz: 44100,
          language_code: "en-US",
          voice_name: voice ?? "English-US.Female-1",
        }),
      }
    );

    if (!nvRes.ok) {
      const t = await nvRes.text();
      console.error("NVIDIA TTS error", nvRes.status, t);
      return new Response(
        JSON.stringify({ error: `TTS error: ${nvRes.status}`, detail: t }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await nvRes.json();
    // Common response shape: { audio: "<base64>" } or { audio_content: "<base64>" }
    const audio: string = data.audio ?? data.audio_content ?? "";
    if (!audio) {
      return new Response(
        JSON.stringify({ error: "No audio returned", raw: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ audio, mimeType: "audio/wav" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("text-to-speech error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
