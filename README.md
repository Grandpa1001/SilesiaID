# SilesiaID — V001 · V002 · V003 · V004 (w toku)

Jeden cyfrowy dokument zamiast stosu papierów.  
Raz się weryfikujesz, wszędzie jesteś rozpoznany.

## Czym jest SilesiaID

SilesiaID to projekt infrastruktury tożsamości biznesowej dla firm:
- firma tworzy certyfikat tożsamości raz,
- instytucje (banki, urzędy, kontrahenci) weryfikują go wielokrotnie,
- dane są aktualne i sprawdzalne w kilka sekund.

Projekt startuje jako inicjatywa hackathonowa (ETHSilesia 2026), z celem przejścia do pilotażu z partnerami instytucjonalnymi.

## V001 — zakres tej wersji

Wersja `V001` definiuje:
- problem i wartość biznesową,
- strategiczny kierunek (anchor partner → skala → efekt sieciowy),
- bazowe artefakty dokumentacyjne projektu.

## Dokumentacja

- `Dokumenty/Projekt.md` — opis projektu i roadmapa
- `Dokumenty/Strategia.md` — strategia produktu, ICP, GTM, ryzyka i wizja
- `Dokumenty/Produkt.md` — skrócona specyfikacja produktu (V001)
- `Dokumenty/PlanDevelopmentu.md` — plan implementacji krok po kroku

## Założenia strategiczne (skrót)

- SilesiaID to infrastruktura, nie aplikacja dokumentowa
- blockchain działa w tle (bez ekspozycji technicznej dla użytkownika)
- certyfikat należy do firmy, nie do platformy
- priorytetem jest adopcja instytucjonalna (bank/duży partner) jako dźwignia wzrostu

## V002 — smart contract + Sepolia

- monorepo: `frontend/`, `backend/`, `contracts/`
- konfiguracja środowiska (`backend/.env.example`, `frontend/.env.local.example`, `contracts/.env.example`)
- smart contract `SilesiaID.sol` (ERC721 soulbound), testy Hardhat (3/3)
- deploy na Sepolia

Adres kontraktu Sepolia: `0xc88aA21A71d0fEebcFF88e0013125D324A81bC11`

## V003 — zrealizowane kroki (podsumowanie)

Wersja `V003` obejmuje domknięcie backendu API zgodnie z planem (`Dokumenty/PlanDevelopmentu.md` — Faza 2).

| Obszar | Co zrobiono |
|--------|-------------|
| **Faza 0** | Struktura monorepo, `.gitignore`, pliki `.env` / `.env.example` |
| **Faza 1** | Hardhat, `SilesiaID.sol`, testy, deploy Sepolia, `hardhat.config.ts`, skrypt `deploy.ts` |
| **2.1** | Backend Express + TypeScript: `GET /health`, routery, skrypty `dev` / `build` / `start` |
| **2.2** | SQLite: `schema.ts`, tabele `certs` i `verify_events`, `initDB()` przy starcie |
| **2.3** | Stuby API: `POST /verify-nip`, `POST /issue-cert`, `GET /verify/:certId` |
| **2.4** | Mock firm (`mockData`), `vatApi`, `registries` (mock + ścieżki real), integracja z `verify-nip` |
| **2.5** | `certIdGenerator`, `blockchain.ts` (`mintCertificate`, `verifyOnChain`) |
| **2.6** | Pełny `POST /issue-cert`: duplikat NIP, mint on-chain (z graceful fallback), zapis do DB |
| **2.7** | Pełny `GET /verify/:certId`: odczyt z DB, świeże dane z rejestrów, log `verify_events` |

Pętla backendowa do testów: `verify-nip` → `issue-cert` → `verify/:certId` (szczegóły i `curl` w `PlanDevelopmentu.md`).

## V004 — Faza 3.1 (frontend Next.js)

- Next.js 16 (App Router), TypeScript, Tailwind, alias `@/*`
- Zależności: `@privy-io/react-auth`, `wagmi`, `viem`, `qrcode.react`, `swr`
- Konfiguracja w `frontend/.env.local` i `frontend/.env` (m.in. `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_BACKEND_URL`, adres kontraktu, `NEXT_PUBLIC_CHAIN_ID=11155111`)
- Szablon: `frontend/.env.local.example` (commitowalny; pliki `.env*` nadal ignorowane z wyjątkiem `*.example`)
- **3.2:** `app/providers.tsx` (Privy + Sepolia), `lib/api.ts`, `layout` z metadanymi SilesiaID, prosta strona `/` z logowaniem Privy
- **3.3:** landing (`/`) z opisem 3 kroków, CTA „Zacznij — zaloguj się przez e-mail”, po zalogowaniu redirect na `/onboarding` (formularz NIP w 3.4)

Uruchomienie UI lokalnie:

```bash
cd frontend && npm run dev
```

Otwórz `http://localhost:3000` (domyślna strona startowa Next.js). Backend: `cd backend && npm run dev` na porcie `3001`.

## Jak dodać wersję na GitHub (tag)

Przykład dla `V003`:

1. `git add .`
2. `git commit -m "release: V003 backend API (issue + verify loop)"`
3. `git tag -a v0.0.3 -m "V003"`
4. `git push origin main`
5. `git push origin v0.0.3`

## Najbliższe kroki

1. **Krok 3.4+** — onboarding NIP, strona verify / QR (plan w `PlanDevelopmentu.md`)
2. Demo end-to-end w przeglądarce: NIP → certyfikat → QR → weryfikacja
3. Deploy (np. Vercel + Railway) według planu

## Status

Etap: `V004 / 3.1–3.3 gotowe (Next.js + Privy + landing); kolejny krok: 3.4 onboarding NIP`.
