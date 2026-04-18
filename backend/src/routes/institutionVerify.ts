/// <reference path="../types/express.d.ts" />
import { Router } from "express";
import { db } from "../db/schema";
import { institutionAuthMiddleware } from "../middleware/institutionAuth";
import { fetchBusinessData } from "../services/registries";

const router = Router();

type CertRow = {
  cert_id: string;
  nip: string;
  tx_hash: string | null;
  trust_level: number;
  company_name: string | null;
  company_status: string | null;
  revoked: number;
  created_at: string;
};

router.get("/lookup", institutionAuthMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (!q) {
      res.status(400).json({ error: "Brak parametru q" });
      return;
    }

    const isNip = /^\d{10}$/.test(q);
    const cert = (
      isNip
        ? db.prepare("SELECT * FROM certs WHERE nip = ?").get(q)
        : db.prepare("SELECT * FROM certs WHERE cert_id = ?").get(q)
    ) as CertRow | undefined;

    if (!cert) {
      res.status(404).json({ error: "Certyfikat nie znaleziony" });
      return;
    }

    const business = await fetchBusinessData(cert.nip);

    const institution = req.institution;
    if (!institution) {
      res.status(401).json({ error: "Brak kontekstu instytucji" });
      return;
    }

    db.prepare("INSERT INTO verify_events (cert_id, verifier) VALUES (?, ?)").run(
      cert.cert_id,
      institution.name,
    );

    res.json({
      certId: cert.cert_id,
      nip: cert.nip,
      company: {
        name: business?.name ?? cert.company_name ?? cert.nip,
        status: business?.status ?? cert.company_status ?? "unknown",
        trustLevel: business?.trustLevel ?? cert.trust_level,
        vatActive: business?.vatActive ?? true,
      },
      issuedAt: cert.created_at,
      revoked: cert.revoked === 1,
    });
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Błąd serwera";
    res.status(500).json({ error: message });
  }
});

export default router;
