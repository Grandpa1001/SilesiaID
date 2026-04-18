"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { verifyNip, issueCert, pollCertificateTxHash } from "@/lib/api";
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
  2: { label: "KRS — pełny",        bg: "#E3E9F2", text: "#1A2A47" },
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

const CERT_GENERATING_HINTS = [
  "Możesz go wykorzystać do sprawy w banku.",
  "Przyda się w urzędzie i w kontakcie z administracją.",
  "Potwierdzisz nim firmę u partnerów i w relacjach B2B.",
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
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();

  const [step, setStep] = useState<Step>("nip");
  const [nip, setNip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [certId, setCertId] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [issueFromCache, setIssueFromCache] = useState<{ alreadyExists: boolean; txHash: string | null } | null>(null);
  const [confirmingOnChain, setConfirmingOnChain] = useState(false);
  /** Po nieudanym mincie pokazujemy wskazówki: backend vs Network (nie „logi frontendu”). */
  const [showMintFailureLogHint, setShowMintFailureLogHint] = useState(false);
  const [chainConflict, setChainConflict] = useState(false);
  const [certHintIndex, setCertHintIndex] = useState(0);

  const showCertGeneratingModal =
    step === "confirm" && Boolean(business) && (loading || confirmingOnChain);

  useEffect(() => {
    if (!showCertGeneratingModal) {
      setCertHintIndex(0);
      return;
    }
    const id = window.setInterval(() => {
      setCertHintIndex((i) => (i + 1) % CERT_GENERATING_HINTS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [showCertGeneratingModal]);

  async function handleVerifyNip() {
    if (!/^\d{10}$/.test(nip)) { setError("NIP musi mieć dokładnie 10 cyfr"); return; }
    setLoading(true); setError(""); setShowMintFailureLogHint(false);
    try {
      const res = await verifyNip(nip);
      setBusiness(res.data as BusinessData);
      setStep("confirm");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd weryfikacji");
    } finally { setLoading(false); }
  }

  async function handleIssueCert() {
    setLoading(true);
    setError("");
    setShowMintFailureLogHint(false);
    setChainConflict(false);
    setConfirmingOnChain(false);
    try {
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet?.address) {
        console.warn("[SilesiaID] issue-cert: przerwane — brak adresu portfela Privy (embedded). Poczekaj na załadowanie portfela.");
        setError("Portfel nie jest jeszcze gotowy — poczekaj chwilę i spróbuj ponownie.");
        setLoading(false);
        return;
      }
      const w = embeddedWallet.address;
      console.log("[SilesiaID] issue-cert: wysyłam POST /issue-cert", {
        backend: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        nip,
        wallet: `${w.slice(0, 8)}…${w.slice(-6)}`,
      });

      const res = await issueCert(nip, embeddedWallet.address);

      /** Brak pola w JSON (stary backend) nie znaczy „mint nie był” — dla nowego certu domyślnie tak. */
      const alreadyExists = Boolean(res.alreadyExists);
      const mintAttempted = res.mintAttempted ?? !alreadyExists;
      const mintFailed =
        res.mintFailed === true || (Boolean(res.mintError) && !res.txHash);

      console.log("[SilesiaID] issue-cert: odpowiedź API", {
        certId: res.certId,
        issueRouteVersion: res.issueRouteVersion ?? "(brak — zrestartuj backend w katalogu backend/)",
        alreadyExists,
        mintAttempted,
        mintFailed,
        hasTxHash: Boolean(res.txHash),
        mintError: res.mintError ?? null,
        hint:
          mintAttempted === false
            ? "W tym POST backend nie wywołał mintCertificate (np. cert już w bazie i nie było retry)."
            : "Mint był wykonywany na serwerze w trakcie tego POST (patrz logi backendu [mint]).",
      });

      if (res.issueRouteVersion !== 2 && !res.txHash) {
        console.warn(
          "[SilesiaID] Brak issueRouteVersion=2 w JSON z POST /issue-cert — inny proces na :3001 albo stary kod. " +
            "Sprawdź: curl -s http://localhost:3001/health | jq .issueRouteVersion (musi być 2). " +
            "Zabij wszystkie node na 3001 i uruchom tylko: cd backend && npm run dev"
        );
      }

      if (mintFailed) {
        let msg =
          res.mintError ??
          "Mint na Sepolii nie powiódł się. Certyfikat mógł zostać zapisany lokalnie — możesz spróbować ponownie (druga próba wyśle mint od nowa, jeśli backend na to pozwala).";
        if (res.chainConflict && res.existingCertIdFromChain) {
          setChainConflict(true);
          msg =
            "Ten portfel ma już certyfikat na Sepolii (jeden token na adres). " +
            `ID na łańcuchu: ${res.existingCertIdFromChain}. ` +
            (res.onChainMintTxHash
              ? `Tx mint (do bazy / weryfikacji): ${res.onChainMintTxHash}. `
              : "") +
            "Otwórz „Mój certyfikat” albo w Sepolia wycofaj token i wystaw certyfikat ponownie.";
        }
        setError(msg);
        setShowMintFailureLogHint(true);
        console.warn("[onboarding] mintFailed — szczegóły techniczne poniżej; pełny stack tylko w logach backendu", {
          mintError: res.mintError,
          certId: res.certId,
          chainConflict: res.chainConflict,
          existingCertIdFromChain: res.existingCertIdFromChain,
          onChainMintTxHash: res.onChainMintTxHash,
        });
        return;
      }

      let tx = res.txHash ?? null;

      const alreadyExistsNoMint = alreadyExists && mintAttempted !== true && !tx;

      if (!tx && alreadyExistsNoMint) {
        console.log(
          "[SilesiaID] pomijam modal „szukam hashu” — cert już był w bazie i w tym POST nie było minca; nie ma sensu udawać oczekiwania na tx",
          { certId: res.certId }
        );
      } else if (!tx) {
        console.log(
          "[SilesiaID] drugi etap: odpytywanie GET /verify (to nie jest mint; mint był w poprzednim POST tylko gdy mintAttempted=true)",
          { certId: res.certId, mintAttempted }
        );
        setConfirmingOnChain(true);
        try {
          const maxMs = mintAttempted ? 50000 : 15000;
          tx = await pollCertificateTxHash(res.certId, { maxMs, intervalMs: 2500 });
        } finally {
          setConfirmingOnChain(false);
        }
      }

      setCertId(res.certId);
      setQrUrl(res.qrUrl);
      setIssueFromCache({
        alreadyExists,
        txHash: tx,
      });
      if (alreadyExists) {
        if (mintAttempted) {
          console.warn("[SilesiaID] alreadyExists + w tym POST był ponowny mint (ścieżka brak tx_hash)", res);
        } else {
          console.warn(
            "[SilesiaID] alreadyExists — w tym POST nie było wywołania mint (rekord NIP już w bazie; tx już jest albo nie spełniono warunków retry)",
            res
          );
        }
      } else {
        console.log("[SilesiaID] nowy certyfikat: INSERT + mint w POST (mintAttempted zwykle true)", {
          certId: res.certId,
          mintAttempted,
          txHash: tx,
        });
      }
      setStep("success");
    } catch (e: unknown) {
      console.error("[SilesiaID] issue-cert: błąd sieci lub API (fetch nie doszedł / 4xx/5xx)", e);
      setError(e instanceof Error ? e.message : "Błąd wydania certyfikatu");
    } finally {
      setLoading(false);
    }
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
                      style={{ backgroundColor: currentStepIndex > i - 1 ? "#273E65" : "#D1D5DB" }}
                    />
                  )}
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-medium transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted || isCurrent ? "#273E65" : "#E5E7EB",
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
                      style={{ backgroundColor: currentStepIndex > i ? "#273E65" : "#D1D5DB" }}
                    />
                  )}
                </div>
                <span
                  className="text-[11px] font-medium transition-colors"
                  style={{ color: isCurrent ? "#111827" : isCompleted ? "#273E65" : "#9CA3AF" }}
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
                setShowMintFailureLogHint(false);
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

        {showCertGeneratingModal && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
            role="alertdialog"
            aria-busy="true"
            aria-live="polite"
            aria-label="Trwa tworzenie certyfikatu"
          >
            <div className="max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F7F1]">
                <Spinner />
              </div>
              <p className="text-[16px] font-medium leading-snug text-gray-900">
                Trwa tworzenie cyfrowego certyfikatu dla Twojej firmy
              </p>
              <p
                key={certHintIndex}
                className="mt-4 min-h-13 text-[14px] leading-relaxed text-gray-600 motion-safe:animate-fade-in"
              >
                {CERT_GENERATING_HINTS[certHintIndex]}
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
                  {showMintFailureLogHint && (
                    <p className="mb-2 text-[13px] font-semibold text-gray-900">
                      {chainConflict ? "Portfel ma już certyfikat na łańcuchu" : "Mint na Sepolii się nie udał"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{error}</p>
                  {chainConflict && (
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="mt-3 w-full rounded-xl bg-[#1A1A1A] py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Przejdź do „Mój certyfikat”
                    </button>
                  )}
                  {showMintFailureLogHint && !chainConflict && (
                    <div className="mt-4 border-t border-red-200/80 pt-3 text-[11px] leading-relaxed text-gray-800">
                      <p className="font-medium text-gray-900">Gdzie szukać przyczyny?</p>
                      <ul className="mt-2 list-disc space-y-1.5 pl-4">
                        <li>
                          <strong>Backend (terminal)</strong> — proces z{" "}
                          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">npm run dev</code> w
                          katalogu <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">backend</code>
                          . Szukaj linii{" "}
                          <code className="break-all rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">
                            [issue-cert] mint nieudany
                          </code>{" "}
                          lub{" "}
                          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">[mint]</code> — tam jest
                          pełny komunikat z sieci Ethereum / kontraktu (viem).
                        </li>
                        <li>
                          <strong>Przeglądarka</strong> —{" "}
                          <span className="font-medium">DevTools → Network</span> → żądanie{" "}
                          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">issue-cert</code> →
                          odpowiedź JSON: pole{" "}
                          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[10px]">mintError</code>.
                        </li>
                      </ul>
                      <p className="mt-3 text-gray-600">
                        Konsola przeglądarki (F12 → Console) <strong>nie</strong> pokazuje szczegółów RPC ani revertów z
                        Sepolii — tylko to, co widzisz tutaj oraz w Network.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleIssueCert()}
                disabled={loading || confirmingOnChain}
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-medium text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: "#1D9E75" }}
              >
                {loading ? (
                  "Trwa generowanie"
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

        {step === "success" && (
          <SuccessScreen
            certId={certId}
            qrUrl={qrUrl}
            alreadyExists={issueFromCache?.alreadyExists}
          />
        )}
      </main>
    </div>
  );
}
