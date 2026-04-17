export interface BusinessIdentity {
  nip: string;
  name: string;
  status: "active" | "suspended" | "deleted" | "unknown";
  type: string;
  krsNumber: string | null;
  address: { city: string; street: string; postCode: string; voivodeship: string };
  vatActive: boolean;
  trustLevel: 1 | 2 | 3;
  /** Skąd pochodzą dane firmy (KRS nie obejmuje JDG — wtedy CEIDG lub fallback VAT). */
  registrySource?: "krs" | "ceidg" | "vat";
}
