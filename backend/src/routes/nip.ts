import { Router } from "express";
import { z } from "zod";
import { fetchBusinessData } from "../services/registries";

const router = Router();

const NipSchema = z.object({
  nip: z.string().regex(/^\d{10}$/, "NIP musi mieć 10 cyfr"),
});

router.post("/verify-nip", async (req, res) => {
  try {
    const { nip } = NipSchema.parse(req.body);
    const data = await fetchBusinessData(nip);
    if (!data) {
      return res.status(404).json({ error: "Firma nie znaleziona dla NIP: " + nip });
    }
    res.json({ verified: true, data });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
