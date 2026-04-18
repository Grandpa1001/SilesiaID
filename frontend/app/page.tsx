"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import Header from "./components/Header";
import OnboardingAnimation from "./components/OnboardingAnimation";
import { LogoMark } from "./components/Logo";

function QRMockSVG() {
  return (
    <svg width="72" height="72" viewBox="0 0 60 60" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#1a1a1a"/>
      <rect x="5" y="5" width="10" height="10" rx="1" fill="white"/>
      <rect x="42" y="2" width="16" height="16" rx="2" fill="#1a1a1a"/>
      <rect x="45" y="5" width="10" height="10" rx="1" fill="white"/>
      <rect x="2" y="42" width="16" height="16" rx="2" fill="#1a1a1a"/>
      <rect x="5" y="45" width="10" height="10" rx="1" fill="white"/>
      <rect x="22" y="2" width="4" height="4" fill="#1a1a1a"/>
      <rect x="28" y="4" width="4" height="4" fill="#1a1a1a"/>
      <rect x="34" y="2" width="4" height="4" fill="#1a1a1a"/>
      <rect x="22" y="8" width="4" height="4" fill="#1a1a1a"/>
      <rect x="34" y="8" width="4" height="4" fill="#1a1a1a"/>
      <rect x="2" y="22" width="4" height="4" fill="#1a1a1a"/>
      <rect x="4" y="28" width="4" height="4" fill="#1a1a1a"/>
      <rect x="2" y="34" width="4" height="4" fill="#1a1a1a"/>
      <rect x="8" y="22" width="4" height="4" fill="#1a1a1a"/>
      <rect x="22" y="22" width="16" height="16" rx="1" fill="#E6F1FB"/>
      <rect x="26" y="26" width="8" height="8" rx="1" fill="#185FA5"/>
      <rect x="42" y="22" width="4" height="4" fill="#1a1a1a"/>
      <rect x="48" y="24" width="4" height="4" fill="#1a1a1a"/>
      <rect x="54" y="22" width="4" height="4" fill="#1a1a1a"/>
      <rect x="44" y="30" width="4" height="4" fill="#1a1a1a"/>
      <rect x="50" y="32" width="4" height="4" fill="#1a1a1a"/>
      <rect x="42" y="36" width="4" height="4" fill="#1a1a1a"/>
      <rect x="22" y="42" width="4" height="4" fill="#1a1a1a"/>
      <rect x="28" y="44" width="4" height="4" fill="#1a1a1a"/>
      <rect x="34" y="42" width="4" height="4" fill="#1a1a1a"/>
      <rect x="22" y="48" width="4" height="4" fill="#1a1a1a"/>
      <rect x="30" y="50" width="4" height="4" fill="#1a1a1a"/>
      <rect x="36" y="48" width="4" height="4" fill="#1a1a1a"/>
    </svg>
  );
}

function MockCertCard() {
  return (
    <div className="w-[320px] rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: "#E1F5EE" }}>
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ backgroundColor: "#1D9E75" }}
        >
          ✓
        </span>
        <span className="text-[13px] font-medium" style={{ color: "#085041" }}>
          Firma zweryfikowana
        </span>
        <span
          className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{ backgroundColor: "#E6F1FB", color: "#0C447C" }}
        >
          KRS — pełny
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="mb-1 flex items-center gap-1.5">
          <LogoMark size={14} />
          <span className="text-[10px] font-medium uppercase tracking-widest text-gray-400">Certyfikat firmy</span>
        </div>
        <div className="mb-0.5 text-[16px] font-semibold text-gray-900">
          ACME Sp. z o.o.
        </div>
        <div className="mb-4 font-mono text-[11px] text-gray-400">NIP: 123-456-78-90</div>

        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-xl border border-gray-100 p-2">
            <QRMockSVG />
          </div>
          <div className="flex flex-col gap-2">
            {[
              { color: "#1D9E75", label: "Czynny podatnik VAT" },
              { color: "#185FA5", label: "CEIDG / KRS potwierdzone" },
              { color: "#534AB7", label: "Rejestr on-chain ETH" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-2">
        <span className="font-mono text-[10px] text-gray-400">CERT-2026-ETH-A3F2</span>
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "#1D9E75" }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#1D9E75" }} />
          Ethereum Sepolia
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.push("/dashboard");
  }, [ready, authenticated, router]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(160deg, #ffffff 40%, #E6F1FB 100%)" }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24">
          <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
            {/* Text */}
            <div className="flex-1 text-center md:text-left animate-slide-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-[12px] text-gray-500 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ETHSilesia 2026 · Katowice
              </div>

              <h1 className="mb-5 text-[34px] font-medium leading-tight tracking-tight text-gray-900 md:text-[44px]">
                Jeden cyfrowy dokument<br />
                <span className="text-primary">zamiast stosu papierów</span>
              </h1>

              <p className="mb-8 max-w-md text-[16px] leading-relaxed text-gray-500">
                Weryfikujesz firmę raz — w CEIDG, KRS i Białej liście VAT.
                Każda instytucja dostaje pewność w 3 sekundy przez kod QR.
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
                <button
                  type="button"
                  onClick={login}
                  disabled={!ready}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-7 py-3.5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-gray-800 disabled:opacity-50"
                >
                  Utwórz SilesiaID
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <a
                  href="#jak-dziala"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-7 py-3.5 text-[14px] text-gray-600 transition-colors hover:bg-surface"
                >
                  Jak to działa?
                </a>
              </div>

              <p className="mt-5 text-[12px] text-gray-400">
                Bez haseł. Bez specjalnych aplikacji. Logowanie przez e-mail lub SMS.
              </p>
            </div>

            {/* Mock cert card */}
            <div className="shrink-0 animate-fade-in">
              <MockCertCard />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-gray-100 bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "3 min", label: "czas rejestracji" },
              { value: "3", label: "rejestry publiczne RP" },
              { value: "1 QR", label: "do każdej weryfikacji" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-[22px] font-medium text-gray-900">{value}</div>
                <div className="mt-0.5 text-[12px] text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animation section */}
      <section id="jak-dziala" className="bg-surface py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-2 text-center text-[22px] font-medium text-gray-900">
            Jak SilesiaID skraca onboarding firmy
          </h2>
          <p className="mb-10 text-center text-[14px] text-gray-500">
            Przedsiębiorca traci średnio 12 dni roboczych rocznie na formalną weryfikację.
          </p>
          <OnboardingAnimation />
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center text-[22px] font-medium text-gray-900">
          Trzy kroki do certyfikatu
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              num: "1",
              title: "Wpisz NIP",
              desc: "System automatycznie pobiera dane z CEIDG, KRS i Białej listy VAT MF.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              ),
            },
            {
              num: "2",
              title: "Potwierdź dane",
              desc: "Sprawdzasz czy dane są poprawne i potwierdzasz jednym kliknięciem.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ),
            },
            {
              num: "3",
              title: "Dostajesz certyfikat",
              desc: "Certyfikat z kodem QR — gotowy do pokazania w każdej instytucji.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5ZM13.5 14.625c0-.621.504-1.125 1.125-1.125h2.25v2.25h-2.25v-2.25ZM13.5 19.125v2.25h2.25v-2.25H13.5ZM18 14.625h2.25v2.25H18v-2.25ZM18 19.125v2.25h2.25v-2.25H18Z" />
                </svg>
              ),
            },
          ].map((step) => (
            <div
              key={step.num}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
                {step.icon}
              </div>
              <div className="mb-1 text-[11px] font-medium text-gray-400">Krok {step.num}</div>
              <h3 className="mb-2 text-[15px] font-medium text-gray-900">{step.title}</h3>
              <p className="text-[13px] leading-relaxed text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dla instytucji + API (A.6) */}
      <section className="border-t border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-center text-[22px] font-medium text-gray-900">
            Dla systemów weryfikujących
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-[14px] text-gray-500">
            Banki, KNF, urzędy i partnerzy B2B mogą sprawdzać certyfikat po NIP lub ID z QR — bez
            przechodzenia przez onboarding przedsiębiorcy.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface/40 p-8 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-light text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 0 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[17px] font-medium text-gray-900">Panel weryfikatora</h3>
              <p className="mb-1 flex-1 text-[14px] leading-relaxed text-gray-600">
                Zaloguj się jako instytucja.
              </p>
              <p className="mb-1 text-[14px] leading-relaxed text-gray-600">
                Wpisz NIP lub zeskanuj QR.
              </p>
              <p className="mb-6 text-[14px] leading-relaxed text-gray-600">Dane certyfikatu w kilka sekund.</p>
              <Link
                href="/institution/login"
                className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary-dark hover:text-primary"
              >
                Zaloguj jako instytucja
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-surface/40 p-8 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-light text-purple">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-[17px] font-medium text-gray-900">Integracja API</h3>
              <p className="mb-3 flex-1 text-[14px] leading-relaxed text-gray-600">
                Zintegruj w kilkanaście minut. Jedno zapytanie — odpowiedź z danymi certyfikatu i firmy.
              </p>
              <code className="mb-2 block rounded-xl bg-white px-3 py-2 font-mono text-[11px] text-gray-700 ring-1 ring-gray-100">
                {`GET /api/v1/institution/lookup?q={nip_lub_certId}`}
              </code>
              <p className="mb-6 text-[13px] text-gray-500">Bearer: JWT po logowaniu lub klucz API (np. sid_…).</p>
              <Link
                href="/institution/login"
                className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-primary-dark hover:text-primary"
              >
                Zacznij z API
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Skąd pochodzi pewność? (A.6) */}
      <section className="border-t border-gray-100 bg-surface/60 py-14">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-2 text-center text-[20px] font-medium text-gray-900">Skąd pochodzi pewność?</h2>
          <p className="mb-10 text-center text-[14px] text-gray-500">
            Certyfikat opiera się na jawnych źródłach państwowych i zapisie on-chain.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "CEIDG",
                desc: "Jednoosobowe działalności i wpisy bez KRS.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008H18v-.008Zm0 3h.008v.008H18v-.008Zm0 3h.008v.008H18v-.008Z" />
                ),
                wrap: "bg-primary-light text-primary",
              },
              {
                title: "KRS",
                desc: "Spółki i pełne dane rejestrowe.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 18H15a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                ),
                wrap: "bg-primary-light text-primary-dark",
              },
              {
                title: "VAT",
                desc: "Biała lista MF — status czynności.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                ),
                wrap: "bg-teal-light text-teal-dark",
              },
              {
                title: "Blockchain",
                desc: "Ethereum Sepolia — niezmienny zapis certyfikatu.",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                ),
                wrap: "bg-purple-light text-purple",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm sm:text-left"
              >
                <div
                  className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl sm:mx-0 ${item.wrap}`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    {item.icon}
                  </svg>
                </div>
                <h3 className="mb-1 text-[15px] font-medium text-gray-900">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-[11px] text-gray-400">
            Model zgodny z kierunkiem EBSI / tożsamością rozproszoną w UE.
          </p>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="py-20 text-center" style={{ background: "linear-gradient(135deg, #185FA5 0%, #0C447C 100%)" }}>
        <div className="mx-auto max-w-xl px-4">
          <h2 className="mb-3 text-[28px] font-medium text-white">
            Gotowy na cyfrowy paszport firmy?
          </h2>
          <p className="mb-8 text-[15px] text-blue-200">
            Raz zweryfikowany — wszędzie rozpoznany.
          </p>
          <button
            type="button"
            onClick={login}
            disabled={!ready}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[14px] font-medium text-primary shadow-lg transition-colors hover:bg-blue-50 disabled:opacity-50"
          >
            Zacznij bezpłatnie
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between">
          <span className="flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-[12px] font-semibold tracking-tight">
              <span className="text-gray-700">Silesia</span>
              <span className="text-primary">ID</span>
            </span>
          </span>
          <span className="text-[11px] text-gray-400">ETHSilesia 2026 · Katowice</span>
        </div>
      </footer>
    </div>
  );
}
