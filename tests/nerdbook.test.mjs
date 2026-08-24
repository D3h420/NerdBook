import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  return readFile(new URL("../out/index.html", import.meta.url), "utf8");
}

test("renders the encrypted NerdBook gate", async () => {
  const html = await render();
  assert.match(html, /<html lang="pl"/i);
  assert.match(html, /<title>NerdBook \/\/ External Memory Buffer<\/title>/i);
  assert.match(html, /An external memory buffer for forgotten commands/i);
  assert.doesNotMatch(html, /PRIVATE KNOWLEDGE VAULT|PRIVATE VAULT/i);
  assert.match(html, /Fraza dostępu/);
  assert.match(html, /type="password"/);
  assert.match(html, /AES-256-GCM/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.match(html, /_next\/static\//);

  // Locked HTML may contain ciphertext, but never searchable note content.
  assert.doesNotMatch(html, /set arp\.spoof|nmap\s+-|password\|passwd/i);
});

test("keeps source notes out of the published application", async () => {
  const [packageJson, vault, page, layout, app, importer] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/data/vault.json", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/NerdBookApp.tsx", import.meta.url), "utf8"),
    readFile(new URL("../scripts/prepare-vault.mjs", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(vault, /"name": "PBKDF2"/);
  assert.match(vault, /"name": "AES-GCM"/);
  assert.doesNotMatch(vault, /"schemaVersion"|"chapters"|"flows"/i);
  assert.match(page, /<NerdBookApp \/>/);
  assert.match(layout, /lang="pl"/);
  assert.match(app, /aria-label="Drzewo notatek"/);
  assert.match(app, /general: true, bettercap: true/);
  assert.doesNotMatch(app, /nav-label-spaced|>RUNBOOKS</);
  for (const chapterId of ["chapter-5", "chapter-6", "chapter-7", "chapter-8"]) {
    assert.match(importer, new RegExp(`"${chapterId}"`));
  }
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("../work", import.meta.url).pathname + "/published"));
});
