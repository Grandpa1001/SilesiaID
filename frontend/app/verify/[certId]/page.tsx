import { notFound } from "next/navigation";

interface CertData {
  certId: string;
  company: {
    name: string;
    status: "active" | "suspended" | "deleted" | "unknown";
    trustLevel: number;
    vatActive: boolean;
    address?: { city: string; street: string; voivodeship: string; postCode: string };
  };
  txHash: string | null;
  issuedAt: string;
  verifiedAt: string;
}

async function getCert(certId: string): Promise<CertData | null> {
  try {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    const res = await fetch(`${backend}/api/v1/verify/${certId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as CertData;
  } catch {
    return null;
  }
}

const statusConfig = {
  active: {
    label: "Aktywna",
    color: "bg-green-500",
    text: "Firma aktywna i zweryfikowana",
  },
  suspended: {
    label: "Zawieszona",
    color: "bg-amber-500",
    text: "Firma tymczasowo zawieszona",
  },
  deleted: {
    label: "Wykreślona",
    color: "bg-red-500",
    text: "Firma wykreślona z rejestru",
  },
  unknown: {
    label: "Nieznany",
    color: "bg-gray-400",
    text: "Status nieznany",
  },
};

type PageProps = {
  params: Promise<{ certId: string }>;
};

export default async function VerifyPage({ params }: PageProps) {
  const { certId } = await params;
  const cert = await getCert(certId);
  if (!cert) notFound();

  const status =
    statusConfig[cert.company.status] ?? statusConfig.unknown;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className={`${status.color} mb-4 rounded-2xl p-4 text-center text-white`}>
          <div className="mb-1 text-3xl font-bold">{status.label}</div>
          <div className="text-sm opacity-90">{status.text}</div>
        </div>

        <div className="mb-4 rounded-2xl bg-white p-6 shadow">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cert.company.name}</h1>
              <p className="mt-0.5 text-sm text-gray-500">Certyfikat: {cert.certId}</p>
            </div>
            <div className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-bold text-blue-800">
              TL {cert.company.trustLevel}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoBox
              label="Status VAT"
              value={cert.company.vatActive ? "Czynny podatnik" : "Brak"}
            />
            <InfoBox label="Trust Level" value={trustLevelLabel(cert.company.trustLevel)} />
            {cert.company.address?.city && (
              <InfoBox label="Miasto" value={cert.company.address.city} />
            )}
            <InfoBox
              label="Weryfikacja"
              value={new Date(cert.verifiedAt).toLocaleString("pl-PL")}
            />
          </div>
        </div>

        {cert.txHash && (
          <div className="mb-4 rounded-2xl bg-white p-4 shadow">
            <p className="mb-1 text-xs text-gray-400">Potwierdzenie on-chain (Ethereum Sepolia)</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${cert.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-xs text-blue-600 hover:underline"
            >
              {cert.txHash}
            </a>
          </div>
        )}

        <div className="text-center text-xs text-gray-400">
          <p>Zweryfikowane przez SilesiaID · {new Date(cert.verifiedAt).toLocaleDateString("pl-PL")}</p>
          <p className="mt-1">Dane pobrane z CEIDG/KRS · Rejestr publiczny RP</p>
        </div>
      </div>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="mb-0.5 text-xs text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

function trustLevelLabel(level: number): string {
  return level === 1
    ? "1 — CEIDG"
    : level === 2
      ? "2 — KRS"
      : level === 3
        ? "3 — Bank"
        : "Brak";
}
