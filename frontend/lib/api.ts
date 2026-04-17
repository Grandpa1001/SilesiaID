const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function verifyNip(nip: string) {
  const res = await fetch(`${BACKEND}/api/v1/verify-nip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nip }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Błąd weryfikacji NIP");
  }
  return res.json();
}

export async function issueCert(nip: string, userWallet?: string) {
  const res = await fetch(`${BACKEND}/api/v1/issue-cert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nip, userWallet }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Błąd wydania certyfikatu");
  }
  return res.json();
}

export async function getCertificate(certId: string) {
  const res = await fetch(`${BACKEND}/api/v1/verify/${certId}`);
  if (!res.ok) throw new Error("Certyfikat nie znaleziony");
  return res.json();
}
