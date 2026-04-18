import { notFound } from "next/navigation";
import { LogoMark } from "@/app/components/Logo";

interface CertData {
  certId: string;
  company: {
    name: string;
    nip?: string;
    status: "active" | "suspended" | "deleted" | "unknown";
    trustLevel: number;
    vatActive: boolean;
    address?: { city: string; street: string; voivodeship: string; postCode: string };
  };
  txHash: string | null;
  issuedAt: string;
  verifiedAt: string;
  revoked?: boolean;
}

async function getCert(certId: string): Promise<CertData | null> {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backend}/api/v1/verify/${certId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as CertData;
  } catch {
    return null;
  }
}

const STATUS_CONFIG = {
  active: {
    label: "Firma zweryfikowana",
    sub: "Certyfikat ważny i aktywny",
    barBg: "#1D9E75",
    cardBg: "#E1F5EE",
    textColor: "#085041",
    icon: "✓",
  },
  pending_chain: {
    label: "Trwa oczekiwanie na odłożenie cyfrowego śladu",
    sub: "Poinformujemy Cię mailowo, gdy zapis techniczny będzie gotowy",
    barBg: "#E5A000",
    cardBg: "#FFF8E6",
    textColor: "#854F0B",
    icon: "⏳",
  },
  suspended: {
    label: "Firma zawieszona",
    sub: "Certyfikat wystawiony z ostrzeżeniem",
    barBg: "#854F0B",
    cardBg: "#FAEEDA",
    textColor: "#633806",
    icon: "!",
  },
  deleted: {
    label: "Firma wykreślona",
    sub: "Firma wykreślona z rejestru",
    barBg: "#A32D2D",
    cardBg: "#FCEBEB",
    textColor: "#791F1F",
    icon: "✕",
  },
  unknown: {
    label: "Status nieznany",
    sub: "Nie udało się ustalić statusu",
    barBg: "#888780",
    cardBg: "#F1EFE8",
    textColor: "#4A4A4A",
    icon: "?",
  },
};

const TRUST_CONFIG: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: "CEIDG — podstawowy", bg: "#FAEEDA", text: "#633806" },
  2: { label: "KRS — pełny",        bg: "#E3E9F2", text: "#1A2A47" },
  3: { label: "Bank — zweryfikowany", bg: "#EEEDFE", text: "#3C3489" },
};

type PageProps = {
  params: Promise<{ certId: string }>;
};

function verifyPageStatusKey(cert: CertData): keyof typeof STATUS_CONFIG {
  if (cert.company.status === "suspended") return "suspended";
  if (cert.company.status === "deleted") return "deleted";
  if (!cert.txHash) return "pending_chain";
  return cert.company.status === "unknown" ? "unknown" : "active";
}

const WATERMARK_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='360' height='180'%3E%3Ctext x='180' y='90' font-family='system-ui%2Csans-serif' font-size='12' font-weight='700' fill='%23273E65' opacity='0.045' text-anchor='middle' dominant-baseline='middle' transform='rotate(-35%2C180%2C90)' letter-spacing='4'%3ESilesiaID%20VERIFICATION%3C/text%3E%3C/svg%3E")`;

export default async function VerifyPage({ params }: PageProps) {
  const { certId } = await params;
  const cert = await getCert(certId);
  if (!cert) notFound();

  const status = STATUS_CONFIG[verifyPageStatusKey(cert)] ?? STATUS_CONFIG.unknown;
  const trustCfg = TRUST_CONFIG[cert.company.trustLevel] ?? TRUST_CONFIG[1];

  if (cert.revoked) {
    return (
      <div className="relative min-h-screen bg-surface" style={{ backgroundImage: WATERMARK_SVG }}>
        <VerifyHeader />
        <main className="mx-auto max-w-md px-4 py-10">
          <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 text-center" style={{ backgroundColor: "#FCEBEB" }}>
              <div className="mb-1 text-[28px] font-medium" style={{ color: "#A32D2D" }}>✕</div>
              <div className="text-[15px] font-medium" style={{ color: "#791F1F" }}>Certyfikat wycofany</div>
              <div className="text-[13px] mt-1" style={{ color: "#A32D2D" }}>
                Właściciel wycofał ten certyfikat
              </div>
            </div>
            <div className="p-5 text-center">
              <p className="text-[13px] text-gray-500">
                Certyfikat o ID <span className="font-mono">{certId}</span> nie jest już aktywny.
              </p>
            </div>
          </div>
          <VerifyFooter />
        </main>
      </div>
    );
  }

  const nipFormatted = cert.company.nip
    ? cert.company.nip.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, "$1-$2-$3-$4")
    : certId.split("-").slice(0, 2).join("-");

  return (
    <div className="relative min-h-screen bg-surface" style={{ backgroundImage: WATERMARK_SVG }}>
      <VerifyHeader />

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden shadow-sm">
          {/* Status banner */}
          <div
            className="px-5 py-5 text-center"
            style={{ backgroundColor: status.cardBg }}
          >
            <div
              className="mb-1 flex h-12 w-12 items-center justify-center rounded-full mx-auto text-[22px] font-medium text-white"
              style={{ backgroundColor: status.barBg }}
            >
              {status.icon}
            </div>
            <div className="text-[17px] font-medium mt-2" style={{ color: status.textColor }}>
              {status.label}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: status.textColor, opacity: 0.8 }}>
              {status.sub}
            </div>
          </div>

          {/* Data */}
          <div className="p-5">
            <h1 className="mb-1 text-[18px] font-medium text-gray-900">{cert.company.name}</h1>
            <p className="mb-4 font-mono text-[12px] text-gray-400">NIP: {nipFormatted}</p>

            <div className="space-y-2 mb-4">
              <DataRow label="Status" value={status.label} />
              <DataRow
                label="Biała lista VAT"
                value={cert.company.vatActive ? "Aktywny podatnik VAT" : "Brak w rejestrze"}
              />
              <DataRow
                label="Trust Level"
                customValue={
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: trustCfg.bg, color: trustCfg.text }}
                  >
                    {trustCfg.label}
                  </span>
                }
              />
              {cert.company.address?.city && (
                <DataRow
                  label="Siedziba"
                  value={`${cert.company.address.city}, ${cert.company.address.voivodeship}`}
                />
              )}
              <DataRow
                label="Certyfikat wystawiony"
                value={new Date(cert.issuedAt).toLocaleDateString("pl-PL")}
              />
              <DataRow
                label="Dane z rejestrów"
                value={new Date(cert.verifiedAt).toLocaleDateString("pl-PL")}
              />
            </div>
          </div>
        </div>

        {/* Digital proof section */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm overflow-hidden shadow-sm">
          <div className="flex items-start gap-3 px-5 py-4">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-[15px]"
              style={{ backgroundColor: "#273E65" }}
            >
              🔏
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">Weryfikowalny dowód cyfrowy</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-gray-500">
                Certyfikat opiera się o infrastrukturę zaufania zgodną z praktykami UE (EBSI). Dane pochodzą z
                CEIDG / KRS — rejestrów publicznych RP.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Zapis techniczny i dowód
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-gray-500">
              Ten sam identyfikator co w rejestrze SilesiaID: niezmienny zapis wystawienia certyfikatu w
              infrastrukturze zaufania — dokumentacja przydatna w audycie i weryfikacji przez instytucje.
            </p>
            {cert.txHash ? (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-gray-700">
                  Pełna wartość techniczna (do skopiowania i porównania z rejestrem publicznym):
                </p>
                <p className="select-all rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-gray-900 break-all">
                  {cert.txHash}
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/25 bg-primary-light/50 px-3 py-2 text-[12px] font-medium text-primary-dark hover:bg-primary-light"
                >
                  <svg className="h-4 w-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                  Zobacz potwierdzenie w rejestrze publicznym
                </a>
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-amber-800">
                Trwa oczekiwanie na odłożenie cyfrowego śladu — identyfikator pojawi się automatycznie po zapisie w
                infrastrukturze zaufania. Poinformujemy Cię mailowo, gdy potwierdzenie będzie dostępne. Jeśli zapis się
                nie powiedzie, powiadomimy Cię tak samo — to nasza obsługa błędów zapisu technicznego.
              </p>
            )}
            <div className="mt-3 border-t border-gray-50 pt-3">
              <span className="font-mono text-[10px] text-gray-400">ID: {certId}</span>
            </div>
          </div>
        </div>

        <VerifyFooter />
      </main>
    </div>
  );
}

function VerifyHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        <LogoMark size={56} />
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Weryfikacja live
        </span>
      </div>
    </header>
  );
}

function VerifyFooter() {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 pb-6">
      <div className="flex items-center gap-2 opacity-50">
        <div className="h-px w-12 bg-gray-300" />
        <LogoMark size={28} />
        <div className="h-px w-12 bg-gray-300" />
      </div>
      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400">
        SilesiaID Verification
      </p>
      <p className="text-[10px] text-gray-300 text-center">
        CEIDG / KRS · Rejestr publiczny RP · EBSI
      </p>
    </div>
  );
}

function DataRow({
  label,
  value,
  customValue,
}: {
  label: string;
  value?: string;
  customValue?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-[12px] text-gray-400">{label}</span>
      {customValue ?? <span className="text-[13px] font-medium text-gray-800">{value}</span>}
    </div>
  );
}
