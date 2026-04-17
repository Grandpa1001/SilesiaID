export interface BusinessIdentity {
  nip: string;
  name: string;
  status: "active" | "suspended" | "deleted" | "unknown";
  type: string;
  krsNumber: string | null;
  address: { city: string; street: string; postCode: string; voivodeship: string };
  vatActive: boolean;
  trustLevel: 1 | 2 | 3;
}

export const MOCK_COMPANIES: Record<string, BusinessIdentity> = {
  "5262562610": {
    nip: "5262562610",
    name: "PKO Bank Polski S.A.",
    status: "active",
    type: "sa",
    krsNumber: "0000026438",
    address: {
      city: "Warszawa",
      street: "ul. Pulawska 15",
      postCode: "02-515",
      voivodeship: "mazowieckie",
    },
    vatActive: true,
    trustLevel: 2,
  },
  "6310000000": {
    nip: "6310000000",
    name: "Kowalski i Synowie sp. z o.o.",
    status: "active",
    type: "sp_zoo",
    krsNumber: "0000123456",
    address: {
      city: "Katowice",
      street: "ul. Slaska 10",
      postCode: "40-001",
      voivodeship: "slaskie",
    },
    vatActive: true,
    trustLevel: 2,
  },
  "9991234567": {
    nip: "9991234567",
    name: "Firma Zawieszona s.c.",
    status: "suspended",
    type: "sc",
    krsNumber: null,
    address: {
      city: "Gliwice",
      street: "ul. Testowa 1",
      postCode: "44-100",
      voivodeship: "slaskie",
    },
    vatActive: false,
    trustLevel: 1,
  },
  "1111111111": {
    nip: "1111111111",
    name: "Wykreslona Sp. z o.o.",
    status: "deleted",
    type: "sp_zoo",
    krsNumber: "0000999999",
    address: {
      city: "Sosnowiec",
      street: "ul. Stara 5",
      postCode: "41-200",
      voivodeship: "slaskie",
    },
    vatActive: false,
    trustLevel: 1,
  },
};
