"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

type LoginState = { error: string } | undefined;

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Correo">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Field>

      <Field label="Contraseña">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state?.error && (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
