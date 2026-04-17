"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { ready, authenticated, logout } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Panel firmy</h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
            >
              Nowy certyfikat
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg px-4 py-2 text-sm text-gray-500"
            >
              Wyloguj
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow">
          <p className="text-gray-500">Twoje certyfikaty pojawią się tutaj po rejestracji.</p>
        </div>
      </div>
    </main>
  );
}
