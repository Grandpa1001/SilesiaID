import { createPublicClient, createWalletClient, http, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const IDENTITY_ISSUED_EVENT_ABI = [
  {
    type: "event",
    name: "IdentityIssued",
    inputs: [
      { name: "tokenId", type: "uint256", indexed: true },
      { name: "certId", type: "string", indexed: true },
      { name: "wallet", type: "address", indexed: true },
      { name: "trustLevel", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

const ABI = [
  {
    name: "mint",
    type: "function",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "nipHash", type: "bytes32" },
      { name: "krsHash", type: "bytes32" },
      { name: "trustLevel", type: "uint8" },
      { name: "certId", type: "string" },
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    name: "getIdentityByCertId",
    type: "function",
    inputs: [{ name: "certId", type: "string" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "nipHash", type: "bytes32" },
          { name: "krsHash", type: "bytes32" },
          { name: "trustLevel", type: "uint8" },
          { name: "isActive", type: "bool" },
          { name: "issuedAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "certId", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    name: "revoke",
    type: "function",
    inputs: [{ name: "certId", type: "string" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    name: "walletToTokenId",
    type: "function",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    name: "identities",
    type: "function",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "nipHash", type: "bytes32" },
          { name: "krsHash", type: "bytes32" },
          { name: "trustLevel", type: "uint8" },
          { name: "isActive", type: "bool" },
          { name: "issuedAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "certId", type: "string" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;

function normalizePrivateKey(key: string): `0x${string}` {
  return (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
}

/** Odczyt z łańcucha bez klucza mintera (logi, eventy). */
function getPublicReadOnly() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "";
  const address = (process.env.CONTRACT_ADDRESS || "") as `0x${string}`;
  if (!rpcUrl || !address) return null;
  const pub = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });
  return { pub, address };
}

function getClients() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL || "";
  const privateKeyRaw = process.env.DEPLOYER_PRIVATE_KEY || "";
  const address = (process.env.CONTRACT_ADDRESS || "") as `0x${string}`;

  if (!rpcUrl || !privateKeyRaw || !address) {
    throw new Error("Brak konfiguracji blockchain (SEPOLIA_RPC_URL / DEPLOYER_PRIVATE_KEY / CONTRACT_ADDRESS)");
  }

  const account = privateKeyToAccount(normalizePrivateKey(privateKeyRaw));
  const wallet = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
  const pub = createPublicClient({ chain: sepolia, transport: http(rpcUrl) });

  return { wallet, pub, account, address };
}

/**
 * Szuka transakcji mint dla danego certId po evencie IdentityIssued (Sepolia).
 */
/**
 * Jeśli portfel ma NFT SilesiaID na łańcuchu, zwraca certId z kontraktu (bez bazy).
 */
export async function getCertIdForWalletFromChain(walletAddress: `0x${string}`): Promise<string | null> {
  const ctx = getPublicReadOnly();
  if (!ctx) return null;
  try {
    const tokenId = await ctx.pub.readContract({
      address: ctx.address,
      abi: ABI,
      functionName: "walletToTokenId",
      args: [walletAddress],
    });
    if (tokenId === 0n) return null;
    const identity = await ctx.pub.readContract({
      address: ctx.address,
      abi: ABI,
      functionName: "identities",
      args: [tokenId],
    });
    return identity.certId;
  } catch (e) {
    console.error("[getCertIdForWalletFromChain]", e);
    return null;
  }
}

/**
 * Alchemy Free: eth_getLogs max ~10 bloków na zapytanie. Skanujemy od najnowszego w dół w oknach.
 * PAYG / inny RPC: ustaw ETH_GET_LOGS_BLOCK_RANGE (np. 2000).
 */
export async function findMintTxHashByCertId(certId: string): Promise<string | null> {
  const ctx = getPublicReadOnly();
  if (!ctx) {
    console.warn("[findMintTxHashByCertId] brak SEPOLIA_RPC_URL lub CONTRACT_ADDRESS");
    return null;
  }
  const deployFrom = BigInt(process.env.CONTRACT_DEPLOY_FROM_BLOCK || "0");
  const windowSize = BigInt(process.env.ETH_GET_LOGS_BLOCK_RANGE || "10");
  const maxWindows = Math.max(1, Number(process.env.ETH_GET_LOGS_MAX_WINDOWS || "50000"));

  try {
    const latest = await ctx.pub.getBlockNumber();
    let toBlock = latest;
    let windows = 0;

    while (toBlock >= deployFrom && windows < maxWindows) {
      windows++;
      const span = toBlock - deployFrom + 1n;
      const fromBlock =
        span > windowSize ? toBlock - (windowSize - 1n) : deployFrom;

      const logs = await ctx.pub.getContractEvents({
        address: ctx.address,
        abi: IDENTITY_ISSUED_EVENT_ABI,
        eventName: "IdentityIssued",
        args: { certId },
        fromBlock,
        toBlock,
      });

      if (logs.length > 0) {
        return logs[logs.length - 1].transactionHash;
      }

      if (fromBlock <= deployFrom) break;
      toBlock = fromBlock - 1n;
    }

    return null;
  } catch (e) {
    console.error("[findMintTxHashByCertId]", e);
    return null;
  }
}

export async function mintCertificate(
  walletAddress: string,
  nip: string,
  krsNumber: string | null,
  trustLevel: number,
  certId: string
): Promise<string> {
  const { wallet, pub, account, address } = getClients();

  const nipHash = keccak256(toHex(nip));
  const krsHash = krsNumber ? keccak256(toHex(krsNumber)) : (`0x${"00".repeat(32)}` as `0x${string}`);

  console.log("[mint] start", {
    contract: address,
    minter: account.address,
    recipient: walletAddress,
    certId,
    nip,
    trustLevel,
    krsPresent: krsNumber != null,
  });

  const hash = await wallet.writeContract({
    address,
    abi: ABI,
    functionName: "mint",
    args: [walletAddress as `0x${string}`, nipHash, krsHash, trustLevel, certId],
    account,
  });

  if (!hash || typeof hash !== "string" || !hash.startsWith("0x")) {
    throw new Error("[mint] writeContract nie zwrócił prawidłowego hash transakcji — sprawdź RPC i konfigurację.");
  }

  console.log("[mint] tx wysłane", { hash });

  const receipt = await pub.waitForTransactionReceipt({ hash });

  console.log("[mint] receipt", {
    hash,
    status: receipt.status,
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
  });

  if (receipt.status !== "success") {
    throw new Error(`[mint] transakcja nieudana (status: ${receipt.status})`);
  }

  return hash;
}

export async function revokeCertificateOnChain(certId: string): Promise<string> {
  const { wallet, pub, account, address } = getClients();
  const hash = await wallet.writeContract({
    address,
    abi: ABI,
    functionName: "revoke",
    args: [certId],
    account,
  });
  await pub.waitForTransactionReceipt({ hash });
  return hash;
}

export async function verifyOnChain(certId: string) {
  const { pub, address } = getClients();
  try {
    const identity = await pub.readContract({
      address,
      abi: ABI,
      functionName: "getIdentityByCertId",
      args: [certId],
    });
    return identity;
  } catch {
    return null;
  }
}
