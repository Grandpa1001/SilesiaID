"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import dokumentyData from "../../public/dokumenty.json";
import pracaData from "../../public/praca.json";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });

/** Pauza przed kolejną iteracją (gdy autoLoop). */
const LOOP_GAP_MS = 2800;

const OLD_STEPS = [
  "Zapytanie o NIP / KRS",
  "Wysyłka dokumentów e-mailem",
  "Oczekiwanie na weryfikację",
  "Ponowna prośba o dokumenty",
  "Podpis ręczny + skan",
  "Archiwizacja w systemie",
];

const NEW_STEPS = [
  "Wpisujesz NIP",
  "System sprawdza CEIDG + KRS + VAT",
  "Certyfikat gotowy — kod QR",
];

type OnboardingAnimationProps = {
  /** Start od razu i powtarzaj cykl po zakończeniu (np. landing). */
  autoLoop?: boolean;
};

export default function OnboardingAnimation({ autoLoop = false }: OnboardingAnimationProps) {
  const [oldVisible, setOldVisible] = useState(0);
  const [newVisible, setNewVisible] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  const start = useCallback(() => {
    setOldVisible(0);
    setNewVisible(0);
    setDone(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    if (!autoLoop) return;
    start();
  }, [autoLoop, start]);

  useEffect(() => {
    if (!running) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let k = 1; k <= OLD_STEPS.length; k++) {
      timers.push(setTimeout(() => setOldVisible(k), k * 650));
    }
    for (let k = 1; k <= NEW_STEPS.length; k++) {
      timers.push(setTimeout(() => setNewVisible(k), 200 + k * 800));
    }
    timers.push(
      setTimeout(() => {
        setDone(true);
        setRunning(false);
      }, 200 + NEW_STEPS.length * 800 + 600)
    );

    return () => timers.forEach(clearTimeout);
  }, [running]);

  useEffect(() => {
    if (!autoLoop || !done || running) return;
    const t = setTimeout(() => start(), LOOP_GAP_MS);
    return () => clearTimeout(t);
  }, [done, running, autoLoop, start]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tradycyjny sposób */}
        <div className="flex flex-col rounded-2xl border border-amber-light bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-light text-[11px] font-medium text-amber">
              !
            </span>
            <span className="text-[13px] font-medium text-gray-700">Tradycyjny sposób</span>
            <span className="ml-auto text-[11px] text-gray-400">~3–5 dni</span>
          </div>

          <div className="flex justify-center">
            <Lottie
              animationData={dokumentyData}
              loop
              className="w-full max-w-[220px]"
            />
          </div>

          <ul className="mt-4 space-y-2">
            {OLD_STEPS.map((step, idx) => (
              <li
                key={step}
                className={`flex items-center gap-2 text-[13px] transition-all duration-300 ${
                  oldVisible > idx ? "opacity-100 text-gray-700" : "opacity-0"
                }`}
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                {step}
              </li>
            ))}
          </ul>

          {oldVisible >= OLD_STEPS.length && (
            <div className="mt-4 rounded-lg bg-amber-light px-3 py-2 text-[12px] font-medium text-amber">
              Łącznie: 3–5 dni roboczych
            </div>
          )}
        </div>

        {/* SilesiaID */}
        <div className="flex flex-col rounded-2xl border border-teal-light bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-light text-[11px] font-medium text-teal">
              ✓
            </span>
            <span className="text-[13px] font-medium text-gray-700">SilesiaID</span>
            <span className="ml-auto text-[11px] text-gray-400">~3 minuty</span>
          </div>

          <div className="flex justify-center">
            <Lottie
              animationData={pracaData}
              loop
              className="w-full max-w-[220px]"
            />
          </div>

          <ul className="mt-4 space-y-2">
            {NEW_STEPS.map((step, idx) => (
              <li
                key={step}
                className={`flex items-center gap-2 text-[13px] transition-all duration-300 ${
                  newVisible > idx ? "opacity-100 text-gray-700" : "opacity-0"
                }`}
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                {step}
              </li>
            ))}
          </ul>

          {done && (
            <div className="mt-4 rounded-lg bg-teal-light px-3 py-2 text-[12px] font-medium text-teal-dark">
              Gotowe — certyfikat z kodem QR ✓
            </div>
          )}
        </div>
      </div>

      {!autoLoop && (
        <div className="text-center">
          <button
            type="button"
            onClick={start}
            disabled={running}
            className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-[13px] text-gray-600 transition-colors hover:bg-surface disabled:opacity-40"
          >
            {running ? "Animacja trwa..." : "Uruchom animację ▶"}
          </button>
        </div>
      )}
    </div>
  );
}
