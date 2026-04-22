import logo from "@/assets/logo.jpg";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 py-12">
      <div className="container flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Elara Voice" className="h-8 w-8 rounded-lg object-cover" />
          <span className="font-bold text-foreground">Elara Voice</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 Elara Voice. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
