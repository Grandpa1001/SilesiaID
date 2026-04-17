export async function checkVATStatus(nip: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${today}`;
    const res = await fetch(url);
    if (!res.ok) return true; // fallback
    const data = await res.json();
    return data.result?.subject?.statusVat === "Czynny";
  } catch {
    return true; // fallback: zakladamy aktywny
  }
}
