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
      next: { revalidate: 30 },
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
  2: { label: "KRS — pełny",        bg: "#E6F1FB", text: "#0C447C" },
  3: { label: "Bank — zweryfikowany", bg: "#EEEDFE", text: "#3C3489" },
};

type PageProps = {
  params: Promise<{ certId: string }>;
};

export default async function VerifyPage({ params }: PageProps) {
  const { certId } = await params;
  const cert = await getCert(certId);
  if (!cert) notFound();

  const status = STATUS_CONFIG[cert.company.status] ?? STATUS_CONFIG.unknown;
  const trustCfg = TRUST_CONFIG[cert.company.trustLevel] ?? TRUST_CONFIG[1];

  if (cert.revoked) {
    return (
      <div className="min-h-screen bg-surface">
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
    <div className="min-h-screen bg-surface">
      <VerifyHeader />

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
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

          {cert.txHash && (
            <div className="border-t border-gray-50 px-5 py-3">
              <p className="mb-1 text-[11px] text-gray-400">Potwierdzenie on-chain (Ethereum Sepolia)</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] text-primary hover:underline break-all"
              >
                {cert.txHash}
              </a>
            </div>
          )}
        </div>

        <VerifyFooter />
      </main>
    </div>
  );
}

function VerifyHeader() {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <span className="flex items-center gap-2.5">
          <LogoMark size={26} />
          <span className="text-[14px] font-semibold tracking-tight">
            <span className="text-gray-900">Silesia</span>
            <span className="text-[#185FA5]">ID</span>
          </span>
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#1D9E75]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1D9E75]" />
          live
        </span>
      </div>
    </header>
  );
}

function VerifyFooter() {
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <span className="flex items-center gap-1.5">
        <LogoMark size={16} />
        <span className="text-[11px] font-semibold tracking-tight">
          <span className="text-gray-600">Silesia</span>
          <span className="text-[#185FA5]">ID</span>
        </span>
      </span>
      <p className="text-[11px] text-gray-400 text-center">
        Dane z CEIDG / KRS · Rejestr publiczny RP · EBSI kompatybilny
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
