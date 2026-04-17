import crypto from "crypto";

export function generateCertId(nip: string): string {
  // Format: 3 litery + 3 cyfry (np. "SIL247")
  const letters = "ABCDEFGHJKLMNPRSTUWXYZ"; // bez I, O, Q, V (mylace)
  const hash = crypto.createHash("sha256").update(nip + Date.now()).digest("hex");
  const l1 = letters[parseInt(hash[0], 16) % letters.length];
  const l2 = letters[parseInt(hash[1], 16) % letters.length];
  const l3 = letters[parseInt(hash[2], 16) % letters.length];
  const n1 = parseInt(hash[3], 16) % 10;
  const n2 = parseInt(hash[4], 16) % 10;
  const n3 = parseInt(hash[5], 16) % 10;
  return `${l1}${l2}${l3}${n1}${n2}${n3}`;
}
