import { Mic } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Mic className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">VivaVoice</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 VivaVoice. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
