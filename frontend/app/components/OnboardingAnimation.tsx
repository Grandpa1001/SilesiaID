"use client";

import { useState, useEffect } from "react";

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

export default function OnboardingAnimation() {
  const [oldVisible, setOldVisible] = useState(0);
  const [newVisible, setNewVisible] = useState(0);
  const [done, setDone] = useState(false);
  const [running, setRunning] = useState(false);

  function start() {
    setOldVisible(0);
    setNewVisible(0);
    setDone(false);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;

    let i = 0;
    let j = 0;
    const intervals: ReturnType<typeof setTimeout>[] = [];

    // Old steps appear every 650ms
    for (let k = 1; k <= OLD_STEPS.length; k++) {
      intervals.push(
        setTimeout(() => setOldVisible(k), k * 650)
      );
    }

    // New steps appear every 800ms but offset by 200ms
    for (let k = 1; k <= NEW_STEPS.length; k++) {
      intervals.push(
        setTimeout(() => setNewVisible(k), 200 + k * 800)
      );
    }

    // Show done marker after new steps finish
    intervals.push(
      setTimeout(() => {
        setDone(true);
        setRunning(false);
      }, 200 + NEW_STEPS.length * 800 + 600)
    );

    return () => intervals.forEach(clearTimeout);
  }, [running]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Old way */}
        <div className="rounded-xl border border-[#FAEEDA] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FAEEDA] text-[11px] font-medium text-[#854F0B]">!</span>
            <span className="text-[13px] font-medium text-gray-700">Tradycyjny sposób</span>
            <span className="ml-auto text-[11px] text-gray-400">~3–5 dni</span>
          </div>
          <ul className="space-y-2">
            {OLD_STEPS.map((step, idx) => (
              <li
                key={step}
                className={`flex items-center gap-2 text-[13px] transition-all duration-300 ${
                  oldVisible > idx ? "opacity-100 text-gray-700" : "opacity-0"
                }`}
              >
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#854F0B] shrink-0" />
                {step}
              </li>
            ))}
          </ul>
          {oldVisible >= OLD_STEPS.length && (
            <div className="mt-4 rounded-lg bg-[#FAEEDA] px-3 py-2 text-[12px] font-medium text-[#854F0B]">
              Łącznie: 3–5 dni roboczych
            </div>
          )}
        </div>

        {/* New way */}
        <div className="rounded-xl border border-[#E1F5EE] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#E1F5EE] text-[11px] font-medium text-[#1D9E75]">✓</span>
            <span className="text-[13px] font-medium text-gray-700">SilesiaID</span>
            <span className="ml-auto text-[11px] text-gray-400">~3 minuty</span>
          </div>
          <ul className="space-y-2">
            {NEW_STEPS.map((step, idx) => (
              <li
                key={step}
                className={`flex items-center gap-2 text-[13px] transition-all duration-300 ${
                  newVisible > idx ? "opacity-100 text-gray-700" : "opacity-0"
                }`}
              >
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#1D9E75] shrink-0" />
                {step}
              </li>
            ))}
          </ul>
          {done && (
            <div className="mt-4 rounded-lg bg-[#E1F5EE] px-3 py-2 text-[12px] font-medium text-[#085041]">
              Gotowe — certyfikat z kodem QR ✓
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-[13px] text-gray-600 hover:bg-[#F1EFE8] transition-colors disabled:opacity-40"
        >
          {running ? "Animacja trwa..." : "Uruchom animację ▶"}
        </button>
      </div>
    </div>
  );
}
