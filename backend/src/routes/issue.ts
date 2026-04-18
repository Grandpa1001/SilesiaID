import { Router } from "express";
import { z, ZodError } from "zod";
import { BaseError, getAddress, isAddress, keccak256, toHex } from "viem";
import { db } from "../db/schema";
import { fetchBusinessData } from "../services/registries";
import { generateCertId } from "../services/certIdGenerator";
import { findMintTxHashByCertId, getCertIdForWalletFromChain, mintCertificate } from "../services/blockchain";
import { backfillTxHashIfMissing } from "../services/certTxSync";
import { ISSUE_ROUTE_VERSION } from "../issueRouteVersion";

const router = Router();

/** Czytelny komunikat z viem (revert kontraktu, RPC, brak gas itd.) — Hardhat nie bierze udziału w tym wywołaniu. */
function formatChainError(err: unknown): string {
  let out: string;
  if (err instanceof BaseError) {
    const bits: string[] = [err.shortMessage];
    if (err.details) bits.push(err.details);
    const c = err.cause;
    if (c instanceof Error && c.message) bits.push(c.message);
    out = bits.join(" — ").slice(0, 500);
  } else if (err instanceof Error) {
    out = err.message.slice(0, 500);
  } else {
    out = String(err).slice(0, 500);
  }
  const t = out.trim();
  return t || "Nieznany błąd blockchain (pusty komunikat) — sprawdź logi serwera [issue-cert] / [mint].";
}

/**
 * Kontrakt wymaga unikalnego adresu na certyfikat (`walletToTokenId`).
 * Stały placeholder `0x…01` powodował revert „Wallet already has a certificate” przy drugim wydaniu.
 * Gdy brak prawdziwego portfela Privy — adres deterministyczny z NIP + certId (unikalny na rekord).
 */
function normalizedUserWallet(userWallet: string | undefined): string | null {
  if (!userWallet || !isAddress(userWallet)) return null;
  return getAddress(userWallet);
}

function walletForMint(userWallet: string | undefined, nip: string, certId: string): `0x${string}` {
  const n = normalizedUserWallet(userWallet);
  if (n) return n as `0x${string}`;
  const h = keccak256(toHex(`${nip}:${certId}`));
  return `0x${h.slice(2, 42)}` as `0x${string}`;
}

const IssueSchema = z.object({
  nip: z.string().regex(/^\d{10}$/, "NIP musi mieć 10 cyfr"),
  userWallet: z.string().optional(),
});

router.post("/issue-cert", async (req, res) => {
  try {
    const { nip, userWallet } = IssueSchema.parse(req.body);

    console.log("[issue-cert] żądanie", {
      routeVersion: ISSUE_ROUTE_VERSION,
      nip,
      hasUserWallet: Boolean(userWallet),
      userWallet: userWallet ? `${userWallet.slice(0, 8)}…${userWallet.slice(-4)}` : null,
    });

    const existing = db.prepare("SELECT cert_id, user_wallet, tx_hash FROM certs WHERE nip = ?").get(nip) as
      | { cert_id: string; user_wallet: string | null; tx_hash: string | null }
      | undefined;
    if (existing) {
      let txHash = await backfillTxHashIfMissing(existing.cert_id, existing.tx_hash);
      let mintAttempted = false;

      if (!txHash && normalizedUserWallet(userWallet)) {
        const business = await fetchBusinessData(nip);
        if (business) {
          const wallet = walletForMint(userWallet, nip, existing.cert_id);
          try {
            mintAttempted = true;
            console.log("[issue-cert] wywołanie mint (ścieżka: alreadyExists + brak tx_hash)", {
              certId: existing.cert_id,
            });
            const newTx = await mintCertificate(
              wallet,
              nip,
              business.krsNumber,
              business.trustLevel,
              existing.cert_id
            );
            db.prepare("UPDATE certs SET tx_hash = ? WHERE cert_id = ?").run(newTx, existing.cert_id);
            txHash = newTx;
            console.log("[issue-cert] ponowny mint (alreadyExists + brak tx_hash) OK", { certId: existing.cert_id });
          } catch (retryErr) {
            console.error("[issue-cert] ponowny mint nieudany:", formatChainError(retryErr), retryErr);
          }
        }
      }

      console.warn("[issue-cert] alreadyExists — bez nowego certyfikatu w DB; tx_hash po backfill / retry", {
        nip,
        certId: existing.cert_id,
        tx_hash: txHash,
        user_wallet_set: Boolean(existing.user_wallet),
      });
      const nw = normalizedUserWallet(userWallet);
      if (nw && !existing.user_wallet) {
        db.prepare("UPDATE certs SET user_wallet = ? WHERE cert_id = ?").run(nw, existing.cert_id);
      }
      const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
      console.log("[issue-cert] podsumowanie alreadyExists", {
        mintAttempted,
        hasTxHash: Boolean(txHash),
        certId: existing.cert_id,
      });
      res.setHeader("X-SilesiaID-Issue-Route", String(ISSUE_ROUTE_VERSION));
      return res.json({
        certId: existing.cert_id,
        qrUrl: `${frontendUrl}/verify/${existing.cert_id}`,
        alreadyExists: true,
        txHash,
        mintFailed: false,
        mintAttempted,
        issueRouteVersion: ISSUE_ROUTE_VERSION,
      });
    }

    const business = await fetchBusinessData(nip);
    if (!business) {
      return res.status(404).json({ error: "Firma nie znaleziona" });
    }

    const nwEarly = normalizedUserWallet(userWallet);
    if (nwEarly) {
      const certIdOnChain = await getCertIdForWalletFromChain(nwEarly as `0x${string}`);
      if (certIdOnChain) {
        const txHint = await findMintTxHashByCertId(certIdOnChain);
        console.warn("[issue-cert] PORTFEL MA JUŻ TOKEN NA ŁAŃCUCHU — pomijam nowy mint (1 adres = 1 cert)", {
          wallet: `${nwEarly.slice(0, 10)}…${nwEarly.slice(-4)}`,
          certIdOnChain,
          mintTxHashZLancucha: txHint ?? "(nie znaleziono getLogs — dopisz ręcznie w DB lub Sepolia Etherscan → IdentityIssued)",
        });
        const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
        res.setHeader("X-SilesiaID-Issue-Route", String(ISSUE_ROUTE_VERSION));
        return res.json({
          certId: certIdOnChain,
          qrUrl: `${frontendUrl}/verify/${certIdOnChain}`,
          alreadyExists: false,
          mintFailed: true,
          mintAttempted: false,
          chainConflict: true,
          existingCertIdFromChain: certIdOnChain,
          onChainMintTxHash: txHint,
          mintError:
            "Ten portfel ma już certyfikat SilesiaID na Sepolii (kontrakt: jeden token na adres). Użyj „Mój certyfikat” albo wycofaj stary certyfikat na łańcuchu, potem wystaw ponownie.",
          issueRouteVersion: ISSUE_ROUTE_VERSION,
        });
      }
    }

    const certId = generateCertId(nip);
    const wallet = walletForMint(userWallet, nip, certId);

    console.log("[issue-cert] przygotowanie mint", {
      certId,
      nip,
      userWalletFromBody: userWallet ?? null,
      mintTarget: wallet,
      syntheticWallet: !normalizedUserWallet(userWallet),
    });

    let txHash: string | null = null;
    let mintError: string | null = null;
    const mintAttempted = true;
    try {
      console.log("[issue-cert] wywołanie mint (ścieżka: nowy certyfikat)", { certId, mintTarget: wallet });
      txHash = await mintCertificate(wallet, nip, business.krsNumber, business.trustLevel, certId);
      console.log("[issue-cert] mint zakończony", { certId, txHash });
    } catch (blockchainErr) {
      mintError = formatChainError(blockchainErr);
      console.error("[issue-cert] mint nieudany:", mintError, blockchainErr);
      console.warn(
        "[issue-cert] Ten sam komunikat jest w polu mintError w JSON odpowiedzi POST /issue-cert (frontend: Network → issue-cert)."
      );
      if (nwEarly && mintError.includes("Wallet already has a certificate")) {
        const cid = await getCertIdForWalletFromChain(nwEarly as `0x${string}`);
        const txHint = cid ? await findMintTxHashByCertId(cid) : null;
        console.warn("[issue-cert] revert „Wallet already…” — odczyt łańcucha (np. wyścig żądań)", {
          wallet: `${nwEarly.slice(0, 10)}…`,
          certIdOnChain: cid,
          mintTxHashZLancucha: txHint,
          probowanyNowyCertId: certId,
        });
      }
    }

    if (!txHash) {
      if (!mintError?.trim()) {
        mintError =
          "Brak hash transakcji po mint — nieprawidłowy stan (sprawdź logi [mint], SEPOLIA_RPC_URL, CONTRACT_ADDRESS, DEPLOYER_PRIVATE_KEY).";
      }
    }

    if (txHash) {
      db.prepare(
        `
      INSERT INTO certs (cert_id, nip, user_wallet, tx_hash, trust_level, company_name, company_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      ).run(certId, nip, normalizedUserWallet(userWallet), txHash, business.trustLevel, business.name, business.status);
    } else {
      console.warn("[issue-cert] brak INSERT do bazy — mint bez tx_hash (unikasz „sierot” typu BEC115)", { certId, nip });
    }

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    /** Synchroniczny mint zawsze kończy się tx_hash albo błędem — brak hash = niepowodzenie (nie polegaj na pustym mintError). */
    const mintFailed = !txHash;
    console.log("[issue-cert] podsumowanie nowy cert", {
      routeVersion: ISSUE_ROUTE_VERSION,
      mintAttempted,
      mintFailed,
      hasTxHash: Boolean(txHash),
      certId,
    });
    res.setHeader("X-SilesiaID-Issue-Route", String(ISSUE_ROUTE_VERSION));
    res.json({
      certId,
      qrUrl: `${frontendUrl}/verify/${certId}`,
      txHash,
      company: business.name,
      alreadyExists: false,
      mintFailed,
      mintAttempted,
      issueRouteVersion: ISSUE_ROUTE_VERSION,
      ...(mintFailed ? { mintError: mintError ?? "Mint nie powiódł się" } : {}),
    });
  } catch (e: any) {
    console.error(e);
    if (e instanceof ZodError) {
      return res.status(400).json({ error: e.message });
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;
