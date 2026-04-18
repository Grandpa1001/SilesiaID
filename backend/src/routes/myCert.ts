import { Router } from "express";
import { getAddress, isAddress } from "viem";
import { db } from "../db/schema";
import { fetchBusinessData } from "../services/registries";
import { backfillTxHashIfMissing } from "../services/certTxSync";
import { getCertIdForWalletFromChain } from "../services/blockchain";

const router = Router();

type CertRow = {
  cert_id: string;
  nip: string;
  user_wallet: string | null;
  tx_hash: string | null;
  trust_level: number;
  company_name: string | null;
  company_status: string | null;
  revoked: number;
  created_at: string;
};

router.get("/my-cert", async (req, res) => {
  try {
    const raw = req.query.wallet as string | undefined;
    if (!raw || !isAddress(raw)) {
      return res.status(400).json({ error: "Nieprawidłowy adres portfela" });
    }
    const walletNorm = getAddress(raw);

    let cert = db
      .prepare(
        `
      SELECT * FROM certs
      WHERE revoked = 0
        AND user_wallet IS NOT NULL
        AND LOWER(user_wallet) = LOWER(?)
      ORDER BY created_at DESC
      LIMIT 1
    `
      )
      .get(walletNorm) as CertRow | undefined;

    if (!cert) {
      const chainCertId = await getCertIdForWalletFromChain(walletNorm);
      if (chainCertId) {
        cert = db.prepare("SELECT * FROM certs WHERE cert_id = ? AND revoked = 0").get(chainCertId) as CertRow | undefined;
        if (cert) {
          db.prepare("UPDATE certs SET user_wallet = ? WHERE cert_id = ?").run(walletNorm, cert.cert_id);
          console.log("[my-cert] dopisano user_wallet z mapowania łańcuch → baza", { certId: cert.cert_id });
        }
      }
    }

    if (!cert) {
      return res.status(404).json({ error: "Brak certyfikatu dla tego konta" });
    }

    const txHash = await backfillTxHashIfMissing(cert.cert_id, cert.tx_hash);

    const business = await fetchBusinessData(cert.nip);

    const verifyEvents = db
      .prepare("SELECT verifier, verified_at FROM verify_events WHERE cert_id = ? ORDER BY verified_at DESC LIMIT 20")
      .all(cert.cert_id) as { verifier: string | null; verified_at: string }[];

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";

    res.json({
      certId: cert.cert_id,
      nip: cert.nip,
      qrUrl: `${frontendUrl}/verify/${cert.cert_id}`,
      txHash,
      issuedAt: cert.created_at,
      company: {
        name: business?.name ?? cert.company_name,
        status: business?.status ?? cert.company_status,
        trustLevel: business?.trustLevel ?? cert.trust_level,
        vatActive: business?.vatActive ?? true,
        address: business?.address,
      },
      verifyHistory: verifyEvents,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
