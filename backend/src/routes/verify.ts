import { Router } from "express";
import { db } from "../db/schema";
import { fetchBusinessData } from "../services/registries";
import { backfillTxHashIfMissing } from "../services/certTxSync";

const router = Router();

router.get("/verify/:certId", async (req, res) => {
  try {
    const { certId } = req.params;

    const cert = db.prepare("SELECT * FROM certs WHERE cert_id = ?").get(certId) as
      | {
          cert_id: string;
          nip: string;
          tx_hash: string | null;
          trust_level: number;
          company_name: string | null;
          company_status: string | null;
          revoked: number;
          created_at: string;
        }
      | undefined;

    if (!cert) {
      return res.status(404).json({ error: "Certyfikat nie znaleziony" });
    }

    const business = await fetchBusinessData(cert.nip);

    const txHash = await backfillTxHashIfMissing(certId, cert.tx_hash);

    db.prepare("INSERT INTO verify_events (cert_id, verifier) VALUES (?, ?)").run(
      certId,
      (req.headers["x-verifier"] as string | undefined) || null
    );

    res.json({
      certId,
      nip: cert.nip,
      company: {
        nip: cert.nip,
        name: business?.name ?? cert.company_name,
        status: business?.status ?? cert.company_status,
        trustLevel: business?.trustLevel ?? cert.trust_level,
        vatActive: business?.vatActive ?? true,
        address: business?.address,
      },
      txHash,
      issuedAt: cert.created_at,
      verifiedAt: new Date().toISOString(),
      revoked: cert.revoked === 1,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
