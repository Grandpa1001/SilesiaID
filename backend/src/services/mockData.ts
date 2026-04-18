import type { BusinessIdentity } from "../types/businessIdentity";

export type { BusinessIdentity } from "../types/businessIdentity";

/**
 * Jedyna lokalna „baza” firm dla trybu developerskiego.
 *
 * Gdy `MOCK_MODE=true`, `fetchBusinessData` zwraca wyłącznie wpisy stąd (bez KRS/CEIDG/VAT HTTP).
 * Przy `CEIDG_MOCK_MODE=true` (a `MOCK_MODE=false`) ścieżka CEIDG czyta tylko wpisy z `registrySource: "ceidg"`.
 *
 * Dopisz własne NIP-y i pola poniżej — szablony `900000000*` możesz nadpisać lub skasować.
 */
export const MOCK_COMPANIES: Record<string, BusinessIdentity> = {
  // --- JDG / CEIDG (bez numeru KRS) ---
  "7777777777": {
    nip: "7777777777",
    name: "Jan Kowalski — usługi budowlane (JDG)",
    status: "active",
    type: "jd",
    registrySource: "ceidg",
    krsNumber: null,
    address: {
      city: "Chorzów",
      street: "ul. Wolności 12",
      postCode: "41-500",
      voivodeship: "slaskie",
    },
    vatActive: true,
    trustLevel: 1,
  },
  "7666666666": {
    nip: "7666666666",
    name: "Zawieszona JDG Anna Nowak",
    status: "suspended",
    type: "jd",
    registrySource: "ceidg",
    krsNumber: null,
    address: {
      city: "Gliwice",
      street: "ul. Dworcowa 3",
      postCode: "44-100",
      voivodeship: "slaskie",
    },
    vatActive: false,
    trustLevel: 1,
  },

  // --- Spółki / KRS ---
  "5262562610": {
    nip: "5262562610",
    name: "Przykładowy Bank S.A.",
    status: "active",
    type: "sa",
    registrySource: "krs",
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
    registrySource: "krs",
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
  "1111111111": {
    nip: "1111111111",
    name: "Wykreslona Sp. z o.o.",
    status: "deleted",
    type: "sp_zoo",
    registrySource: "krs",
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

  // --- Przykłady CEIDG / s.c. ---
  "9991234567": {
    nip: "9991234567",
    name: "Firma Zawieszona s.c.",
    status: "suspended",
    type: "sc",
    registrySource: "ceidg",
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

  // --- Szablony do uzupełnienia własnymi danymi (zmień NIP-y na swoje, jeśli potrzebujesz) ---
  "6080051734": {
    nip: "6080051734",
    name: "DOTOD Kamil Bandzwołek",
    status: "active",
    type: "sc",
    registrySource: "ceidg",
    krsNumber: null,
    address: {
      city: "Poznań",
      street: "Karpia",
      postCode: "61-619",
      voivodeship: "wielkopolskie",
    },
    vatActive: true,
    trustLevel: 2,
  },
  "9000000002": {
    nip: "9000000002",
    name: "— uzupełnij: JDG / CEIDG",
    status: "active",
    type: "jd",
    registrySource: "ceidg",
    krsNumber: null,
    address: {
      city: "",
      street: "",
      postCode: "",
      voivodeship: "slaskie",
    },
    vatActive: true,
    trustLevel: 1,
  },
  "9000000003": {
    nip: "9000000003",
    name: "— uzupełnij: tylko ślad VAT (symulacja MF)",
    status: "active",
    type: "unknown",
    registrySource: "vat",
    krsNumber: null,
    address: {
      city: "",
      street: "",
      postCode: "",
      voivodeship: "slaskie",
    },
    vatActive: true,
    trustLevel: 1,
  },
  "9000000004": {
    nip: "9000000004",
    name: "— uzupełnij: kolejna firma (KRS)",
    status: "active",
    type: "sa",
    registrySource: "krs",
    krsNumber: "0000000000",
    address: {
      city: "",
      street: "",
      postCode: "",
      voivodeship: "",
    },
    vatActive: true,
    trustLevel: 2,
  },
  "9000000005": {
    nip: "9000000005",
    name: "— uzupełnij: kolejna JDG",
    status: "active",
    type: "jd",
    registrySource: "ceidg",
    krsNumber: null,
    address: {
      city: "",
      street: "",
      postCode: "",
      voivodeship: "",
    },
    vatActive: true,
    trustLevel: 1,
  },
};
