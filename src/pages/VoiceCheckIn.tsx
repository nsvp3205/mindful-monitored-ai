import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mic, MicOff, Loader2, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const moodEmoji: Record<string, string> = { happy: "😊", neutral: "😐", sad: "😢" };

const VoiceCheckIn = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [finalMood, setFinalMood] = useState<string | null>(null);

  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void greet();
    return () => {
      window.speechSynthesis?.cancel();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function greet() {
    const greeting = "Hi! I'm Elara. Ready for today's check-in?";
    setMessages([{ role: "assistant", content: greeting }]);
    await speak(greeting);
  }

  // Try NVIDIA TTS first; fall back to browser speechSynthesis.
  async function speak(text: string): Promise<void> {
    setSpeaking(true);
    try {
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text },
      });
      if (error || !data?.audio) throw error ?? new Error("no audio");
      await playBase64Audio(data.audio, data.mimeType ?? "audio/wav");
    } catch (e) {
      console.warn("TTS fallback to browser:", e);
      await browserSpeak(text);
    } finally {
      setSpeaking(false);
    }
  }

  function playBase64Audio(b64: string, mimeType: string): Promise<void> {
    return new Promise((resolve) => {
      const src = `data:${mimeType};base64,${b64}`;
      const audio = audioElRef.current ?? new Audio();
      audioElRef.current = audio;
      audio.src = src;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }

  function browserSpeak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  async function sendToAssistant(history: Msg[], finalize = false) {
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-checkin", {
        body: { messages: history, finalize },
      });
      if (error) throw error;
      const reply: string = data.reply;
      const mood: string = data.mood;
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (finalize) setFinalMood(mood);
      await speak(reply);
    } catch (e: any) {
      toast.error(e?.message ?? "Check-in failed");
    } finally {
      setThinking(false);
    }
  }

  const recognitionRef = useRef<any>(null);
  const supportsSTT =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const startListening = () => {
    if (!supportsSTT) {
      toast.error("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript as string;
      const next: Msg[] = [...messages, { role: "user", content: transcript }];
      setMessages(next);
      const userTurns = next.filter((m) => m.role === "user").length;
      await sendToAssistant(next, userTurns >= 4);
    };
    recognitionRef.current = rec;
    rec.start();
  };

  const stopListening = () => recognitionRef.current?.stop?.();

  const busy = thinking || speaking;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
        <h1 className="text-lg font-semibold">Daily Check-in</h1>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-between p-6 max-w-2xl mx-auto w-full">
        <div className="flex-1 w-full overflow-y-auto space-y-4 py-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl p-4 max-w-[85%] ${
                m.role === "assistant"
                  ? "bg-primary/10 text-card-foreground"
                  : "bg-muted ml-auto"
              }`}
            >
              <p className="text-sm">{m.content}</p>
            </div>
          ))}
          {(thinking || transcribing) && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {transcribing ? "Transcribing…" : "Elara is thinking…"}
            </div>
          )}
        </div>

        {finalMood && (
          <div className="w-full rounded-2xl border border-border bg-card p-6 mb-4 text-center">
            <p className="text-sm text-muted-foreground">Today's mood logged</p>
            <p className="text-5xl my-2">{moodEmoji[finalMood]}</p>
            <p className="text-sm capitalize font-medium">{finalMood}</p>
            <Button className="mt-4 gap-2" onClick={() => navigate("/dashboard")}>
              <Check className="h-4 w-4" /> Done
            </Button>
          </div>
        )}

        {!finalMood && (
          <div className="flex flex-col items-center gap-3 pb-4">
            <button
              onClick={listening ? stopListening : startListening}
              disabled={busy}
              className={`h-24 w-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                listening
                  ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
                  : "bg-primary text-primary-foreground hover:scale-105"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {listening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
            </button>
            <p className="text-sm text-muted-foreground">
              {speaking
                ? "Elara is speaking…"
                : listening
                ? "Listening… tap to stop"
                : transcribing
                ? "Transcribing…"
                : thinking
                ? "Thinking…"
                : "Tap to talk"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default VoiceCheckIn;
