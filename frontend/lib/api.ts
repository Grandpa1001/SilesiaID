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
  const url = `${BACKEND}/api/v1/issue-cert`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nip, userWallet }),
  });
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const ver = res.headers.get("X-SilesiaID-Issue-Route");
    console.info("[SilesiaID] issue-cert fetch OK:", res.ok, "url:", res.url || url);
    console.info("[SilesiaID] nagłówek X-SilesiaID-Issue-Route:", ver ?? "(brak — stary backend albo CORS nie udostępnia nagłówka)");
  }
  return handleResponse<{
    certId: string;
    qrUrl: string;
    txHash: string | null;
    company?: string;
    alreadyExists?: boolean;
    mintFailed?: boolean;
    mintError?: string;
    /** Czy backend faktycznie wywołał mintCertificate (transakcja na Sepolii w tym POST). */
    mintAttempted?: boolean;
    /** Oczekiwana wartość 2 — jeśli brak, działa stary proces backendu. */
    issueRouteVersion?: number;
    /** Portfel ma już NFT na Sepolii — nie wystawiono drugiego certu. */
    chainConflict?: boolean;
    existingCertIdFromChain?: string;
    onChainMintTxHash?: string | null;
  }>(res);
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

/** Oczekuje na dopisanie tx_hash (backfill z łańcucha po GET /verify). */
export async function pollCertificateTxHash(
  certId: string,
  opts?: { maxMs?: number; intervalMs?: number }
): Promise<string | null> {
  const maxMs = opts?.maxMs ?? 45000;
  const intervalMs = opts?.intervalMs ?? 2000;
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const c = await getCertificate(certId);
      if (c.txHash) return c.txHash;
    } catch {
      /* kolejna próba */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

/** Zwraca certyfikat lub `null` przy 404 (brak certu dla portfela) — bez rzucania wyjątku. */
export async function getMyCert(wallet: string) {
  const res = await fetch(`${BACKEND}/api/v1/my-cert?wallet=${encodeURIComponent(wallet)}`);
  if (res.status === 404) return null;
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
