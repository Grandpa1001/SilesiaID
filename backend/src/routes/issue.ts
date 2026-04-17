import { Router } from "express";
import { z, ZodError } from "zod";
import { db } from "../db/schema";
import { fetchBusinessData } from "../services/registries";
import { generateCertId } from "../services/certIdGenerator";
import { mintCertificate } from "../services/blockchain";

const router = Router();

const IssueSchema = z.object({
  nip: z.string().regex(/^\d{10}$/, "NIP musi mieć 10 cyfr"),
  userWallet: z.string().optional(),
});

router.post("/issue-cert", async (req, res) => {
  try {
    const { nip, userWallet } = IssueSchema.parse(req.body);

    const existing = db.prepare("SELECT * FROM certs WHERE nip = ?").get(nip) as
      | { cert_id: string }
      | undefined;
    if (existing) {
      const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
      return res.json({
        certId: existing.cert_id,
        qrUrl: `${frontendUrl}/verify/${existing.cert_id}`,
        alreadyExists: true,
      });
    }

    const business = await fetchBusinessData(nip);
    if (!business) {
      return res.status(404).json({ error: "Firma nie znaleziona" });
    }

    const certId = generateCertId(nip);
    const wallet = userWallet || `0x${"0".repeat(39)}1`;

    let txHash: string | null = null;
    try {
      txHash = await mintCertificate(wallet, nip, business.krsNumber, business.trustLevel, certId);
    } catch (blockchainErr) {
      console.error("Blockchain mint failed:", blockchainErr);
    }

    db.prepare(
      `
      INSERT INTO certs (cert_id, nip, tx_hash, trust_level, company_name, company_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(certId, nip, txHash, business.trustLevel, business.name, business.status);

    const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
    res.json({
      certId,
      qrUrl: `${frontendUrl}/verify/${certId}`,
      txHash,
      company: business.name,
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
