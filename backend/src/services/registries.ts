import { BusinessIdentity, MOCK_COMPANIES } from "./mockData";

export async function fetchBusinessData(nip: string): Promise<BusinessIdentity | null> {
  if (process.env.MOCK_MODE === "true") {
    return MOCK_COMPANIES[nip] ?? null;
  }

  // Prawdziwa integracja KRS (api.rejestry.net)
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
        };
      }
    }
  } catch {}

  // Fallback: Biala Lista VAT (kazda firma z NIP-em)
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
        };
      }
    }
  } catch {}

  return null;
}
