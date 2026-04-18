"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";

export default function SuccessScreen({
  certId,
  qrUrl,
  alreadyExists,
}: {
  certId: string;
  qrUrl: string;
  alreadyExists?: boolean;
}) {
  const router = useRouter();
  const [QRCode, setQRCode] = useState<ComponentType<{ value: string; size: number }> | null>(null);

  useEffect(() => {
    void import("qrcode.react").then((m) => setQRCode(() => m.QRCodeSVG));
  }, []);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-slide-up">
      <div className="px-6 py-8 text-center" style={{ backgroundColor: "#E1F5EE" }}>
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{ backgroundColor: "#1D9E75" }}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="mb-1 text-[20px] font-medium" style={{ color: "#085041" }}>
          Certyfikat gotowy!
        </h1>
        <p className="text-[13px]" style={{ color: "#1D9E75" }}>
          Twoja firma jest teraz zweryfikowana cyfrowo
        </p>
      </div>

      <div className="p-6">
        {alreadyExists && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-[13px] leading-relaxed"
            style={{ borderColor: "#F59E0B", backgroundColor: "#FFFBEB", color: "#92400E" }}
          >
            <p className="font-medium">Certyfikat dla tego NIP był już w bazie</p>
            <p className="mt-1 text-[12px] opacity-90">
              Nie tworzyliśmy drugiego rekordu — szczegóły znajdziesz w panelu certyfikatu.
            </p>
          </div>
        )}

        <div className="mb-5 rounded-xl bg-surface px-4 py-3">
          <div className="mb-0.5 text-[11px] font-medium text-gray-400">Certyfikat ID</div>
          <div className="font-mono text-[13px] font-medium text-gray-800 break-all">{certId}</div>
        </div>

        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="rounded-2xl border border-gray-100 p-4 bg-white shadow-sm">
            {QRCode ? (
              <QRCode value={qrUrl} size={180} />
            ) : (
              <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl bg-gray-50 text-[12px] text-gray-400">
                Ładowanie QR...
              </div>
            )}
          </div>
          <p className="max-w-xs text-center text-[13px] leading-relaxed text-gray-500">
            Pokaż ten kod instytucji — zweryfikuje Twoją firmę w 3 sekundy
          </p>
        </div>

        <div className="mb-5 rounded-xl bg-surface px-4 py-3">
          <div className="mb-0.5 text-[11px] font-medium text-gray-400">Link do weryfikacji</div>
          <div className="font-mono text-[11px] text-gray-500 break-all">{qrUrl}</div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-3.5 text-[14px] font-medium text-white transition-colors hover:bg-gray-800"
          >
            Przejdź do panelu certyfikatu
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => router.push(`/verify/${certId}`)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 text-[13px] text-gray-600 transition-colors hover:bg-surface"
          >
            Otwórz stronę publicznej weryfikacji
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
