import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthSplitLayout } from "@/components/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/get-error-message";

export function RegisterPage() {
  const { user, isLoading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
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
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, email, password });
      toast.success("Account created successfully.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, "Registration failed");
      toast.error(message);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthSplitLayout
      heading="Udhar Diary"
      description="Create your shopkeeper account and start managing customers, items, and pending payments."
    >
      <div className="space-y-4">
        <h2 className="text-center text-3xl font-bold tracking-tight bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-blue-400 dark:to-cyan-400">
          Get Started
        </h2>
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Register as a shopkeeper to use Udhar Diary.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              {error ? (
                <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-sky-600 via-blue-700 to-cyan-600 text-white hover:from-sky-500 hover:via-blue-600 hover:to-cyan-500 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 dark:hover:from-slate-800 dark:hover:via-slate-700 dark:hover:to-blue-900"
                disabled={submitting || isLoading}
              >
                {submitting ? "Creating account…" : "Register"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-foreground underline underline-offset-4">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthSplitLayout>
  );
}
