"use client";

import { usePrivy } from "@privy-io/react-auth";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SilesiaIDLogo } from "./Logo";

export default function Header() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const pathname = usePathname();

  const userLabel = user?.email?.address ?? user?.phone?.number ?? null;

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          active
            ? "bg-primary-light text-primary"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">

        <Link href="/" className="shrink-0">
          <SilesiaIDLogo iconSize={56} />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Not yet authenticated */}
          {ready && !authenticated && (
            <>
              <Link
                href="/institution/login"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                Panel instytucji
              </Link>
              <button
                type="button"
                onClick={login}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Panel przedsiębiorcy
              </button>
            </>
          )}

          {/* Authenticated user */}
          {ready && authenticated && (
            <>
              {navLink("/dashboard", "Mój certyfikat")}
              {navLink("/onboarding", "Nowy certyfikat")}
              <div className="mx-1 h-4 w-px bg-gray-200" />
              {userLabel && (
                <span
                  className="hidden max-w-[140px] truncate text-xs text-gray-400 sm:block"
                  title={userLabel}
                >
                  {userLabel}
                </span>
              )}
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
              >
                Wyloguj
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
