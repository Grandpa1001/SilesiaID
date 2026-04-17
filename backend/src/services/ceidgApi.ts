import type { BusinessIdentity } from "../types/businessIdentity";
import { getMockCeidgByNip } from "./mockCeidg";

const CEIDG_BASE =
  process.env.CEIDG_API_BASE_URL || "https://dane.biznes.gov.pl/api/ceidg/v3";

/**
 * Mock CEIDG (bez HTTP): gdy CEIDG_MOCK_MODE=true — wpisy `registrySource: "ceidg"` z mockData.ts.
 * Produkcja: CEIDG_MOCK_MODE=false + CEIDG_API_KEY (API Biznes.gov.pl).
 */
export async function fetchCeidgBusinessByNip(nip: string): Promise<BusinessIdentity | null> {
  if (process.env.CEIDG_MOCK_MODE === "true") {
    return getMockCeidgByNip(nip);
  }

  const token = process.env.CEIDG_API_KEY || process.env.BIZNES_GOV_API_KEY;
  if (!token) {
    return null;
  }

  try {
    const url = `${CEIDG_BASE}/firmy?nip=${encodeURIComponent(nip)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    return mapCeidgPayloadToIdentity(nip, data);
  } catch {
    return null;
  }
}

function mapCeidgPayloadToIdentity(nip: string, data: unknown): BusinessIdentity | null {
  if (!data || typeof data !== "object") return null;

  const root = data as Record<string, unknown>;
  const candidate =
    pickFirma(root.firma) ??
    pickFirma(root.firmaDto) ??
    (Array.isArray(root.items) ? pickFirma(root.items[0]) : null) ??
    (Array.isArray(root.firmy) ? pickFirma(root.firmy[0]) : null);

  if (!candidate || typeof candidate !== "object") return null;

  const f = candidate as Record<string, unknown>;
  const name =
    (typeof f.nazwa === "string" && f.nazwa) ||
    (typeof f.nazwaPelna === "string" && f.nazwaPelna) ||
    (typeof f.nazwaSkrocona === "string" && f.nazwaSkrocona) ||
    null;
  if (!name) return null;

  const statusRaw = String(f.status ?? f.statusNip ?? "").toLowerCase();
  let status: BusinessIdentity["status"] = "unknown";
  if (statusRaw.includes("zawiesz") || statusRaw === "suspended") status = "suspended";
  else if (statusRaw.includes("wykreśl") || statusRaw.includes("wykresl") || statusRaw === "deleted")
    status = "deleted";
  else if (statusRaw.includes("aktywn") || statusRaw === "active" || statusRaw === "") status = "active";

  const addr = (f.adres && typeof f.adres === "object" ? f.adres : f.adresSiedziby) as
    | Record<string, unknown>
    | undefined;

  const city = typeof addr?.miejscowosc === "string" ? addr.miejscowosc : "";
  const street =
    typeof addr?.ulica === "string"
      ? `${addr.ulica}${typeof addr?.nrDomu === "string" ? " " + addr.nrDomu : ""}`
      : "";
  const postCode = typeof addr?.kod === "string" ? addr.kod : "";
  const voivodeship = typeof addr?.wojewodztwo === "string" ? addr.wojewodztwo : "";

  return {
    nip,
    name,
    status,
    type: typeof f.typ === "string" ? f.typ : "jd",
    krsNumber: null,
    address: { city, street, postCode, voivodeship },
    vatActive: status === "active",
    trustLevel: 1,
    registrySource: "ceidg",
  };
}

function pickFirma(x: unknown): unknown {
  if (!x || typeof x !== "object") return null;
  return x;
}
