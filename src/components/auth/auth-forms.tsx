"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { claimGuestDaily } from "@/lib/daily/guest";
import { SUPPORT_EMAIL } from "@/lib/utils";

function safeNext(raw: string | null, fallback: string) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

// Google's four-colour "G" (their brand rules require the original colours on a light button).
function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-[18px] shrink-0">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// One button for both sign-up and log-in: Google creates the account on first use.
function GoogleButton({ next, onError }: { next: string; onError: (message: string) => void }) {
  const [loading, setLoading] = useState(false);
  async function go() {
    setLoading(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next) },
    });
    // On success the browser is already leaving for Google.
    if (error) {
      setLoading(false);
      onError(/provider is not enabled/i.test(error.message) ? "Google sign-in isn't switched on yet. Use your email for now." : error.message);
    }
  }
  return (
    <Button type="button" variant="secondary" size="lg" onClick={go} loading={loading} className="w-full">
      {!loading && <GoogleG />} Continue with Google
    </Button>
  );
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[12.5px] font-semibold text-faint" role="separator">
      <span className="h-px flex-1 bg-border" />
      or use your email
      <span className="h-px flex-1 bg-border" />
    </div>
  );
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
      setError(
        error.message === "Invalid login credentials"
          ? "That email and password do not match."
          : /not confirmed/i.test(error.message)
            ? "Confirm your email first: open the link we sent you. Check spam if it isn't there."
            : error.message,
      );
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
      options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: false },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setMagicSent(true);
  }

  if (magicSent) {
    return (
      <div className="text-center">
        <Mail className="mx-auto size-8 text-brand-strong" />
        <h1 className="heading mt-4 text-[26px] font-bold leading-tight">Check your inbox</h1>
        <p className="mt-2 text-[15px] text-muted">We sent a sign-in link to {email}. It expires in one hour.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div>
        <h1 className="heading text-[30px] font-bold leading-tight">Welcome back</h1>
        <p className="mt-1.5 text-[15px] text-muted">Log in and pick up where you left off.</p>
      </div>
      <GoogleButton next={next} onError={setError} />
      <OrDivider />
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        hint={
          <Link href="/forgot-password" className="font-semibold text-brand-strong hover:underline">
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
        <Link href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-strong hover:underline">
          Create a free account
        </Link>
      </p>
      <p className="text-center text-[13px] text-faint">
        Trouble signing in?{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-muted hover:text-text hover:underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </form>
  );
}

// Where confirmation links land. The email template appends &token_hash=…&type=…, so the link
// works on any device (no PKCE verifier needed) and signs the student straight in.
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function CheckInbox({ email, next, onRestart }: { email: string; next: string; onRestart: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  async function resend() {
    setState("sending");
    setError(null);
    const { error } = await createClient().auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl(next) } });
    if (error) {
      setError(error.message);
      setState("idle");
    } else setState("sent");
  }
  return (
    <div>
      <span className="grid size-12 place-items-center rounded-full bg-brand-soft motion-safe:animate-[fade-up_500ms_var(--ease-out-expo)_both]">
        <Mail className="size-6 text-brand-strong" />
      </span>
      <h1 className="heading mt-6 text-[30px] font-bold leading-tight">Confirm your email</h1>
      <p className="mt-2 text-[15.5px] leading-relaxed text-muted">
        We sent a link to <strong className="font-semibold text-text">{email}</strong>. Click it and you&apos;ll land back here, signed in
        and ready to set up. It works on any device.
      </p>
      <p className="mt-4 text-[14px] text-muted">Nothing after a minute? Check spam or promotions.</p>
      {error && (
        <p className="mt-4 rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={resend} loading={state === "sending"} disabled={state === "sent"}>
          {state === "sent" ? "Sent again" : "Resend email"}
        </Button>
        <Button type="button" variant="ghost" onClick={onRestart}>
          Use a different email
        </Button>
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"), "/welcome");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const mismatch = confirm.length > 0 && (confirmTouched || confirm.length >= password.length) && confirm !== password;
  const matches = confirm.length >= 8 && confirm === password;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setConfirmTouched(true);
      setError("The two passwords don't match.");
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
        emailRedirectTo: callbackUrl(next),
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

  if (checkEmail) return <CheckInbox email={email} next={next} onRestart={() => setCheckEmail(false)} />;

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <div>
        <h1 className="heading text-[30px] font-bold leading-tight">Create your account</h1>
        <p className="mt-1.5 text-[15px] text-muted">Free to start, no card needed. $48 for lifetime access when you&apos;re ready.</p>
      </div>
      <GoogleButton next={next} onError={setError} />
      <OrDivider />
      <Field label="Name" htmlFor="name" hint="Shown on leaderboards. You can change it later.">
        <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters.">
        <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirm" error={mismatch ? "Doesn't match the password above." : null}>
        <div className="relative">
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            aria-invalid={mismatch || undefined}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            className="pr-10"
          />
          {matches && (
            <Check
              className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-correct motion-safe:animate-[chip-pop_320ms_var(--ease-out-quart)_both]"
              strokeWidth={3}
              aria-label="Passwords match"
            />
          )}
        </div>
      </Field>
      {error && (
        <p className="rounded-[8px] bg-incorrect-soft px-3 py-2.5 text-[14px] font-medium text-incorrect" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={loading}>
        Create account
      </Button>
      <p className="text-center text-[13px] leading-relaxed text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="font-semibold text-text underline-offset-2 hover:underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-semibold text-text underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <p className="text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-strong hover:underline">
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
        <Mail className="mx-auto size-8 text-brand-strong" />
        <h1 className="heading mt-4 text-[26px] font-bold leading-tight">Check your inbox</h1>
        <p className="mt-2 text-[15px] text-muted">If an account exists for {email}, a reset link is on its way.</p>
      </div>
    );
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div>
        <h1 className="heading text-[30px] font-bold leading-tight">Reset your password</h1>
        <p className="mt-1.5 text-[15px] text-muted">We&apos;ll email you a link to set a new one.</p>
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
      <h1 className="heading text-[30px] font-bold leading-tight">Choose a new password</h1>
      <Field label="New password" htmlFor="password" error={error}>
        <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" loading={loading}>
        Update password
      </Button>
    </form>
  );
}
