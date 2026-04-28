import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.jpg";

type Status = "verifying" | "ready" | "invalid";

const ResetPassword = () => {
  const [status, setStatus] = useState<Status>("verifying");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let resolved = false;
    const markReady = () => {
      resolved = true;
      setStatus("ready");
    };

    // Listen for Supabase to process the recovery token from the URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        markReady();
      }
    });

    // Fallback: if a session already exists, allow reset
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // If still no session after 5s, the link is invalid/expired
    const t = setTimeout(() => {
      if (!resolved) setStatus("invalid");
    }, 5000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    // Guard: ensure we actually have a session before calling updateUser
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setStatus("invalid");
      toast({
        title: "Reset link expired",
        description: "Please request a new password reset email.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password updated", description: "You're signed in." });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Could not update password", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between">
            <Link to="/auth" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
            <ThemeToggle />
          </div>

          <div className="text-center space-y-2">
            <img src={logo} alt="Elara Voice" className="mx-auto h-14 w-14 rounded-2xl object-cover" />
            <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
            <p className="text-muted-foreground">
              {status === "verifying" && "Verifying your reset link…"}
              {status === "ready" && "Choose a strong password you'll remember."}
              {status === "invalid" && "This reset link is invalid or has already been used."}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
            {status === "verifying" && (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {status === "invalid" && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Reset links can only be used once and expire after a short time. Request a new one to continue.
                </p>
                <Link to="/auth">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    Request new reset link
                  </Button>
                </Link>
              </div>
            )}

            {status === "ready" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
