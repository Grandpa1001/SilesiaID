"use client";

import { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { verifyNip, issueCert } from "@/lib/api";
import Header from "../components/Header";
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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "#E1F5EE", text: "#085041", dot: "#1D9E75" },
  suspended: { bg: "#FAEEDA", text: "#633806", dot: "#854F0B" },
  deleted:   { bg: "#FCEBEB", text: "#791F1F", dot: "#A32D2D" },
  unknown:   { bg: "#F1EFE8", text: "#888780", dot: "#888780" },
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktywna", suspended: "Zawieszona", deleted: "Wykreślona", unknown: "Nieznany",
};

const TRUST_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "CEIDG — podstawowy", bg: "#FAEEDA", text: "#633806" },
  2: { label: "KRS — pełny",        bg: "#E6F1FB", text: "#0C447C" },
  3: { label: "Bank — zweryfikowany", bg: "#EEEDFE", text: "#3C3489" },
};

function registrySourceLabel(src?: BusinessData["registrySource"]) {
  if (src === "krs") return "KRS";
  if (src === "ceidg") return "CEIDG";
  if (src === "vat") return "Biała lista VAT (MF)";
  return null;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "nip",     label: "Podaj NIP" },
  { key: "confirm", label: "Potwierdź dane" },
  { key: "success", label: "Gotowe" },
];

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
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

  async function handleVerifyNip() {
    if (!/^\d{10}$/.test(nip)) { setError("NIP musi mieć dokładnie 10 cyfr"); return; }
    setLoading(true); setError("");
    try {
      const res = await verifyNip(nip);
      setBusiness(res.data as BusinessData);
      setStep("confirm");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd weryfikacji");
    } finally { setLoading(false); }
  }

  async function handleIssueCert() {
    setLoading(true); setError("");
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      const res = await issueCert(nip, embeddedWallet?.address);
      setCertId(res.certId); setQrUrl(res.qrUrl);
      setStep("success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd wydania certyfikatu");
    } finally { setLoading(false); }
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-[18px] font-medium text-gray-900">Zaloguj się</h1>
            <p className="mb-6 text-[13px] text-gray-500 leading-relaxed">
              Aby utworzyć certyfikat SilesiaID, musisz się najpierw zalogować.
            </p>
            <button
              type="button"
              onClick={login}
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Zaloguj się przez e-mail
            </button>
            <p className="mt-3 text-[11px] text-gray-400">Bez haseł · Logowanie przez e-mail lub SMS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto max-w-md px-4 py-8">
        {/* Step progress with labels */}
        <div className="mb-8 flex items-start">
          {STEPS.map((s, i) => {
            const isCompleted = currentStepIndex > i;
            const isCurrent = currentStepIndex === i;
            return (
              <div key={s.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div
                      className="h-px flex-1 transition-colors duration-300"
                      style={{ backgroundColor: currentStepIndex > i - 1 ? "#185FA5" : "#D1D5DB" }}
                    />
                  )}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted || isCurrent ? "#185FA5" : "#E5E7EB",
                      color: isCompleted || isCurrent ? "white" : "#9CA3AF",
                    }}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className="h-px flex-1 transition-colors duration-300"
                      style={{ backgroundColor: currentStepIndex > i ? "#185FA5" : "#D1D5DB" }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: isCurrent ? "#111827" : isCompleted ? "#185FA5" : "#9CA3AF" }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {step === "nip" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-slide-up">
            <h1 className="mb-1 text-[20px] font-medium text-gray-900">Podaj NIP firmy</h1>
            <p className="mb-6 text-[13px] leading-relaxed text-gray-500">
              System automatycznie sprawdzi dane w CEIDG, KRS i Białej liście VAT.
            </p>

            <label className="mb-1.5 block text-[12px] font-medium text-gray-600">
              NIP (10 cyfr)
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={nip}
              onChange={(e) => {
                setNip(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && nip.length === 10) void handleVerifyNip(); }}
              placeholder="np. 6310000000"
              autoFocus
              className="mb-1.5 w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 font-mono text-[18px] tracking-[0.2em] transition-colors focus:border-primary focus:outline-none"
            />
            <div className="mb-5 flex items-center justify-between">
              {error ? (
                <p className="text-[12px]" style={{ color: "#A32D2D" }}>{error}</p>
              ) : (
                <span />
              )}
              <span className={`text-[11px] tabular-nums ${nip.length === 10 ? "text-teal" : "text-gray-400"}`}>
                {nip.length}/10
              </span>
            </div>

            <button
              type="button"
              onClick={() => void handleVerifyNip()}
              disabled={loading || nip.length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Spinner />
                  Sprawdzamy Twoją firmę…
                </>
              ) : (
                "Weryfikuj NIP"
              )}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface px-3 py-3">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <p className="text-[11px] leading-relaxed text-gray-500">
                Dane pobierane bezpośrednio z CEIDG, KRS i Białej listy MF. NIP nie jest przechowywany bez Twojej zgody.
              </p>
            </div>
          </div>
        )}

        {step === "confirm" && business && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm animate-slide-up overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <h1 className="mb-1 text-[20px] font-medium text-gray-900">Czy to Twoja firma?</h1>
              <p className="text-[13px] text-gray-500">
                Znaleźliśmy takie dane w rejestrach publicznych:
              </p>
            </div>

            {/* Business card */}
            <div className="mx-6 mb-5 overflow-hidden rounded-xl border border-gray-100">
              {(() => {
                const sc = STATUS_COLORS[business.status] ?? STATUS_COLORS.unknown;
                return (
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: sc.bg }}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                    <span className="text-[12px] font-medium" style={{ color: sc.text }}>
                      {STATUS_LABELS[business.status] ?? business.status}
                    </span>
                  </div>
                );
              })()}

              <div className="p-4">
                <div className="mb-0.5 text-[17px] font-semibold text-gray-900">{business.name}</div>
                <div className="mb-3 font-mono text-[12px] text-gray-400">NIP: {business.nip}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const tc = TRUST_CONFIG[business.trustLevel] ?? TRUST_CONFIG[1];
                    return (
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                        style={{ backgroundColor: tc.bg, color: tc.text }}
                      >
                        {tc.label}
                      </span>
                    );
                  })()}
                  {business.vatActive && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
                    >
                      Czynny VAT
                    </span>
                  )}
                  {registrySourceLabel(business.registrySource) && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500">
                      Źródło: {registrySourceLabel(business.registrySource)}
                    </span>
                  )}
                </div>
                {business.address?.city && (
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {business.address.city}, {business.address.voivodeship}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 pb-6">
              {error && (
                <div className="mb-4 rounded-xl bg-danger-light px-4 py-3 text-[12px] text-danger">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleIssueCert()}
                disabled={loading}
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-medium text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#1D9E75" }}
              >
                {loading ? (
                  <>
                    <Spinner />
                    Generujemy certyfikat…
                  </>
                ) : (
                  <>
                    Tak, to moja firma — generuj certyfikat
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep("nip")}
                className="w-full py-2 text-[13px] text-gray-400 transition-colors hover:text-gray-600"
              >
                ← Wróć, to nie moja firma
              </button>
            </div>
          </div>
        )}

        {step === "success" && <SuccessScreen certId={certId} qrUrl={qrUrl} />}
      </main>
    </div>
  );
}
