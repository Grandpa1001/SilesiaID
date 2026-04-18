const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const INSTITUTION_TOKEN_KEY = "institution_token";

export type InstitutionJwtPayload = {
  id: number;
  name: string;
  email: string;
  role: string;
  exp?: number;
};

/** Odczyt nazwy z JWT (tylko UI; weryfikacja i tak jest po stronie API). */
export function decodeInstitutionToken(token: string): InstitutionJwtPayload | null {
  if (!token || token.startsWith("sid_")) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const json = atob(base64 + pad);
    const payload = JSON.parse(json) as InstitutionJwtPayload;
    if (payload.role !== "institution" || typeof payload.id !== "number") return null;
    return payload;
  } catch {
    return null;
  }
}

function httpError(res: Response, body: { error?: string }): Error & { status: number } {
  const e = new Error(body.error || `HTTP ${res.status}`) as Error & { status: number };
  e.status = res.status;
  return e;
}

export async function institutionLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND}/api/v1/institution/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok) throw httpError(res, data);
  if (!data.token) throw new Error("Brak tokenu w odpowiedzi");
  return data.token;
}

export async function institutionRegister(email: string, password: string, name: string): Promise<string> {
  const res = await fetch(`${BACKEND}/api/v1/institution/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
  if (!res.ok) throw httpError(res, data);
  if (!data.token) throw new Error("Brak tokenu w odpowiedzi");
  return data.token;
}

/**
 * Najpierw logowanie; przy 401 — rejestracja (pierwsze użycie) i token z rejestracji.
 * Przy 409 po rejestracji: konto już było — złe hasło.
 */
export async function institutionLoginOrSignup(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  try {
    return await institutionLogin(email, password);
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status !== 401) throw e;
    try {
      return await institutionRegister(email, password, name);
    } catch (regErr) {
      const re = regErr as Error & { status?: number };
      if (re.status === 409) {
        throw new Error("Konto z tym adresem e-mail już istnieje. Sprawdź hasło.");
      }
      throw regErr;
    }
  }
}

export type InstitutionLookupResult = {
  certId: string;
  nip: string;
  company: {
    name: string;
    status: string;
    trustLevel: number;
    vatActive: boolean;
  };
  issuedAt: string;
  revoked: boolean;
};

export async function institutionLookup(token: string, q: string): Promise<InstitutionLookupResult> {
  const res = await fetch(
    `${BACKEND}/api/v1/institution/lookup?q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const data = (await res.json().catch(() => ({}))) as InstitutionLookupResult & { error?: string };
  if (!res.ok) throw httpError(res, data);
  return data as InstitutionLookupResult;
}

export async function generateApiKey(token: string): Promise<string> {
  const res = await fetch(`${BACKEND}/api/v1/institution/api-key`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as { apiKey?: string; error?: string };
  if (!res.ok) throw httpError(res, data);
  if (!data.apiKey) throw new Error("Brak klucza w odpowiedzi");
  return data.apiKey;
}
