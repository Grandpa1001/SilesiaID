import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nipRouter from "./routes/nip";
import issueRouter from "./routes/issue";
import verifyRouter from "./routes/verify";
import myCertRouter from "./routes/myCert";
import revokeRouter from "./routes/revoke";
import institutionAuthRouter from "./routes/institutionAuth";
import institutionVerifyRouter from "./routes/institutionVerify";
import { initDB } from "./db/schema";
import { ISSUE_ROUTE_VERSION } from "./issueRouteVersion";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    /** Żeby w DevTools (fetch) było widać nagłówek z wersją ścieżki issue */
    exposedHeaders: ["X-SilesiaID-Issue-Route"],
  })
);
app.use(express.json());

/** Każde żądanie — widać w konsoli, czy frontend w ogóle trafia na ten backend. */
app.use((req, res, next) => {
  const started = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - started;
    console.log(`[http] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`);
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    issueRouteVersion: ISSUE_ROUTE_VERSION,
  });
});

app.use("/api/v1", nipRouter);
app.use("/api/v1", issueRouter);
app.use("/api/v1", verifyRouter);
app.use("/api/v1", myCertRouter);
app.use("/api/v1", revokeRouter);
app.use("/api/v1/institution", institutionAuthRouter);
app.use("/api/v1/institution", institutionVerifyRouter);

initDB();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const has = (k: string) => Boolean(process.env[k]?.trim());
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  SilesiaID backend  ·  http://localhost:${PORT}`);
  console.log(`  cwd (skąd uruchomiono npm)  ${process.cwd()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  NODE_ENV          ${process.env.NODE_ENV ?? "(unset)"}`);
  console.log(`  CORS_ORIGIN       ${process.env.CORS_ORIGIN ?? "(domyślnie *)"} `);
  console.log(`  Baza (DATABASE_URL)  ${process.env.DATABASE_URL ?? "./silesia.db (domyślnie)"}`);
  console.log("  Konfiguracja mint (tylko tak/nie, bez wartości):");
  console.log(`    SEPOLIA_RPC_URL     ${has("SEPOLIA_RPC_URL") ? "✓ ustawione" : "✗ BRAK"}`);
  console.log(`    CONTRACT_ADDRESS    ${has("CONTRACT_ADDRESS") ? "✓ ustawione" : "✗ BRAK"}`);
  console.log(`    DEPLOYER_PRIVATE_KEY ${has("DEPLOYER_PRIVATE_KEY") ? "✓ ustawione" : "✗ BRAK"}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Logi żądań: każda linia [http] METHOD ścieżka → status (czas)");
  console.log("  issue-cert / mint: szukaj też [issue-cert] i [mint] w treści.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
});

export default app;
