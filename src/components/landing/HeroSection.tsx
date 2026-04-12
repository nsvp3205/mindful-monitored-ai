import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      </div>

      <div className="container relative flex flex-col items-center gap-12 py-20 md:flex-row md:py-28">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse-soft" />
            AI-Powered Care Companion
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your loved one is{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              never alone
            </span>{" "}
            again
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            VivaVoice is an AI voice companion that provides daily check-ins, medication reminders, and emotional support for elderly loved ones — giving you peace of mind.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row md:justify-start">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 shadow-elevated">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    </section>
  );
}
