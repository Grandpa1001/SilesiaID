"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { SilesiaIDLogo } from "./Logo";

export default function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  const isLanding = pathname === "/";
  const isDashboard = pathname === "/dashboard";

  const userLabel = user?.email?.address ?? user?.phone?.number ?? null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-2.5">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <SilesiaIDLogo iconSize={28} />
        </Link>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/institution/login"
            className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Dla instytucji
          </Link>

          {ready && authenticated && (
            <nav className="flex flex-wrap items-center gap-1">
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isDashboard
                    ? "bg-primary-light text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                Mój certyfikat
              </Link>

              {isLanding && (
                <button
                  type="button"
                  onClick={() => router.push("/onboarding")}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Utwórz certyfikat
                </button>
              )}

              <div className="ml-1 flex items-center gap-2 border-l border-gray-100 pl-3">
                {userLabel && (
                  <span className="hidden max-w-[130px] truncate text-xs text-gray-400 sm:block" title={userLabel}>
                    {userLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  Wyloguj
                </button>
              </div>
            </nav>
          )}

          {ready && !authenticated && (
            <button
              type="button"
              onClick={login}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              Zaloguj się
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
