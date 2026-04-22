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
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-soft" />
            A caring voice, always there
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            A caring voice that{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              checks in, reminds, and listens
            </span>
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            Elara Voice is a gentle AI companion that calls your loved ones each day — for friendly conversation, medication reminders, and instant family alerts when something needs attention.
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
