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
        <Link href="/" className="shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#185FA5] focus-visible:ring-offset-2">
          <SilesiaIDLogo iconSize={28} />
        </Link>

        {/* Nav — authenticated */}
        {ready && authenticated && (
          <nav className="flex items-center gap-1 ml-auto">
            <Link
              href="/dashboard"
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isDashboard
                  ? "bg-[#E6F1FB] text-[#185FA5]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              Mój certyfikat
            </Link>

            {isLanding && (
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="rounded-lg bg-[#1A1A1A] px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Utwórz certyfikat
              </button>
            )}

            {/* Divider + user section */}
            <div className="ml-2 flex items-center gap-2 pl-3 border-l border-gray-100">
              {userLabel && (
                <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[130px]" title={userLabel}>
                  {userLabel}
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Wyloguj
              </button>
            </div>
          </nav>
        )}

        {/* Nav — unauthenticated */}
        {ready && !authenticated && (
          <div className="ml-auto">
            <button
              type="button"
              onClick={login}
              className="rounded-lg bg-[#185FA5] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#0C447C] transition-colors disabled:opacity-50"
            >
              Zaloguj się
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
