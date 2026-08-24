import {
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
  randomBytes,
} from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const operation = process.argv[2];
const password = process.env.NERDBOOK_PASSWORD?.normalize("NFKC");
const iterations = 310_000;

if (!password) {
  console.error("Set NERDBOOK_PASSWORD before encrypting or decrypting the vault.");
  process.exit(1);
}

const sourcePath = path.resolve(
  projectRoot,
  process.env.NERDBOOK_PRIVATE_DATA ?? "private/notes.json",
);
const vaultPath = path.resolve(
  projectRoot,
  process.env.NERDBOOK_VAULT_FILE ?? "app/data/vault.json",
);

const encrypt = async () => {
  const plaintext = await readFile(sourcePath);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const payload = Buffer.concat([encrypted, cipher.getAuthTag()]);

  const envelope = {
    version: 1,
    kdf: {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: salt.toString("base64"),
    },
    cipher: {
      name: "AES-GCM",
      iv: iv.toString("base64"),
    },
    payload: payload.toString("base64"),
  };

  await mkdir(path.dirname(vaultPath), { recursive: true });
  await writeFile(vaultPath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  console.log(`Encrypted vault: ${path.relative(projectRoot, vaultPath)}`);
};

const decrypt = async () => {
  const envelope = JSON.parse(await readFile(vaultPath, "utf8"));
  const salt = Buffer.from(envelope.kdf.salt, "base64");
  const iv = Buffer.from(envelope.cipher.iv, "base64");
  const payload = Buffer.from(envelope.payload, "base64");
  const encrypted = payload.subarray(0, -16);
  const tag = payload.subarray(-16);
  const key = pbkdf2Sync(password, salt, envelope.kdf.iterations, 32, "sha256");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  await mkdir(path.dirname(sourcePath), { recursive: true });
  await writeFile(sourcePath, plaintext);
  console.log(`Decrypted private data: ${path.relative(projectRoot, sourcePath)}`);
};

if (operation === "encrypt") await encrypt();
else if (operation === "decrypt") await decrypt();
else {
  console.error("Usage: node scripts/vault.mjs <encrypt|decrypt>");
  process.exit(1);
}
