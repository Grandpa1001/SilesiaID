"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { verifyNip, issueCert } from "@/lib/api";
import SuccessScreen from "./SuccessScreen";

type Step = "nip" | "confirm" | "success";

interface BusinessData {
  nip: string;
  name: string;
  status: string;
  type: string;
  krsNumber: string | null;
  address: { city: string; street: string; voivodeship: string; postCode: string };
  vatActive: boolean;
  trustLevel: number;
  registrySource?: "krs" | "ceidg" | "vat";
}

export default function OnboardingPage() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [step, setStep] = useState<Step>("nip");
  const [nip, setNip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [certId, setCertId] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Musisz być zalogowany</p>
          <button
            type="button"
            onClick={login}
            className="rounded-lg bg-blue-700 px-6 py-3 text-white"
          >
            Zaloguj się
          </button>
        </div>
      </div>
    );
  }

  async function handleVerifyNip() {
    if (!/^\d{10}$/.test(nip)) {
      setError("NIP musi mieć 10 cyfr");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await verifyNip(nip);
      setBusiness(res.data as BusinessData);
      setStep("confirm");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd weryfikacji");
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueCert() {
    setLoading(true);
    setError("");
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      const res = await issueCert(nip, embeddedWallet?.address);
      setCertId(res.certId);
      setQrUrl(res.qrUrl);
      setStep("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd wydania certyfikatu");
    } finally {
      setLoading(false);
    }
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    suspended: "bg-amber-100 text-amber-800",
    deleted: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    active: "Aktywna",
    suspended: "Zawieszona",
    deleted: "Wykreślona",
    unknown: "Nieznany",
  };

  function registrySourceLabel(src?: BusinessData["registrySource"]) {
    if (src === "krs") return "KRS";
    if (src === "ceidg") return "CEIDG";
    if (src === "vat") return "Biała lista VAT (MF)";
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex gap-2">
          {(["nip", "confirm", "success"] as const).map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                ["nip", "confirm", "success"].indexOf(step) >= i ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === "nip" && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Wpisz NIP firmy</h1>
            <p className="mb-6 text-gray-500">System automatycznie pobierze dane z CEIDG i KRS</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={nip}
              onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
              placeholder="np. 6310000000"
              className="mb-4 w-full rounded-xl border-2 border-gray-200 px-4 py-3 font-mono text-xl tracking-widest focus:border-blue-500 focus:outline-none"
            />
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => void handleVerifyNip()}
              disabled={loading || nip.length !== 10}
              className="w-full rounded-xl bg-blue-700 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
            >
              {loading ? "Sprawdzamy Twoją firmę..." : "Weryfikuj NIP →"}
            </button>
          </div>
        )}

        {step === "confirm" && business && (
          <div className="rounded-2xl bg-white p-6 shadow">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Czy to Twoja firma?</h1>
            <p className="mb-4 text-gray-500">Znaleźliśmy takie dane w rejestrach publicznych:</p>
            <div className="mb-4 rounded-xl bg-gray-50 p-4">
              <div className="mb-1 text-lg font-bold text-gray-900">{business.name}</div>
              <div className="mb-2 text-sm text-gray-500">NIP: {business.nip}</div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusColors[business.status] ?? statusColors.unknown
                  }`}
                >
                  {statusLabels[business.status] ?? business.status}
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Trust Level {business.trustLevel}
                </span>
                {business.vatActive && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Czynny VAT
                  </span>
                )}
                {registrySourceLabel(business.registrySource) && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    Źródło: {registrySourceLabel(business.registrySource)}
                  </span>
                )}
              </div>
              {business.address?.city && (
                <div className="mt-2 text-xs text-gray-400">
                  {business.address.city}, {business.address.voivodeship}
                </div>
              )}
            </div>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="button"
              onClick={() => void handleIssueCert()}
              disabled={loading}
              className="mb-3 w-full rounded-xl bg-green-600 py-4 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Generujemy certyfikat..." : "Tak, generuj certyfikat →"}
            </button>
            <button
              type="button"
              onClick={() => setStep("nip")}
              className="w-full py-2 text-gray-500 hover:text-gray-700"
            >
              Wróć, to nie moja firma
            </button>
          </div>
        )}

        {step === "success" && <SuccessScreen certId={certId} qrUrl={qrUrl} />}
      </div>
    </main>
  );
}
