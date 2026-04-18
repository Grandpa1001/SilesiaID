# SilesiaID

Jeden cyfrowy dokument zamiast stosu papierów.  
Raz się weryfikujesz, wszędzie jesteś rozpoznany.

## Czym jest SilesiaID

SilesiaID to infrastruktura tożsamości biznesowej:
- firma weryfikuje się raz i otrzymuje certyfikat (NFT soulbound na Sepolia),
- instytucje (banki, urzędy, kontrahenci) weryfikują go w kilka sekund,
- dane są zawsze aktualne — pobierane live z CEIDG / VAT.

Projekt hackathonowy ETHSilesia 2026, z celem przejścia do pilotażu z partnerami instytucjonalnymi.

---

## Jak działa aplikacja

### Ścieżka przedsiębiorcy

1. **Landing (`/`)** — opis produktu, CTA „Zaloguj się przez e-mail"
2. **Logowanie** — Privy (email / SMS), tworzy embedded wallet Ethereum
3. **Onboarding (`/onboarding`)** — wpisz NIP → backend weryfikuje w CEIDG/VAT → potwierdzenie danych firmy → mint certyfikatu jako NFT soulbound na Sepolia
4. **Sukces** — QR kod certyfikatu + link do transakcji na Etherscan
5. **Dashboard (`/dashboard`)** — panel firmy: status certyfikatu, historia weryfikacji, wylogowanie

### Ścieżka instytucji

1. **Login instytucji (`/institution/login`)** — rejestracja lub logowanie emailem
2. **Weryfikacja (`/institution/verify`)** — wpisz NIP lub cert ID → natychmiastowe dane firmy
3. **API key** — generowanie klucza do integracji: `GET /api/v1/institution/lookup?q=<nip>`

### Publiczna weryfikacja

- **`/verify/[certId]`** — każdy może sprawdzić certyfikat: status, dane firmy, link on-chain

---

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Auth | Privy (email/SMS login, embedded wallet) |
| Backend | Express 5, TypeScript, SQLite (better-sqlite3) |
| Blockchain | Solidity (ERC721 soulbound), Hardhat, Sepolia testnet |
| Deploy | Vercel (frontend) + Railway (backend) |

**Adres kontraktu Sepolia:** `0xc88aA21A71d0fEebcFF88e0013125D324A81bC11`

---

## Uruchomienie lokalne

```bash
# Backend (port 3001)
cd backend && npm install && npm run dev

# Frontend (port 3000)
cd frontend && npm install && npm run dev
```

### Zmienne środowiskowe

**`frontend/.env.local`**
```
NEXT_PUBLIC_PRIVY_APP_ID=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_CONTRACT_ADDRESS=0xc88aA21A71d0fEebcFF88e0013125D324A81bC11
NEXT_PUBLIC_CHAIN_ID=11155111
```

**`backend/.env`**
```
PORT=3001
SEPOLIA_RPC_URL=...
CONTRACT_ADDRESS=0xc88aA21A71d0fEebcFF88e0013125D324A81bC11
DEPLOYER_PRIVATE_KEY=...
CORS_ORIGIN=http://localhost:3000
MOCK_MODE=false
```

---

## Struktura monorepo

```
SilesiaID/
├── frontend/          # Next.js — UI przedsiębiorcy i instytucji
│   └── app/
│       ├── page.tsx             # Landing
│       ├── onboarding/          # Flow NIP → certyfikat
│       ├── dashboard/           # Panel firmy
│       ├── verify/[certId]/     # Publiczna weryfikacja
│       └── institution/         # Login i weryfikacja instytucji
├── backend/           # Express API
│   └── src/
│       ├── routes/              # nip, issue, verify, myCert, revoke, institution*
│       ├── services/            # blockchain, registries, ceidgApi
│       └── db/                  # SQLite schema + migracje
├── contracts/         # Hardhat + SilesiaID.sol (ERC721 soulbound)
├── railway.json       # Konfiguracja deploy Railway
└── railpack.json      # Konfiguracja buildu Railpack
```

---

## Deploy

- **Backend:** Railway — root directory `backend`, zmienne env w dashboardzie
- **Frontend:** Vercel — root directory `frontend`, zmienne `NEXT_PUBLIC_*` w dashboardzie

---

