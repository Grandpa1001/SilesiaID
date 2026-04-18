import { Router } from "express";
import { db } from "../db/schema";
import { fetchBusinessData } from "../services/registries";

const router = Router();

router.get("/my-cert", async (req, res) => {
  try {
    const wallet = req.query.wallet as string | undefined;
    if (!wallet) {
      return res.status(400).json({ error: "Brak parametru wallet" });
    }

    const cert = db
      .prepare("SELECT * FROM certs WHERE user_wallet = ? AND revoked = 0 ORDER BY created_at DESC LIMIT 1")
      .get(wallet) as
      | {
          cert_id: string;
          nip: string;
          user_wallet: string | null;
          tx_hash: string | null;
          trust_level: number;
          company_name: string | null;
          company_status: string | null;
          revoked: number;
          created_at: string;
        }
      | undefined;

    if (!cert) {
      return res.status(404).json({ error: "Brak certyfikatu dla tego konta" });
    }

    const business = await fetchBusinessData(cert.nip);

    const verifyEvents = db
      .prepare("SELECT verifier, verified_at FROM verify_events WHERE cert_id = ? ORDER BY verified_at DESC LIMIT 20")
      .all(cert.cert_id) as { verifier: string | null; verified_at: string }[];

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";

    res.json({
      certId: cert.cert_id,
      nip: cert.nip,
      qrUrl: `${frontendUrl}/verify/${cert.cert_id}`,
      txHash: cert.tx_hash,
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
