import { Router } from "express";
import { db } from "../db/schema";

const router = Router();

router.post("/cert/:certId/revoke", (req, res) => {
  try {
    const { certId } = req.params;
    const { wallet } = req.body as { wallet?: string };

    if (!wallet) {
      return res.status(400).json({ error: "Brak parametru wallet" });
    }

    const cert = db
      .prepare("SELECT cert_id, user_wallet, revoked FROM certs WHERE cert_id = ?")
      .get(certId) as { cert_id: string; user_wallet: string | null; revoked: number } | undefined;

    if (!cert) {
      return res.status(404).json({ error: "Certyfikat nie znaleziony" });
    }

    if (cert.user_wallet?.toLowerCase() !== wallet.toLowerCase()) {
      return res.status(403).json({ error: "Brak uprawnień do wycofania certyfikatu" });
    }

    if (cert.revoked) {
      return res.status(409).json({ error: "Certyfikat już wycofany" });
    }

    db.prepare("UPDATE certs SET revoked = 1 WHERE cert_id = ?").run(certId);

    res.json({ success: true, message: "Certyfikat wycofany" });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
