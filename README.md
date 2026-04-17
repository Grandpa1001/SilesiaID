# SilesiaID — V001 / V002 (in progress)

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
- strategiczny kierunek (anchor partner -> skala -> efekt sieciowy),
- bazowe artefakty dokumentacyjne projektu.

## Dokumentacja

- `Dokumenty/Projekt.md` — opis projektu i roadmapa
- `Dokumenty/Strategia.md` — strategia produktu, ICP, GTM, ryzyka i wizja
- `Dokumenty/Produkt.md` — skrócona specyfikacja produktu (V001)

## Założenia strategiczne (skrót)

- SilesiaID to infrastruktura, nie aplikacja dokumentowa
- blockchain działa w tle (bez ekspozycji technicznej dla użytkownika)
- certyfikat należy do firmy, nie do platformy
- priorytetem jest adopcja instytucjonalna (bank/duży partner) jako dźwignia wzrostu

## V002 — co jest już przygotowane

W ramach startu technicznego pod `V002` zostało przygotowane:
- monorepo: `frontend/`, `backend/`, `contracts/`,
- konfiguracja środowiska (`backend/.env.example`, `frontend/.env.local.example`, `contracts/.env.example`),
- smart contract `SilesiaID.sol` (ERC721 soulbound),
- testy kontraktu (3/3 zielone),
- deploy kontraktu na Sepolia.

Adres kontraktu Sepolia:
- `0xc88aA21A71d0fEebcFF88e0013125D324A81bC11`

## Jak dodać nową wersję na GitHub (prosto)

Po podpięciu zdalnego repozytorium:

1. `git add .`
2. `git commit -m "release: przygotowanie V002 (smart contract + deploy sepolia)"`
3. `git tag -a v0.0.2 -m "V002"`
4. `git push origin main`
5. `git push origin v0.0.2`

To tworzy czytelną wersję `V002` jako commit + tag.

## Najbliższe kroki

1. MVP demo end-to-end: NIP -> dane rejestrowe -> certyfikat -> QR -> weryfikacja
2. Rozmowy z anchor partnerem pilotażowym
3. Definicja API weryfikacyjnego i modelu integracji
4. Integracja backendu z kontraktem i endpointami issue/verify

## Status

Etap: `V002 / smart contract gotowy + deploy na Sepolia`.
