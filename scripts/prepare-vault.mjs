import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = path.resolve(
  projectRoot,
  process.env.NERDBOOK_SOURCE_DIR ?? "work/source-notes",
);
const docxPath = path.join(sourceDir, "NerdBook_IT_v0.1.docx");
const bettercapPath = path.join(sourceDir, "Bettercap_A5_Lab_Flows.txt");
const outputPath = path.resolve(
  projectRoot,
  process.env.NERDBOOK_PRIVATE_DATA ?? "private/notes.json",
);

const decodeEntities = (value) =>
  value
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));

const htmlToText = (html, preserveSpacing) => {
  const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
  const decoded = decodeEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/\r/g, "")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/\u00a0/g, " ");

  if (preserveSpacing) {
    return decoded
      .split("\n")
      .map((line) => line.replace(/[ \t]+$/g, ""))
      .join("\n")
      .trim();
  }

  return decoded.replace(/\s+/g, " ").trim();
};

const classifyParagraph = (className, text) => {
  if (className === "p1") return "title";
  if (className === "p2") return "subtitle";
  if (className === "p3") return "meta";
  if (className === "p8") return "code";
  if (className === "p9") return "diagram";
  if (className === "p7") return "term";
  if (/^\d+\.\d+\.\d+\.\s+/.test(text)) return "subsection";
  if (/^\d+\.\d+\.\s+/.test(text)) return "section";
  if (/^\d+\.\s+/.test(text)) return "chapter";
  if (
    className === "p4" ||
    /^(ZASADY DOKUMENTU|ZASADA LAB-U|SPIS TREŚCI)$/.test(text)
  ) {
    return "section";
  }
  if (className === "p6") return "detail";
  if (/^[A-ZĄĆĘŁŃÓŚŹŻ0-9][A-ZĄĆĘŁŃÓŚŹŻ0-9 /+→|_-]{2,}$/.test(text)) return "label";
  if (text.endsWith(":")) return "label";
  return "paragraph";
};

const parseGeneralNote = (html) => {
  const paragraphs = [];
  const paragraphPattern = /<p class="(p\d+)">([\s\S]*?)<\/p>/gi;
  let match;

  while ((match = paragraphPattern.exec(html)) !== null) {
    const className = match[1];
    const preserveSpacing = className === "p8" || className === "p9";
    const text = htmlToText(match[2], preserveSpacing);
    if (!text) continue;

    const block = { kind: classifyParagraph(className, text), text };
    const previous = paragraphs.at(-1);
    const softContinuation =
      previous &&
      (previous.kind === "paragraph" || previous.kind === "detail") &&
      (block.kind === "paragraph" || block.kind === "detail") &&
      /^[a-ząćęłńóśźż]/.test(block.text) &&
      !/[.!?:;)]$/.test(previous.text);

    if (softContinuation) {
      previous.text = `${previous.text} ${block.text}`;
      continue;
    }

    const groupablePre =
      previous &&
      previous.kind === block.kind &&
      (block.kind === "code" || block.kind === "diagram");
    if (groupablePre) {
      previous.text = `${previous.text}\n${block.text}`;
      continue;
    }

    paragraphs.push(block);
  }

  const chapters = [];
  let current = {
    id: "intro",
    number: "IN",
    title: "Start i zasady LAB-u",
    shortTitle: "Start",
    blocks: [],
  };

  for (const block of paragraphs) {
    if (block.kind === "title" || block.kind === "subtitle") continue;

    if (block.kind === "chapter") {
      if (current.blocks.length) chapters.push(current);
      const chapterMatch = block.text.match(/^(\d+)\.\s*(.+)$/);
      const number = chapterMatch?.[1] ?? String(chapters.length);
      const title = chapterMatch?.[2] ?? block.text;
      current = {
        id: `chapter-${number}`,
        number: number.padStart(2, "0"),
        title,
        shortTitle: title
          .replace(/\s+I\s+TSHARK$/i, "")
          .replace(/\s+I\s+ŚRODOWISKO\s+LAB$/i, "")
          .replace(/\s+NARZĘDZI$/i, ""),
        blocks: [],
      };
      continue;
    }

    current.blocks.push(block);
  }
  if (current.blocks.length) chapters.push(current);

  return {
    id: "nerdbook-it-v01",
    title: "NerdBook IT v0.1",
    kicker: "Podręcznik • dokumentacja • cheat sheet",
    version: "0.1",
    versionDate: "2026-08-15",
    scope: ["Nmap", "Wireshark", "TShark", "Zeek", "Bettercap"],
    sourceFile: "NerdBook_IT_v0.1.docx",
    stats: {
      words: 6820,
      sourceParagraphs: 1456,
      chapters: chapters.length,
      codeBlocks: paragraphs.filter((block) => block.kind === "code").length,
    },
    chapters,
  };
};

const deriveFlowMeta = (name, body) => {
  const searchable = `${name}\n${body}`.toLowerCase();
  const goal = body.match(/^#\s*Cel\s*:\s*(.+)$/im)?.[1]?.trim() ??
    "Procedura zachowana z notatki źródłowej.";
  const requirements = [
    ...(body.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?\b/g) ?? []),
    ...(body.match(/\b[a-z]+\d+\b/gi) ?? []).filter((value) => /^(?:eth|en|wlan)/i.test(value)),
    ...(body.match(/\/[\w./-]+\.pcap\b/g) ?? []),
  ].filter((value, index, values) => values.indexOf(value) === index).slice(0, 4);

  const isWebMitm = /ssl|hsts|http\.proxy/.test(searchable);
  const isDns = /dns\.spoof/.test(searchable);
  const handlesSensitiveData = /regexp|credential|password|passwd/.test(searchable);
  const isBroad = /\/24|internal\s+true/.test(searchable);
  const isActive = /arp\.spoof|dns\.spoof|http\.proxy/.test(searchable);
  const warnings = [];

  if (isBroad) warnings.push("Zakres obejmuje całą podsieć — sprawdź cel przed uruchomieniem.");
  if (/\.pcap/.test(searchable)) warnings.push("Plik PCAP może zawierać dane wrażliwe.");
  if (handlesSensitiveData) warnings.push("Workflow przetwarza dane uwierzytelniające; używaj wyłącznie w autoryzowanym LAB-ie.");

  return {
    category: isWebMitm
      ? "MITM i ruch webowy"
      : isDns
        ? "DNS i scenariusze testowe"
        : handlesSensitiveData
          ? "Analiza danych wrażliwych"
          : "Discovery i monitoring",
    goal,
    mode: isActive ? "Aktywny LAB" : "Monitoring",
    risk: isWebMitm || isDns || handlesSensitiveData || isBroad ? "critical" : "high",
    requirements: requirements.length ? requirements : ["izolowany LAB"],
    warnings,
    firstPhase: "Konfiguracja i uruchomienie",
    cleanupId: /hsts/i.test(name) ? "clean-hsts" : "clean-universal",
  };
};

const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const stripInlineComment = (line) => line.replace(/\s+#\s+.*$/, "").trim();

const parseOneLiners = (lines) => {
  const remaining = [];
  const oneLiners = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const marker = line.match(/^#\s*One-liner(?:\s*\((.*?)\))?\s*:\s*$/i);
    if (!marker) {
      remaining.push(line);
      continue;
    }

    let commandIndex = index + 1;
    while (commandIndex < lines.length && !lines[commandIndex].trim()) commandIndex += 1;
    if (commandIndex < lines.length) {
      oneLiners.push({
        label: marker[1] ? marker[1].replace(/^dla\s+/i, "") : "One-liner",
        command: lines[commandIndex].trim(),
        generated: false,
      });
      index = commandIndex;
    }
  }

  return { remaining, oneLiners };
};

const buildPhases = (name, lines, firstPhase) => {
  const phases = [];
  let current = { title: firstPhase ?? "Kroki", lines: [] };

  const flush = () => {
    const code = current.lines.join("\n").trim();
    if (code) phases.push({ title: current.title, code });
  };

  for (const line of lines) {
    if (/^#\s*Cel\s*:/i.test(line)) continue;
    const numbered = line.match(/^#\s*\d+\.\s*(.+)$/);
    if (numbered) {
      flush();
      current = { title: numbered[1].trim(), lines: [] };
      continue;
    }
    current.lines.push(line);
  }
  flush();

  return phases.length ? phases : [{ title: firstPhase ?? name, code: lines.join("\n").trim() }];
};

const parseBettercap = (source) => {
  const normalized = source.replace(/\u2028|\u2029/g, "\n").replace(/\r\n?/g, "\n").trim();
  const sectionPattern = /^\*\*\*\s*(.*?)\s*\*\*\*\s*$/gm;
  const matches = [...normalized.matchAll(sectionPattern)];
  const sections = matches.map((entry, index) => ({
    name: entry[1].trim(),
    body: normalized.slice(entry.index + entry[0].length, matches[index + 1]?.index ?? normalized.length).trim(),
  }));

  const cleanupSections = sections.filter((section) => /CLEAN/i.test(section.name));
  const cleanups = cleanupSections.map((section) => {
    const isHsts = /HSTS/i.test(section.name);
    return {
      id: isHsts ? "clean-hsts" : "clean-universal",
      title: isHsts ? "CLEAN dla HSTS" : "Uniwersalny CLEAN",
      scope: isHsts ? "Sesja HSTS / HTTP proxy" : "Wszystkie workflowy — zapis źródłowy",
      command: section.body
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"))
        .join(" ")
        .trim(),
      warnings: isHsts
        ? ["Sprawdź pisownię i dostępność capletu przed uruchomieniem cleanupu."]
        : [
            "Zweryfikuj, czy cleanup wyłącza wszystkie moduły użyte w danym workflowie.",
            "Oddziel polecenia konsoli narzędzia od poleceń powłoki systemowej.",
          ],
    };
  });

  const flows = sections
    .filter((section) => !/CLEAN/i.test(section.name))
    .map((section, index) => {
      const meta = deriveFlowMeta(section.name, section.body);
      const lines = section.body.split("\n").map((line) => line.replace(/[ \t]+$/g, ""));
      const parsed = parseOneLiners(lines);
      const phases = buildPhases(section.name, parsed.remaining, meta.firstPhase);
      const oneLiners = [...parsed.oneLiners];

      if (!oneLiners.length) {
        const command = phases
          .flatMap((phase) => phase.code.split("\n"))
          .map((line) => stripInlineComment(line))
          .filter((line) => line && !line.startsWith("#"))
          .join("; ");
        oneLiners.push({ label: "Z kroków źródłowych", command, generated: true });
      }

      return {
        id: slugify(section.name),
        number: String(index + 1).padStart(2, "0"),
        title: section.name,
        category: meta.category,
        goal: meta.goal,
        mode: meta.mode,
        risk: meta.risk,
        requirements: meta.requirements,
        warnings: meta.warnings,
        cleanupId: meta.cleanupId ?? "clean-universal",
        phases,
        oneLiners,
      };
    });

  return {
    id: "bettercap-a5-lab-flows",
    title: "Bettercap — A5 Lab Flows",
    kicker: "Runbook • 7 workflowów • 2 procedury CLEAN",
    sourceFile: "Bettercap_A5_Lab_Flows.txt",
    labNotice:
      "Uruchamiaj wyłącznie we własnym, odizolowanym LAB-ie albo w sieci, dla której masz jednoznaczną zgodę. Przechwycony ruch i pliki PCAP traktuj jak dane wrażliwe.",
    flows,
    cleanups,
  };
};

const generalHtml = execFileSync(
  "textutil",
  ["-convert", "html", "-stdout", docxPath],
  { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
);
const bettercapSource = await readFile(bettercapPath, "utf8");

const data = {
  schemaVersion: 1,
  generatedAt: "2026-08-24",
  identity: {
    name: "NerdBook",
    title: "Private Knowledge Vault",
    description: "Prywatny notes techniczny: dokumentacja, runbooki i cheat sheety.",
  },
  general: parseGeneralNote(generalHtml),
  bettercap: parseBettercap(bettercapSource),
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(`Prepared private note data: ${path.relative(projectRoot, outputPath)}`);
