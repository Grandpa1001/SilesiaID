"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";

export default function SuccessScreen({ certId, qrUrl }: { certId: string; qrUrl: string }) {
  const router = useRouter();
  const [QRCode, setQRCode] = useState<ComponentType<{ value: string; size: number }> | null>(
    null
  );

  useEffect(() => {
    void import("qrcode.react").then((m) => {
      setQRCode(() => m.QRCodeSVG);
    });
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow">
      <div className="mb-3 text-5xl">✅</div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Certyfikat gotowy!</h1>
      <p className="mb-4 text-gray-500">
        ID: <span className="font-mono font-bold text-blue-700">{certId}</span>
      </p>
      <div className="mb-4 flex justify-center rounded-xl border-2 border-gray-100 bg-white p-4">
        {QRCode ? (
          <QRCode value={qrUrl} size={200} />
        ) : (
          <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
            Ładowanie QR...
          </div>
        )}
      </div>
      <p className="mb-3 text-sm text-gray-500">
        Pokaż ten kod, gdy instytucja pyta &quot;kim jesteś?&quot;
      </p>
      <div className="mb-4 rounded-lg bg-gray-50 p-2 font-mono text-xs break-all text-gray-500">
        {qrUrl}
      </div>
      <button
        type="button"
        onClick={() => router.push(`/verify/${certId}`)}
        className="w-full rounded-xl border-2 border-blue-600 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
      >
        Otwórz stronę weryfikacji →
      </button>
    </div>
  );
}
