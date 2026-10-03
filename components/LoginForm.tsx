"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const input = username.trim().toLowerCase();

    const email = input.includes("@")
      ? input
      : `${input}@myfinance.local`;

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setError(
        "Username/email atau password salah."
      );

      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          Username / Email
        </label>

        <input
          value={username}
          onChange={(e) =>
            setUsername(e.target.value)
          }
          placeholder="Galih"
          autoComplete="username"
          required
          className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Memproses..." : "Login"}
      </button>
    </form>
  );
}
