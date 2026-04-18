/// <reference path="../types/express.d.ts" />
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { db } from "../db/schema";
import { institutionJwtOnlyMiddleware, signInstitutionJwt } from "../middleware/institutionAuth";

const router = Router();

const BCRYPT_ROUNDS = 10;

const RegisterSchema = z.object({
  email: z.string().email("Nieprawidłowy e-mail"),
  password: z.string().min(6, "Hasło min. 6 znaków"),
  name: z.string().min(2, "Nazwa instytucji min. 2 znaki"),
});

const LoginSchema = z.object({
  email: z.string().email("Nieprawidłowy e-mail"),
  password: z.string().min(1, "Podaj hasło"),
});

router.post("/register", (req, res) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = db.prepare("SELECT id FROM institutions WHERE email = ?").get(body.email);
    if (existing) {
      res.status(409).json({ error: "Konto z tym adresem e-mail już istnieje" });
      return;
    }
    const password_hash = bcrypt.hashSync(body.password, BCRYPT_ROUNDS);
    const ins = db
      .prepare("INSERT INTO institutions (name, email, password_hash) VALUES (?, ?, ?)")
      .run(body.name, body.email, password_hash);
    const id = Number(ins.lastInsertRowid);
    const result = db
      .prepare("SELECT id, name, email FROM institutions WHERE id = ?")
      .get(id) as { id: number; name: string; email: string };
    const token = signInstitutionJwt(result);
    res.status(201).json({ token });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.issues[0]?.message ?? "Walidacja nie powiodła się" });
      return;
    }
    res.status(500).json({ error: "Rejestracja nie powiodła się" });
  }
});

router.post("/login", (req, res) => {
  try {
    const body = LoginSchema.parse(req.body);
    const row = db
      .prepare("SELECT id, name, email, password_hash FROM institutions WHERE email = ?")
      .get(body.email) as
      | { id: number; name: string; email: string; password_hash: string }
      | undefined;
    if (!row || !bcrypt.compareSync(body.password, row.password_hash)) {
      res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło" });
      return;
    }
    const token = signInstitutionJwt({ id: row.id, name: row.name, email: row.email });
    res.json({ token });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: e.issues[0]?.message ?? "Walidacja nie powiodła się" });
      return;
    }
    res.status(500).json({ error: "Logowanie nie powiodło się" });
  }
});

/** Klucz zwracany tylko raz w odpowiedzi; w bazie jest SHA-256. Wymaga JWT (nie `sid_`). */
router.post("/api-key", institutionJwtOnlyMiddleware, (req, res) => {
  const institution = req.institution;
  if (!institution) {
    res.status(401).json({ error: "Brak kontekstu instytucji" });
    return;
  }
  const rawKey = `sid_${randomBytes(16).toString("hex")}`;
  const apiKeyHash = createHash("sha256").update(rawKey, "utf8").digest("hex");
  db.prepare("UPDATE institutions SET api_key_hash = ? WHERE id = ?").run(apiKeyHash, institution.id);
  res.json({ apiKey: rawKey });
});

export default router;
