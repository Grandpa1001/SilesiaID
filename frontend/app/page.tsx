"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.push("/onboarding");
  }, [ready, authenticated, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-white p-4">
      <div className="max-w-xl text-center">
        <div className="mb-2 text-5xl font-bold text-blue-700">SilesiaID</div>
        <p className="mb-4 text-xl text-gray-600">
          Cyfrowy certyfikat Twojej firmy. Weryfikujesz się raz — jesteś rozpoznany wszędzie.
        </p>
        <div className="mb-6 rounded-2xl bg-white p-6 text-left shadow-lg">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl">1️⃣</span>
            <span className="text-gray-700">Wpisujesz NIP swojej firmy</span>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <span className="text-2xl">2️⃣</span>
            <span className="text-gray-700">System weryfikuje dane w CEIDG i KRS</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">3️⃣</span>
            <span className="text-gray-700">Dostajesz certyfikat + kod QR</span>
          </div>
        </div>
        <button
          type="button"
          onClick={login}
          disabled={!ready}
          className="w-full rounded-xl bg-blue-700 px-8 py-4 text-lg font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
        >
          Zacznij — zaloguj się przez e-mail
        </button>
        <p className="mt-3 text-xs text-gray-400">Żadnych kryptowalut. Żadnych specjalnych aplikacji.</p>
      </div>
    </main>
  );
}
