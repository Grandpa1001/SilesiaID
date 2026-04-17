import type { BusinessIdentity } from "../types/businessIdentity";
import { MOCK_COMPANIES } from "./mockData";

/**
 * Wpisy CEIDG z głównej mock bazy (`mockData.ts`).
 * Używane gdy `CEIDG_MOCK_MODE=true` — bez klucza API Biznes.gov.pl.
 */
export function getMockCeidgByNip(nip: string): BusinessIdentity | null {
  const row = MOCK_COMPANIES[nip];
  if (!row || row.registrySource !== "ceidg") return null;
  return row;
}
