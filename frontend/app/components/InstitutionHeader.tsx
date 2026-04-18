"use client";

import Link from "next/link";
import { SilesiaIDLogo } from "./Logo";

type Tab = "verify" | "docs";

interface InstitutionHeaderProps {
  institutionName?: string;
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
  onLogout?: () => void;
}

export default function InstitutionHeader({
  institutionName,
  activeTab,
  onTabChange,
  onLogout,
}: InstitutionHeaderProps) {
  const hasTabs = !!activeTab && !!onTabChange;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      {/* Main row */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">

        {/* Logo + institution context */}
        <div className="flex items-center gap-4 shrink-0">
          <Link href="/">
            <SilesiaIDLogo iconSize={56} />
          </Link>
          {institutionName && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-5 w-px bg-gray-200" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-dark">
                  Panel instytucji
                </p>
                <p className="text-[14px] font-semibold leading-tight text-gray-900">
                  {institutionName}
                </p>
              </div>
            </div>
          )}
          {!institutionName && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-5 w-px bg-gray-200" />
              <span className="text-[12px] font-medium text-gray-400">
                Panel instytucji
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            <span className="hidden sm:inline">Strona główna</span>
            <span className="sm:hidden">Główna</span>
          </Link>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              Wyloguj
            </button>
          )}
        </div>
      </div>

      {/* Tab row — only when authenticated */}
      {hasTabs && (
        <div className="mx-auto max-w-5xl px-4">
          <nav className="flex gap-0.5">
            {(["verify", "docs"] as Tab[]).map((tab) => {
              const labels: Record<Tab, string> = {
                verify: "Weryfikacja",
                docs: "Dokumentacja API",
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onTabChange(tab)}
                  className={`-mb-px rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-primary text-primary"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
