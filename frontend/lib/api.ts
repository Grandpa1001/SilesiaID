const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function verifyNip(nip: string) {
  const res = await fetch(`${BACKEND}/api/v1/verify-nip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nip }),
  });
  return handleResponse<{
    data: {
      nip: string;
      name: string;
      status: string;
      type: string;
      krsNumber: string | null;
      address: { city: string; street: string; voivodeship: string; postCode: string };
      vatActive: boolean;
      trustLevel: number;
      registrySource?: "krs" | "ceidg" | "vat";
    };
  }>(res);
}

export async function issueCert(nip: string, userWallet?: string) {
  const res = await fetch(`${BACKEND}/api/v1/issue-cert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nip, userWallet }),
  });
  return handleResponse<{ certId: string; qrUrl: string; txHash: string | null; company: string; alreadyExists?: boolean }>(res);
}

export async function getCertificate(certId: string) {
  const res = await fetch(`${BACKEND}/api/v1/verify/${certId}`);
  return handleResponse<{
    certId: string;
    company: { name: string; status: string; trustLevel: number; vatActive: boolean; address?: { city: string; voivodeship: string } };
    txHash: string | null;
    issuedAt: string;
    verifiedAt: string;
  }>(res);
}

export async function getMyCert(wallet: string) {
  const res = await fetch(`${BACKEND}/api/v1/my-cert?wallet=${encodeURIComponent(wallet)}`);
  return handleResponse<{
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
  }>(res);
}

export async function revokeCert(certId: string, wallet: string) {
  const res = await fetch(`${BACKEND}/api/v1/cert/${certId}/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet }),
  });
  return handleResponse<{ success: boolean; message: string }>(res);
}
