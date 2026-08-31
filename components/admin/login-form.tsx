"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/admin";

function Btn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-gold w-full px-6 py-3 disabled:opacity-60">
      {pending ? "Checking…" : "Log in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Admin password</label>
        <input
          type="password"
          name="password"
          autoFocus
          className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 focus:border-gold"
          placeholder="••••••••"
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Btn />
    </form>
  );
}
