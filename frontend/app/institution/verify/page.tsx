"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  INSTITUTION_TOKEN_KEY,
  decodeInstitutionToken,
  generateApiKey,
  institutionLookup,
  type InstitutionLookupResult,
} from "@/lib/institutionApi";
import InstitutionHeader from "@/app/components/InstitutionHeader";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const STATUS_UI: Record<
  string,
  { label: string; barClass: string; cardClass: string; textClass: string; icon: string }
> = {
  active: {
    label: "Firma aktywna",
    barClass: "bg-teal",
    cardClass: "bg-teal-light",
    textClass: "text-teal-dark",
    icon: "✓",
  },
  suspended: {
    label: "Firma zawieszona",
    barClass: "bg-amber",
    cardClass: "bg-amber-light",
    textClass: "text-amber",
    icon: "!",
  },
  deleted: {
    label: "Firma wykreślona",
    barClass: "bg-danger",
    cardClass: "bg-danger-light",
    textClass: "text-danger",
    icon: "✕",
  },
  unknown: {
    label: "Status nieznany",
    barClass: "bg-muted",
    cardClass: "bg-surface",
    textClass: "text-muted",
    icon: "?",
  },
};

const TRUST_UI: Record<number, { label: string; className: string }> = {
  1: { label: "CEIDG — podstawowy", className: "bg-amber-light text-amber" },
  2: { label: "KRS — pełny", className: "bg-primary-light text-primary-dark" },
  3: { label: "Bank — zweryfikowany", className: "bg-purple-light text-purple" },
};

function formatNip(nip: string): string {
  const d = nip.replace(/\D/g, "");
  if (d.length !== 10) return nip;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

function formatIssuedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type CopiedKey = string | null;

function CodeBlock({ code, copyKey, onCopy, copied }: {
  code: string;
  copyKey: string;
  onCopy: (key: string, text: string) => void;
  copied: CopiedKey;
}) {
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => onCopy(copyKey, code)}
        className="absolute right-3 top-3 rounded-lg bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
      >
        {copied === copyKey ? "Skopiowano" : "Kopiuj"}
      </button>
    </div>
  );
}

type EndpointCardProps = {
  method: "GET" | "POST";
  path: string;
  description: string;
  auth?: string;
  children: React.ReactNode;
};

function EndpointCard({ method, path, description, auth, children }: EndpointCardProps) {
  const methodClass =
    method === "GET"
      ? "bg-teal text-white"
      : "bg-primary-dark text-white";

  return (
    <div className="rounded-2xl border border-gray-100 bg-white">
      <div className="flex flex-wrap items-start gap-3 border-b border-gray-100 p-4">
        <span className={`shrink-0 rounded-lg px-2.5 py-1 font-mono text-xs font-bold ${methodClass}`}>
          {method}
        </span>
        <div className="min-w-0 flex-1">
          <code className="break-all font-mono text-sm text-gray-800">{path}</code>
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        </div>
        {auth ? (
          <span className="shrink-0 rounded-full bg-amber-light px-2.5 py-1 text-xs font-medium text-amber">
            {auth}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            Publiczny
          </span>
        )}
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

function TechDocsTab({ apiKey }: { apiKey: string | null }) {
  const [copied, setCopied] = useState<CopiedKey>(null);

  function handleCopy(key: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  }

  const baseUrl = BACKEND;

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-base font-semibold text-gray-900">Dokumentacja API</h3>
        <p className="mb-4 text-sm text-gray-500">
          Integruj weryfikację certyfikatów SilesiaID bezpośrednio w swoim systemie — bez UI, przez REST API.
          Każde zapytanie jest logowane w historii przedsiębiorcy z nazwą Twojej instytucji.
        </p>

        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Base URL</p>
          <code className="mt-1 block font-mono text-sm text-gray-800">{baseUrl}</code>
        </div>
      </section>

      {/* Auth */}
      <section>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Uwierzytelnienie</h4>
        <div className="space-y-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm">
            <p className="mb-2 font-medium text-gray-800">Opcja 1 — JWT Token (sesja)</p>
            <p className="mb-3 text-xs text-gray-500">
              Uzyskaj token logując się. Token wygasa po 7 dniach.
            </p>
            <CodeBlock
              code={`Authorization: Bearer eyJhbGci...`}
              copyKey="auth-jwt"
              onCopy={handleCopy}
              copied={copied}
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm">
            <p className="mb-2 font-medium text-gray-800">Opcja 2 — API Key (serwer-serwer)</p>
            <p className="mb-3 text-xs text-gray-500">
              Klucz w formacie <code className="rounded bg-gray-100 px-1 font-mono text-xs">sid_&lt;32 hex&gt;</code>.
              Wygeneruj go w panelu → zakładka Weryfikacja → sekcja Klucz API.
              {apiKey ? (
                <span className="ml-1 font-medium text-teal-dark">Twój aktualny klucz jest już wygenerowany.</span>
              ) : null}
            </p>
            <CodeBlock
              code={`Authorization: Bearer ${apiKey ?? "sid_<twój_klucz>"}`}
              copyKey="auth-apikey"
              onCopy={handleCopy}
              copied={copied}
            />
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Endpointy</h4>
        <div className="space-y-4">

          <EndpointCard
            method="POST"
            path="/api/v1/institution/login"
            description="Logowanie instytucji — zwraca JWT token"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Request body</p>
              <CodeBlock
                code={`{\n  "email": "bank@firma.pl",\n  "password": "twoje_haslo"\n}`}
                copyKey="login-body"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Odpowiedź 200</p>
              <CodeBlock
                code={`{ "token": "eyJhbGci..." }`}
                copyKey="login-resp"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">curl</p>
              <CodeBlock
                code={`curl -X POST ${baseUrl}/api/v1/institution/login \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"bank@firma.pl","password":"haslo"}'`}
                copyKey="login-curl"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
          </EndpointCard>

          <EndpointCard
            method="POST"
            path="/api/v1/institution/register"
            description="Rejestracja nowej instytucji — zwraca JWT token"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Request body</p>
              <CodeBlock
                code={`{\n  "email": "bank@firma.pl",\n  "password": "min_6_znakow",\n  "name": "Nazwa Banku S.A."\n}`}
                copyKey="reg-body"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">curl</p>
              <CodeBlock
                code={`curl -X POST ${baseUrl}/api/v1/institution/register \\\n  -H "Content-Type: application/json" \\\n  -d '{"email":"bank@firma.pl","password":"haslo123","name":"Nazwa Banku"}'`}
                copyKey="reg-curl"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
          </EndpointCard>

          <EndpointCard
            method="POST"
            path="/api/v1/institution/api-key"
            description="Generuj klucz API — wymaga JWT. Klucz jednorazowy."
            auth="JWT only"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Odpowiedź 200</p>
              <CodeBlock
                code={`{ "apiKey": "sid_abc123..." }`}
                copyKey="apikey-resp"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">curl</p>
              <CodeBlock
                code={`curl -X POST ${baseUrl}/api/v1/institution/api-key \\\n  -H "Authorization: Bearer eyJhbGci..."`}
                copyKey="apikey-curl"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
          </EndpointCard>

          <EndpointCard
            method="GET"
            path="/api/v1/institution/lookup?q={nip|certId}"
            description="Weryfikacja certyfikatu po NIP (10 cyfr) lub ID certyfikatu z QR"
            auth="JWT lub API Key"
          >
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Parametry query</p>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Param</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Typ</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Opis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-3 py-2 font-mono text-gray-800">q</td>
                      <td className="px-3 py-2 text-gray-600">string</td>
                      <td className="px-3 py-2 text-gray-600">
                        NIP (10 cyfr) lub certId (alfanumeryczny, z kodu QR)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Odpowiedź 200</p>
              <CodeBlock
                code={`{
  "certId": "ABC123",
  "nip": "5262562610",
  "company": {
    "name": "Przykładowy Bank S.A.",
    "status": "active",       // active | suspended | deleted | unknown
    "trustLevel": 2,          // 1=CEIDG, 2=KRS, 3=Bank
    "vatActive": true
  },
  "issuedAt": "2026-04-17T19:26:33.000Z",
  "revoked": false
}`}
                copyKey="lookup-resp"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">curl — wyszukiwanie po NIP</p>
              <CodeBlock
                code={`curl "${baseUrl}/api/v1/institution/lookup?q=5262562610" \\\n  -H "Authorization: Bearer ${apiKey ?? "sid_<twój_klucz>"}"`}
                copyKey="lookup-nip-curl"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">curl — wyszukiwanie po certId</p>
              <CodeBlock
                code={`curl "${baseUrl}/api/v1/institution/lookup?q=ABC123" \\\n  -H "Authorization: Bearer ${apiKey ?? "sid_<twój_klucz>"}"`}
                copyKey="lookup-cert-curl"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Node.js / fetch</p>
              <CodeBlock
                code={`const res = await fetch(
  \`${baseUrl}/api/v1/institution/lookup?q=\${nip}\`,
  { headers: { Authorization: \`Bearer \${apiKey}\` } }
);
const cert = await res.json();
if (!res.ok) throw new Error(cert.error);
console.log(cert.company.name, cert.company.status);`}
                copyKey="lookup-node"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">Python</p>
              <CodeBlock
                code={`import requests

resp = requests.get(
    "${baseUrl}/api/v1/institution/lookup",
    params={"q": "5262562610"},
    headers={"Authorization": "Bearer ${apiKey ?? "sid_<twój_klucz>"}"}
)
resp.raise_for_status()
cert = resp.json()
print(cert["company"]["name"], cert["company"]["status"])`}
                copyKey="lookup-python"
                onCopy={handleCopy}
                copied={copied}
              />
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-700">Kody błędów</p>
              <div className="mt-2 space-y-1 font-mono text-xs text-gray-600">
                <p><span className="text-danger font-bold">400</span> — brak parametru <code>q</code></p>
                <p><span className="text-danger font-bold">401</span> — brak/nieważny token lub klucz API</p>
                <p><span className="text-danger font-bold">404</span> — certyfikat nie znaleziony</p>
                <p><span className="text-danger font-bold">500</span> — błąd serwera</p>
              </div>
            </div>
          </EndpointCard>
        </div>
      </section>

      {/* EBSI note */}
      <section className="rounded-xl border border-primary/20 bg-primary-light/30 p-4">
        <p className="text-xs font-medium text-primary-dark">
          Zgodność ze standardem EBSI (European Blockchain Services Infrastructure)
        </p>
        <p className="mt-1 text-xs text-gray-600">
          Certyfikaty SilesiaID są zakotwiczone na Ethereum Sepolia. Każde zapytanie jest logowane jako
          zdarzenie weryfikacji u przedsiębiorcy — pełna ścieżka audytu bez centralnego rejestru zaufania.
        </p>
      </section>
    </div>
  );
}

type Tab = "verify" | "docs";

export default function InstitutionVerifyPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState("Instytucja");
  const [activeTab, setActiveTab] = useState<Tab>("verify");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [result, setResult] = useState<InstitutionLookupResult | null>(null);

  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = localStorage.getItem(INSTITUTION_TOKEN_KEY);
    if (!t) {
      router.replace("/institution/login");
      return;
    }
    setToken(t);
    const payload = decodeInstitutionToken(t);
    if (payload?.name) setInstitutionName(payload.name);
    setReady(true);
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(INSTITUTION_TOKEN_KEY);
    router.push("/institution/login");
  }, [router]);

  async function handleSearch(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!token) return;
    const q = query.trim();
    if (!q) return;
    setLookupError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await institutionLookup(token, q);
      setResult(data);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : "Błąd wyszukiwania");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateApiKey() {
    if (!token) return;
    setApiKeyError(null);
    setApiKey(null);
    setCopied(false);
    setApiKeyLoading(true);
    try {
      const key = await generateApiKey(token);
      setApiKey(key);
    } catch (err) {
      setApiKeyError(err instanceof Error ? err.message : "Nie udało się wygenerować klucza");
    } finally {
      setApiKeyLoading(false);
    }
  }

  async function handleCopyKey() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setApiKeyError("Nie udało się skopiować — zaznacz tekst ręcznie.");
    }
  }

  if (!ready || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface text-sm text-gray-500">
        Ładowanie…
      </main>
    );
  }

  const statusKey = result?.company.status ?? "unknown";
  const statusCfg = STATUS_UI[statusKey] ?? STATUS_UI.unknown;
  const trustCfg = result ? TRUST_UI[result.company.trustLevel] ?? TRUST_UI[1] : null;

  return (
    <div className="min-h-screen bg-surface">
      <InstitutionHeader
        institutionName={institutionName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
      />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {activeTab === "verify" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <section>
              <h2 className="mb-1 text-base font-semibold text-gray-900">Weryfikacja certyfikatu</h2>
              <p className="mb-4 text-sm text-gray-500">
                Wpisz <strong>NIP</strong> (10 cyfr) lub <strong>ID certyfikatu</strong> z kodu QR. Zapytanie zostanie
                zapisane w historii weryfikacji u przedsiębiorcy.
              </p>

              <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="inst-lookup-q" className="mb-1 block text-xs font-medium text-gray-600">
                    NIP lub ID certyfikatu
                  </label>
                  <input
                    id="inst-lookup-q"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Wpisz NIP lub ID certyfikatu (z QR)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-primary/30 focus:border-primary focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="shrink-0 rounded-xl bg-primary-dark px-5 py-2.5 text-sm font-medium text-white hover:bg-primary disabled:opacity-50"
                >
                  {loading ? "Szukam…" : "Szukaj"}
                </button>
              </form>

              {lookupError ? (
                <div
                  className="mb-6 rounded-xl border border-red-100 bg-danger-light px-4 py-3 text-sm text-danger"
                  role="alert"
                >
                  {lookupError}
                </div>
              ) : null}

              {result ? (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {result.revoked ? (
                    <div className="border-b border-red-100 bg-danger-light px-4 py-3 text-center text-sm font-medium text-danger">
                      Certyfikat został wycofany przez właściciela
                    </div>
                  ) : null}

                  <div className={`flex items-center gap-2 px-4 py-3 ${statusCfg.cardClass}`}>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${statusCfg.barClass}`}
                    >
                      {statusCfg.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${statusCfg.textClass}`}>{statusCfg.label}</p>
                      <p className="text-xs text-gray-500">Status w rejestrach w momencie zapytania</p>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Firma</p>
                      <p className="text-lg font-semibold text-gray-900">{result.company.name}</p>
                      <p className="mt-1 font-mono text-sm text-gray-500">NIP: {formatNip(result.nip)}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {trustCfg ? (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${trustCfg.className}`}
                        >
                          Trust {result.company.trustLevel} — {trustCfg.label}
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          result.company.vatActive
                            ? "bg-teal-light text-teal-dark"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        VAT: {result.company.vatActive ? "czynny" : "nieczynny / brak"}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      Wystawiono: <span className="font-medium text-gray-800">{formatIssuedAt(result.issuedAt)}</span>
                    </p>

                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                      <Link
                        href={`/verify/${encodeURIComponent(result.certId)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-xl bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:bg-primary"
                      >
                        Pełna strona weryfikacji
                      </Link>
                      <span className="self-center font-mono text-xs text-gray-400">ID: {result.certId}</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="mb-1 text-base font-semibold text-gray-900">Klucz API</h2>
                <p className="mb-4 text-sm text-gray-500">
                  Użyj nagłówka <code className="rounded bg-gray-100 px-1 font-mono text-xs">Authorization: Bearer</code>{" "}
                  z kluczem zamiast JWT — np. dla integracji serwer-serwer.
                </p>

                <button
                  type="button"
                  onClick={handleGenerateApiKey}
                  disabled={apiKeyLoading}
                  className="mb-4 w-full rounded-xl border border-primary/40 bg-primary-light px-4 py-2.5 text-sm font-medium text-primary-dark hover:bg-primary-light/80 disabled:opacity-50"
                >
                  {apiKeyLoading ? "Generuję…" : "Generuj klucz API"}
                </button>

                {apiKeyError ? (
                  <p className="mb-3 text-sm text-danger" role="alert">
                    {apiKeyError}
                  </p>
                ) : null}

                {apiKey ? (
                  <div className="rounded-xl border border-amber bg-amber-light/50 p-3">
                    <p className="mb-2 text-xs font-medium text-amber">
                      Skopiuj teraz — pełny klucz pokazujemy tylko raz. Poprzedni klucz (jeśli był) przestaje działać.
                    </p>
                    <div className="mb-2 break-all rounded-lg bg-white p-2 font-mono text-xs text-gray-800 ring-1 ring-gray-100">
                      {apiKey}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="w-full rounded-lg bg-primary-dark py-2 text-sm font-medium text-white hover:bg-primary"
                    >
                      {copied ? "Skopiowano" : "Kopiuj do schowka"}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    Po wygenerowaniu zapisz klucz w menedżerze sekretów. Nie przechowujemy go w postaci jawnej.
                  </p>
                )}

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-400">
                    Potrzebujesz przykładów integracji?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("docs")}
                      className="text-primary-dark underline-offset-2 hover:underline"
                    >
                      Dokumentacja techniczna →
                    </button>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === "docs" && <TechDocsTab apiKey={apiKey} />}
      </main>
    </div>
  );
}
