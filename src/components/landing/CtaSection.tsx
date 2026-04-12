import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div
          className="mx-auto max-w-4xl rounded-3xl p-12 md:p-16 text-center"
          style={{ background: "var(--gradient-primary)" }}
        >
          <h2 className="text-3xl font-bold text-primary-foreground sm:text-4xl">
            Give your loved ones the care they deserve
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Join thousands of families who trust VivaVoice to keep their loved ones safe, connected, and cared for every single day.
          </p>
          <Link to="/auth" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="gap-2 px-8 font-semibold">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
