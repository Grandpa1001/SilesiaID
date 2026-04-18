/// <reference path="../types/express.d.ts" />
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { db } from "../db/schema";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-change-me";

export function signInstitutionJwt(payload: { id: number; name: string; email: string }): string {
  return jwt.sign(
    { id: payload.id, name: payload.name, email: payload.email, role: "institution" },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function attachInstitutionFromJwt(req: Request, token: string): boolean {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
      id?: number;
      name?: string;
      email?: string;
      role?: string;
    };
    if (payload.role !== "institution" || typeof payload.id !== "number") {
      return false;
    }
    req.institution = {
      id: payload.id,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
    return true;
  } catch {
    return false;
  }
}

/** JWT lub klucz API `sid_...` (np. dla GET /lookup). */
export function institutionAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers.authorization;
  if (!raw?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Brak tokenu" });
    return;
  }
  const token = raw.slice(7).trim();

  if (token.startsWith("sid_")) {
    const hash = createHash("sha256").update(token, "utf8").digest("hex");
    const row = db
      .prepare("SELECT id, name, email FROM institutions WHERE api_key_hash = ?")
      .get(hash) as { id: number; name: string; email: string } | undefined;
    if (!row) {
      res.status(401).json({ error: "Nieprawidłowy klucz API" });
      return;
    }
    req.institution = { id: row.id, name: row.name, email: row.email };
    next();
    return;
  }

  if (!attachInstitutionFromJwt(req, token)) {
    res.status(401).json({ error: "Nieprawidłowy lub wygasły token" });
    return;
  }
  next();
}

/** Tylko sesja JWT (np. generowanie klucza API — nie przyjmujemy `sid_`). */
export function institutionJwtOnlyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const raw = req.headers.authorization;
  if (!raw?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Brak tokenu" });
    return;
  }
  const token = raw.slice(7).trim();
  if (token.startsWith("sid_")) {
    res.status(403).json({
      error: "Ten endpoint wymaga tokenu JWT po zalogowaniu, a nie klucza API",
    });
    return;
  }
  if (!attachInstitutionFromJwt(req, token)) {
    res.status(401).json({ error: "Nieprawidłowy lub wygasły token" });
    return;
  }
  next();
}
