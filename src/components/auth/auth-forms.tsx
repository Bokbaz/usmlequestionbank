"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { claimGuestDaily } from "@/lib/daily/guest";

function safeNext(raw: string | null, fallback: string) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error"));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message === "Invalid login credentials" ? "That email and password do not match." : error.message);
      setLoading(false);
      return;
    }
    await claimGuestDaily(supabase);
    router.replace(next);
    router.refresh();
  }

  async function sendMagicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`, shouldCreateUser: false },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="text-center">
        <Mail className="mx-auto size-8 text-brand" />
        <h1 className="mt-4 text-[24px] font-[750] tracking-[-0.02em]">Check your inbox</h1>
        <p className="mt-2 text-[15px] text-muted">We sent a sign-in link to {email}. It expires in one hour.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div>
        <h1 className="text-[28px] font-[750] tracking-[-0.02em]">Welcome back</h1>
        <p className="mt-1.5 text-[15px] text-muted">Log in to continue your prep.</p>
      </div>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint={
          <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
            Forgot password?
          </Link>
        }
      >
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && (
        <p className="rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={loading}>
        Log in
      </Button>
      <Button type="button" variant="secondary" size="lg" onClick={sendMagicLink} disabled={loading}>
        Email me a sign-in link
      </Button>
      <p className="text-center text-[14px] text-muted">
        New to Argonaut?{" "}
        <Link href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Create a free account
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }
    const claimed = await claimGuestDaily(supabase);
    if (claimed) toast.success("Your Daily Challenge result is now on your account.");
    router.replace(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="text-center">
        <Mail className="mx-auto size-8 text-brand" />
        <h1 className="mt-4 text-[24px] font-[750] tracking-[-0.02em]">Confirm your email</h1>
        <p className="mt-2 text-[15px] text-muted">We sent a confirmation link to {email}. Open it on this device to finish.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div>
        <h1 className="text-[28px] font-[750] tracking-[-0.02em]">Create your account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Free forever for the Daily Challenge and sample questions.</p>
      </div>
      <Field label="Name" htmlFor="name" hint="Shown on leaderboards. You can change it later.">
        <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && (
        <p className="rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={loading}>
        Create account
      </Button>
      <p className="text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }
  if (sent)
    return (
      <div className="text-center">
        <Mail className="mx-auto size-8 text-brand" />
        <h1 className="mt-4 text-[24px] font-[750]">Check your inbox</h1>
        <p className="mt-2 text-[15px] text-muted">If an account exists for {email}, a reset link is on its way.</p>
      </div>
    );
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div>
        <h1 className="text-[28px] font-[750] tracking-[-0.02em]">Reset your password</h1>
        <p className="mt-1.5 text-[15px] text-muted">We will email you a secure link.</p>
      </div>
      <Field label="Email" htmlFor="email" error={error}>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    toast.success("Password updated");
    router.replace("/dashboard");
  }
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <h1 className="text-[28px] font-[750] tracking-[-0.02em]">Choose a new password</h1>
      <Field label="New password" htmlFor="password" error={error}>
        <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Update password
      </Button>
    </form>
  );
}
