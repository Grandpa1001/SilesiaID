import type { BusinessIdentity } from "../types/businessIdentity";
import { MOCK_COMPANIES } from "./mockData";
import { fetchCeidgBusinessByNip } from "./ceidgApi";

export async function fetchBusinessData(nip: string): Promise<BusinessIdentity | null> {
  if (process.env.MOCK_MODE === "true") {
    return MOCK_COMPANIES[nip] ?? null;
  }

  // 1) KRS — zewnętrzne API (np. rejestry.net): w praktyce zwykle wymaga klucza u dostawcy.
  try {
    const krsRes = await fetch(`https://api.rejestry.net/api/krs/entities?nip=${nip}`);
    if (krsRes.ok) {
      const data = await krsRes.json();
      if (data.entity) {
        return {
          nip,
          name: data.entity.name,
          status: data.entity.status === "active" ? "active" : "suspended",
          type: data.entity.type ?? "sp_zoo",
          krsNumber: data.entity.krsNumber ?? null,
          address: data.entity.address ?? { city: "", street: "", postCode: "", voivodeship: "" },
          vatActive: true,
          trustLevel: 2,
          registrySource: "krs",
        };
      }
    }
  } catch {}

  // 2) CEIDG — mocki (CEIDG_MOCK_MODE) albo API Biznes.gov.pl (CEIDG_API_KEY); JDG bez KRS.
  const fromCeidg = await fetchCeidgBusinessByNip(nip);
  if (fromCeidg) return fromCeidg;

  // 3) Biała lista VAT (MF) — publiczne API po NIP; bez osobnego „wniosku” jak w CEIDG API.
  try {
    const today = new Date().toISOString().split("T")[0];
    const vatRes = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`);
    if (vatRes.ok) {
      const data = await vatRes.json();
      const subject = data.result?.subject;
      if (subject) {
        return {
          nip,
          name: subject.name ?? `Firma ${nip}`,
          status: subject.statusVat === "Czynny" ? "active" : "suspended",
          type: "unknown",
          krsNumber: null,
          address: { city: subject.residenceAddress ?? "", street: "", postCode: "", voivodeship: "" },
          vatActive: subject.statusVat === "Czynny",
          trustLevel: 1,
          registrySource: "vat",
        };
      }
    }
  } catch {}

  return null;
}
