"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { INSTITUTION_TOKEN_KEY, institutionLoginOrSignup } from "@/lib/institutionApi";
import InstitutionHeader from "@/app/components/InstitutionHeader";

export default function InstitutionLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await institutionLoginOrSignup(email.trim(), password, name.trim());
      localStorage.setItem(INSTITUTION_TOKEN_KEY, token);
      router.push("/institution/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coś poszło nie tak");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <InstitutionHeader />

      <main className="px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-2 text-center text-xs font-medium uppercase tracking-widest text-primary-dark">
          Panel instytucji
        </p>
        <h1 className="mb-1 text-center text-2xl font-semibold text-gray-900">Logowanie weryfikatora</h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Osobny dostęp od konta przedsiębiorcy (Privy). Przy pierwszym logowaniu podaj nazwę instytucji —
          utworzymy konto.
        </p>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          {error ? (
            <div
              className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <label className="mb-1 block text-xs font-medium text-gray-600">E-mail</label>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:border-primary focus:ring-2"
            placeholder="kontakt@bank.pl"
          />

          <label className="mb-1 block text-xs font-medium text-gray-600">Hasło</label>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:border-primary focus:ring-2"
            placeholder="min. 6 znaków"
          />

          <label className="mb-1 block text-xs font-medium text-gray-600">Nazwa instytucji (np. bank)</label>
          <input
            type="text"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-6 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none ring-primary/30 focus:border-primary focus:ring-2"
            placeholder="Np. Bank demonstracyjny S.A."
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary-dark py-3 text-sm font-medium text-white transition hover:bg-primary disabled:opacity-50"
          >
            {loading ? "Łączenie…" : "Zaloguj lub utwórz konto"}
          </button>
        </form>

      </div>
      </main>
    </div>
  );
}
