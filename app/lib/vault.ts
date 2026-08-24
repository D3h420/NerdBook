import type { VaultData, VaultEnvelope } from "../types";

const base64ToBytes = (value: string) => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export async function unlockVault(
  envelope: VaultEnvelope,
  password: string,
): Promise<VaultData> {
  const normalizedPassword = password.normalize("NFKC");
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalizedPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: envelope.kdf.hash,
      salt: base64ToBytes(envelope.kdf.salt),
      iterations: envelope.kdf.iterations,
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.cipher.iv) },
    key,
    base64ToBytes(envelope.payload),
  );
  const data = JSON.parse(new TextDecoder().decode(decrypted)) as VaultData;

  if (data.schemaVersion !== 1) {
    throw new Error("Unsupported NerdBook vault version.");
  }

  return data;
}
