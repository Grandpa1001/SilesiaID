"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType, useCallback } from "react";
import Header from "../components/Header";
import { getMyCert, revokeCert } from "@/lib/api";

type CertData = {
  certId: string;
  nip: string;
  qrUrl: string;
  txHash: string | null;
  issuedAt: string;
  company: {
    name: string;
    status: string;
    trustLevel: number;
    vatActive: boolean;
    address?: { city: string; voivodeship: string };
  };
  verifyHistory: { verifier: string | null; verified_at: string }[];
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active:    { label: "Aktywna",    bg: "#E1F5EE", text: "#085041", dot: "#1D9E75" },
  suspended: { label: "Zawieszona", bg: "#FAEEDA", text: "#633806", dot: "#854F0B" },
  deleted:   { label: "Wykreślona", bg: "#FCEBEB", text: "#791F1F", dot: "#A32D2D" },
  unknown:   { label: "Nieznany",   bg: "#F1EFE8", text: "#888780", dot: "#888780" },
  /** Brak tx_hash — rejestr jeszcze nie ma pełnego potwierdzenia łańcuchowego */
  pending_chain: {
    label: "Trwa oczekiwanie na odłożenie cyfrowego śladu",
    bg: "#FFF8E6",
    text: "#854F0B",
    dot: "#E5A000",
  },
};

function dashboardStatusKey(cert: CertData): keyof typeof STATUS_CONFIG {
  if (cert.company.status === "suspended") return "suspended";
  if (cert.company.status === "deleted") return "deleted";
  if (!cert.txHash) return "pending_chain";
  return cert.company.status === "unknown" ? "unknown" : "active";
}

const TRUST_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "CEIDG — podstawowy", bg: "#FAEEDA", text: "#633806" },
  2: { label: "KRS — pełny",        bg: "#E3E9F2", text: "#1A2A47" },
  3: { label: "Bank — zweryfikowany", bg: "#EEEDFE", text: "#3C3489" },
};

export default function DashboardPage() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [cert, setCert] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(false);
  const [QRCode, setQRCode] = useState<ComponentType<{ value: string; size: number }> | null>(null);

  useEffect(() => {
    if (ready && !authenticated) router.push("/");
  }, [ready, authenticated, router]);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const fetchCert = useCallback(async () => {
    if (!embeddedWallet?.address) return;
    setLoading(true);
    setError("");
    try {
      const data = await getMyCert(embeddedWallet.address);
      setCert(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd ładowania");
    } finally {
      setLoading(false);
    }
  }, [embeddedWallet?.address]);

  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      void fetchCert();
      void import("qrcode.react").then((m) => setQRCode(() => m.QRCodeSVG));
    }
  }, [ready, authenticated, embeddedWallet, fetchCert]);

  /** Automatyczne odświeżanie, dopóki backend nie dopisze tx_hash (mint / backfill). */
  useEffect(() => {
    if (!cert || cert.txHash) return;
    if (cert.company.status === "suspended" || cert.company.status === "deleted") return;
    const id = window.setInterval(() => void fetchCert(), 5000);
    return () => window.clearInterval(id);
  }, [cert, fetchCert]);

  async function handleRevoke() {
    if (!cert || !embeddedWallet?.address) return;
    setRevoking(true);
    try {
      await revokeCert(cert.certId, embeddedWallet.address);
      setCert(null);
      setRevokeConfirm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd wycofania");
    } finally {
      setRevoking(false);
    }
  }

  function downloadQR() {
    const svg = document.querySelector("#cert-qr svg") as SVGElement | null;
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SilesiaID-${cert?.certId ?? "cert"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!ready || loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-[13px] text-gray-400">Ładowanie certyfikatu...</p>
        </div>
      </div>
    );
  }

  const statusCfg = cert ? (STATUS_CONFIG[dashboardStatusKey(cert)] ?? STATUS_CONFIG.unknown) : null;
  const trustCfg = cert ? (TRUST_CONFIG[cert.company.trustLevel] ?? TRUST_CONFIG[1]) : null;

  return (
    <div className="min-h-screen bg-surface">
      <Header />

      <main className="mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-light px-4 py-3 text-[13px] text-danger">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {!cert ? (
          /* Empty state */
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="mb-5 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 text-[20px] font-medium text-gray-900">Brak certyfikatu</h1>
            <p className="mb-7 text-[14px] leading-relaxed text-gray-500">
              Nie masz jeszcze certyfikatu SilesiaID.<br />
              Utwórz go w 3 minuty — tylko NIP jest potrzebny.
            </p>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A1A1A] px-7 py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-gray-800"
            >
              Utwórz certyfikat SilesiaID
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main cert card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              {/* Status bar */}
              <div
                className="flex flex-wrap items-center gap-2 px-5 py-3"
                style={{ backgroundColor: statusCfg!.bg }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusCfg!.dot }} />
                <span className="text-[13px] font-medium" style={{ color: statusCfg!.text }}>
                  {statusCfg!.label}
                </span>
                {trustCfg && (
                  <span
                    className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: trustCfg.bg, color: trustCfg.text }}
                  >
                    {trustCfg.label}
                  </span>
                )}
                {cert.company.vatActive && (
                  <span className="rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ backgroundColor: "#E1F5EE", color: "#085041" }}>
                    Czynny VAT
                  </span>
                )}
              </div>

              <div className="p-5">
                {/* Company name */}
                <div className="mb-5">
                  <h1 className="text-[20px] font-semibold leading-snug text-gray-900">
                    {cert.company.name}
                  </h1>
                  <p className="mt-1 font-mono text-[12px] text-gray-400">
                    NIP: {cert.nip.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1-$2-$3-$4")}
                  </p>
                </div>

                {/* Metadata grid */}
                <div className="mb-6 grid grid-cols-2 gap-2.5">
                  <InfoBox label="Certyfikat ID" value={cert.certId} mono />
                  <InfoBox
                    label="Wystawiony"
                    value={new Date(cert.issuedAt).toLocaleDateString("pl-PL")}
                  />
                  {cert.company.address?.city && (
                    <InfoBox
                      label="Siedziba"
                      value={`${cert.company.address.city}, ${cert.company.address.voivodeship}`}
                    />
                  )}
                  <InfoBox
                    label="Liczba weryfikacji"
                    value={String(cert.verifyHistory.length)}
                  />
                </div>

                {/* QR code — primary action */}
                <div className="rounded-2xl border border-gray-100 bg-surface/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 14.625c0-.621.504-1.125 1.125-1.125h2.25v2.25h-2.25v-2.25ZM13.5 19.125v2.25h2.25v-2.25H13.5ZM18 14.625h2.25v2.25H18v-2.25ZM18 19.125v2.25h2.25v-2.25H18Z" />
                    </svg>
                    <span className="text-[13px] font-medium text-gray-700">Kod QR do weryfikacji</span>
                  </div>

                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                    <div id="cert-qr" className="shrink-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
                      {QRCode ? (
                        <QRCode value={cert.qrUrl} size={140} />
                      ) : (
                        <div className="flex h-[140px] w-[140px] items-center justify-center rounded-lg bg-gray-50 text-[11px] text-gray-400">
                          Ładowanie QR...
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3 sm:pt-1">
                      <p className="text-[12px] leading-relaxed text-gray-500">
                        Pokaż ten kod — instytucja zweryfikuje Twoją firmę w 3 sekundy bez logowania.
                      </p>
                      <div className="rounded-lg bg-white px-3 py-2 font-mono text-[10px] text-gray-400 break-all border border-gray-100">
                        {cert.qrUrl}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={downloadQR}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-gray-600 transition-colors hover:bg-surface"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Pobierz QR (SVG)
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/verify/${cert.certId}`)}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-gray-600 transition-colors hover:bg-surface"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          Otwórz stronę weryfikacji
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 px-5 py-3.5">
                <p className="mb-1 text-[12px] font-medium text-gray-800">
                  Potwierdzenie techniczne certyfikatu
                </p>
                <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
                  Identyfikator zapisu w rejestrze infrastruktury zaufania — służy do audytu i porównania z
                  publicznym potwierdzeniem wydania.
                </p>
                {cert.txHash ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-gray-600">
                      Pełna wartość referencyjna (możesz zaznaczyć i skopiować):
                    </p>
                    <p className="select-all rounded-lg border border-gray-100 bg-white px-3 py-2 font-mono text-[11px] leading-relaxed text-gray-900 break-all">
                      {cert.txHash}
                    </p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[12px] font-medium text-primary hover:underline"
                    >
                      Zobacz zapis w rejestrze publicznym potwierdzeń →
                    </a>
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    Trwa oczekiwanie na odłożenie cyfrowego śladu — identyfikator zapisu pojawi się tu automatycznie po
                    zapisie. Poinformujemy Cię mailowo, gdy potwierdzenie będzie gotowe. W razie błędu zapisu
                    wyślemy informację na ten sam adres — to nasza obsługa błędów zapisu technicznego.
                  </p>
                )}
              </div>
            </div>

            {/* Verification history */}
            {cert.verifyHistory.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <h2 className="text-[15px] font-medium text-gray-900">Historia weryfikacji</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    {cert.verifyHistory.length}
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {cert.verifyHistory.map((ev, i) => (
                    <li key={i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-light text-teal">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </span>
                        <span className="text-[13px] text-gray-700">
                          {ev.verifier ?? "Weryfikacja anonimowa"}
                        </span>
                      </div>
                      <span className="text-[11px] tabular-nums text-gray-400">
                        {new Date(ev.verified_at).toLocaleString("pl-PL", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Revoke */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-1 text-[15px] font-medium text-gray-900">Wycofanie certyfikatu</h2>
              <p className="mb-4 text-[13px] leading-relaxed text-gray-500">
                Wycofanie sprawia, że certyfikat przestaje być publicznie dostępny.
                Operacji nie można cofnąć.
              </p>
              {!revokeConfirm ? (
                <button
                  type="button"
                  onClick={() => setRevokeConfirm(true)}
                  className="rounded-xl border border-danger px-4 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger-light"
                >
                  Wycofaj certyfikat
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[13px] text-gray-700">Na pewno wycofać certyfikat?</span>
                  <button
                    type="button"
                    onClick={() => void handleRevoke()}
                    disabled={revoking}
                    className="flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {revoking && (
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    )}
                    {revoking ? "Wycofuję..." : "Tak, wycofaj"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeConfirm(false)}
                    className="text-[13px] text-gray-400 transition-colors hover:text-gray-600"
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoBox({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-surface px-3 py-3">
      <div className="mb-0.5 text-[11px] font-medium text-gray-400">{label}</div>
      <div className={`text-[13px] font-medium text-gray-800 ${mono ? "font-mono truncate" : ""}`}>
        {value}
      </div>
    </div>
  );
}
