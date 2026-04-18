import { db } from "../db/schema";
import { findMintTxHashByCertId } from "./blockchain";

/**
 * Jeśli w bazie brak tx_hash, próbuje znaleźć transakcję mint po evencie IdentityIssued na Sepolii
 * i zapisuje hash w SQLite.
 */
export async function backfillTxHashIfMissing(certId: string, existingTx: string | null): Promise<string | null> {
  if (existingTx) return existingTx;
  const found = await findMintTxHashByCertId(certId);
  if (found) {
    db.prepare("UPDATE certs SET tx_hash = ? WHERE cert_id = ?").run(found, certId);
    console.log("[certTxSync] dopisano tx_hash z łańcucha", { certId, txHash: found });
  }
  return found ?? null;
}
