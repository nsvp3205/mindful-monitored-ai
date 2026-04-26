import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";

type Mode = "login" | "signup" | "forgot";

const Auth = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "caregiver" as "elderly" | "caregiver",
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back" });
        navigate("/dashboard", { replace: true });
      } else if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/dashboard`;
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.name,
              phone: formData.phone,
              role: formData.role,
            },
          },
        });
        if (error) throw error;
        toast({ title: "Account created", description: "You're signed in." });
        navigate("/dashboard", { replace: true });
      } else {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, { redirectTo });
        if (error) throw error;
        toast({
          title: "Check your inbox",
          description: "We sent you a password reset link.",
        });
        setMode("login");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Authentication error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, { h: string; sub: string; cta: string }> = {
    login: { h: "Welcome back", sub: "Sign in to your Elara Voice account", cta: "Sign In" },
    signup: { h: "Create your account", sub: "Start caring for your loved ones today", cta: "Create Account" },
    forgot: { h: "Reset your password", sub: "Enter your email and we'll send you a reset link", cta: "Send reset link" },
  };
  const t = titles[mode];

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center space-y-2">
            <img src={logo} alt="Elara Voice" className="mx-auto h-14 w-14 rounded-2xl object-cover" />
            <h1 className="text-2xl font-bold text-foreground">{t.h}</h1>
            <p className="text-muted-foreground">{t.sub}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {mode !== "forgot" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {(["caregiver", "elderly"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData({ ...formData, role })}
                          className={`rounded-xl border p-3 text-sm font-medium transition-all ${
                            formData.role === role
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {role === "caregiver" ? "👨‍⚕️ Caregiver" : "👴 Elderly User"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.cta}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === "login" && (
                <button onClick={() => setMode("signup")} className="text-sm text-primary hover:underline">
                  Don't have an account? Sign up
                </button>
              )}
              {mode === "signup" && (
                <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                  Already have an account? Sign in
                </button>
              )}
              {mode === "forgot" && (
                <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
