import { createPublicClient, createWalletClient, http, keccak256, toHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

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
] as const;

function normalizePrivateKey(key: string): `0x${string}` {
  return (key.startsWith("0x") ? key : `0x${key}`) as `0x${string}`;
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

  const hash = await wallet.writeContract({
    address,
    abi: ABI,
    functionName: "mint",
    args: [walletAddress as `0x${string}`, nipHash, krsHash, trustLevel, certId],
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
