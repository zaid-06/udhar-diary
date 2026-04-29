import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/get-error-message";

export function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Welcome back.");
      navigate(from, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "Sign in failed");
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      heading="Udhar Diary"
      description="Track customer dues, view summaries, and manage every transaction from one dashboard."
    >
      <div className="space-y-4">
        <h2 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400">
          Welcome Back
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use the email and password for your shopkeeper account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error ? (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 text-white hover:from-sky-500 hover:via-blue-600 hover:to-cyan-500 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 dark:hover:from-slate-800 dark:hover:via-slate-700 dark:hover:to-blue-900"
                disabled={submitting || isLoading}
              >
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                No account?{" "}
                <Link to="/register" className="text-foreground underline underline-offset-4">
                  Register
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthSplitLayout>
  );
}
