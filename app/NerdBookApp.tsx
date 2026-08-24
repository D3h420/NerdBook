"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import vaultJson from "./data/vault.json";
import { unlockVault } from "./lib/vault";
import type {
  BettercapFlow,
  CleanupProcedure,
  GeneralBlock,
  GeneralChapter,
  NotebookView,
  RiskLevel,
  VaultData,
  VaultEnvelope,
} from "./types";

const vaultEnvelope = vaultJson as VaultEnvelope;

const riskLabel: Record<RiskLevel, string> = {
  medium: "Umiarkowany",
  high: "Wysoki",
  critical: "Krytyczny",
};

type SearchHit = {
  key: string;
  eyebrow: string;
  title: string;
  context: string;
  view: NotebookView;
};

function TerminalGate({ onUnlock }: { onUnlock: (data: VaultData) => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"locked" | "unlocking" | "granted">("locked");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => inputRef.current?.focus(), reducedMotion ? 0 : 900);
    return () => window.clearTimeout(timeout);
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!password || status === "unlocking") return;

    if (!window.crypto?.subtle) {
      setError("WEB CRYPTO UNAVAILABLE // użyj aktualnej przeglądarki przez HTTPS");
      return;
    }

    setError("");
    setStatus("unlocking");

    try {
      const data = await unlockVault(vaultEnvelope, password);
      setPassword("");
      setStatus("granted");
      window.setTimeout(() => onUnlock(data), 420);
    } catch {
      setStatus("locked");
      setError("ACCESS DENIED // nieprawidłowa fraza dostępu");
      inputRef.current?.select();
    }
  };

  return (
    <main className="terminal-gate">
      <div className="crt-noise" aria-hidden="true" />
      <section className="terminal-window" aria-labelledby="gate-title">
        <header className="terminal-chrome">
          <div className="terminal-lights" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p>nerdbook://memory-buffer/session-01</p>
          <span className="terminal-signal">● encrypted</span>
        </header>

        <div className="terminal-body">
          <div className="boot-log" aria-hidden="true">
            <p className="boot-line boot-line-1"><span>[00.014]</span> mounting local interface...</p>
            <p className="boot-line boot-line-2"><span>[00.082]</span> web crypto provider <b>OK</b></p>
            <p className="boot-line boot-line-3"><span>[00.190]</span> encrypted payload detected</p>
            <p className="boot-line boot-line-4"><span>[00.241]</span> waiting for operator key_</p>
          </div>

          <div className="terminal-brand">
            <p className="terminal-overline">{"// PERSONAL KNOWLEDGE SYSTEM"}</p>
            <h1 id="gate-title">NERD<span>BOOK</span></h1>
            <p className="terminal-subtitle">
              An external memory buffer for forgotten commands, questionable workflows and things that worked once. Probably important.
            </p>
          </div>

          <form className="unlock-form" onSubmit={submit} aria-busy={status === "unlocking"}>
            <label htmlFor="vault-password">Fraza dostępu</label>
            <div className="terminal-input-row">
              <span className="prompt" aria-hidden="true">buffer@nerdbook:~$</span>
              <input
                ref={inputRef}
                id="vault-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                spellCheck={false}
                aria-describedby="vault-help vault-status"
                disabled={status !== "locked"}
              />
              <button
                className="reveal-button"
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ukryj frazę dostępu" : "Pokaż frazę dostępu"}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <div className="unlock-actions">
              <p id="vault-help">AES-256-GCM // odszyfrowanie odbywa się lokalnie w tej karcie</p>
              <button className="unlock-button" type="submit" disabled={!password || status !== "locked"}>
                {status === "unlocking" ? "DECRYPTING..." : status === "granted" ? "BUFFER MOUNTED" : "MOUNT NOTES →"}
              </button>
            </div>
            <p
              id="vault-status"
              className={`gate-status ${error ? "is-error" : status === "granted" ? "is-success" : ""}`}
              role={error ? "alert" : "status"}
              aria-live="polite"
            >
              {error || (status === "granted" ? "BUFFER MOUNTED // ładowanie notesu..." : "STATUS // MEMORY OFFLINE")}
            </p>
          </form>
        </div>

        <footer className="terminal-footer">
          <span>PBKDF2 / SHA-256 / {vaultEnvelope.kdf.iterations.toLocaleString("pl-PL")} iteracji</span>
          <span>NO PLAINTEXT STORAGE</span>
        </footer>
      </section>
      <p className="gate-footnote">NerdBook v0.1 · własny, odizolowany LAB</p>
    </main>
  );
}

function CopyCommand({
  command,
  label = "One-liner",
  note,
}: {
  command: string;
  label?: string;
  note?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setCopied(true);
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="command-box" aria-label={`${label}: komenda do skopiowania`}>
      <header>
        <div>
          <span className="command-dot" aria-hidden="true" />
          <strong># {label}</strong>
          {note ? <small>{note}</small> : null}
        </div>
        <button type="button" onClick={copy} aria-label={`Kopiuj całą komendę: ${label}`}>
          <span aria-hidden="true">{copied ? "✓" : "□"}</span>
          {copied ? "Skopiowano" : "Kopiuj całość"}
        </button>
      </header>
      <pre tabIndex={0}><code>{command}</code></pre>
      <p className="sr-only" aria-live="polite">{copied ? "Komenda została skopiowana do schowka." : ""}</p>
    </section>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`risk-badge risk-${risk}`}>Ryzyko: {riskLabel[risk]}</span>;
}

function LabNotice({ children }: { children: ReactNode }) {
  return (
    <aside className="lab-notice">
      <span className="notice-mark" aria-hidden="true">!</span>
      <div>
        <strong>LAB ONLY // AUTORYZOWANE ŚRODOWISKO</strong>
        <p>{children}</p>
      </div>
    </aside>
  );
}

function renderLinkedText(text: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  return text.split(urlPattern).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">
        {part}<span className="external-mark" aria-hidden="true"> ↗</span>
      </a>
    ) : (
      part
    ),
  );
}

function GeneralBlockView({ block, index }: { block: GeneralBlock; index: number }) {
  const anchor = `section-${index}`;

  switch (block.kind) {
    case "section":
      return <h2 id={anchor}>{block.text}</h2>;
    case "subsection":
      return <h3 id={anchor}>{block.text}</h3>;
    case "term":
      return <p className="term-label">{block.text}</p>;
    case "label":
      return <p className="reader-label">{block.text}</p>;
    case "detail":
      return <p className="reader-detail"><span aria-hidden="true">›</span>{renderLinkedText(block.text)}</p>;
    case "meta":
      return <p className="reader-meta">{block.text}</p>;
    case "code":
      return <pre className="reader-code" tabIndex={0}><code>{block.text}</code></pre>;
    case "diagram":
      return <pre className="reader-diagram" tabIndex={0}>{block.text}</pre>;
    default:
      return <p>{renderLinkedText(block.text)}</p>;
  }
}

function GeneralReader({
  chapter,
  noteTitle,
  onOpenFlows,
}: {
  chapter: GeneralChapter;
  noteTitle: string;
  onOpenFlows: () => void;
}) {
  const localHeadings = chapter.blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block }) => block.kind === "section" || block.kind === "subsection")
    .slice(0, 18);

  return (
    <div className="reader-layout">
      <article className="note-reader">
        <header className="reader-header">
          <p className="breadcrumb">{noteTitle} <span>/</span> {chapter.number}</p>
          <div className="reader-index">{chapter.number}</div>
          <p className="eyebrow">HANDBOOK CHAPTER</p>
          <h1>{chapter.title}</h1>
          <div className="reader-meta-row">
            <span>{chapter.blocks.length} bloków</span>
            <span>v0.1</span>
            <span>2026-08-15</span>
          </div>
        </header>

        {chapter.id === "intro" || chapter.id === "chapter-0" ? (
          <LabNotice>
            Skanuj i przechwytuj wyłącznie systemy oraz sieci, do których masz zgodę. Pliki PCAP i logi traktuj jak dane wrażliwe.
          </LabNotice>
        ) : null}

        {chapter.blocks.map((block, index) => (
          <GeneralBlockView key={`${block.kind}-${index}-${block.text.slice(0, 16)}`} block={block} index={index} />
        ))}

        {chapter.id === "chapter-4" ? (
          <button className="cross-note-link" type="button" onClick={onOpenFlows}>
            <span>Powiązana notatka</span>
            <strong>Otwórz Bettercap — A5 Lab Flows</strong>
            <span aria-hidden="true">→</span>
          </button>
        ) : null}
      </article>

      {localHeadings.length ? (
        <aside className="local-toc" aria-label="Spis sekcji w rozdziale">
          <p>NA TEJ STRONIE</p>
          <nav>
            {localHeadings.map(({ block, index }) => (
              <a
                className={block.kind === "subsection" ? "toc-subsection" : ""}
                href={`#section-${index}`}
                key={`${block.text}-${index}`}
              >
                {block.text.replace(/^\d+(?:\.\d+){1,2}\.\s*/, "")}
              </a>
            ))}
          </nav>
        </aside>
      ) : null}
    </div>
  );
}

function CleanupPanel({ cleanup }: { cleanup: CleanupProcedure }) {
  return (
    <section className="cleanup-panel">
      <header>
        <span className="cleanup-icon" aria-hidden="true">×</span>
        <div>
          <p>POWIĄZANA PROCEDURA STOP</p>
          <h2>{cleanup.title}</h2>
        </div>
      </header>
      <p className="cleanup-scope">{cleanup.scope}</p>
      <CopyCommand command={cleanup.command} label="Cleanup — zapis źródłowy" />
      <ul className="warning-list">
        {cleanup.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </section>
  );
}

function FlowReader({ flow, cleanup }: { flow: BettercapFlow; cleanup?: CleanupProcedure }) {
  return (
    <article className="flow-reader">
      <header className="flow-header">
        <p className="breadcrumb">Bettercap / A5 Lab Flows <span>/</span> {flow.number}</p>
        <div className="flow-number">FLOW {flow.number}</div>
        <p className="eyebrow">{flow.category}</p>
        <h1>{flow.title}</h1>
        <p className="flow-goal">{flow.goal}</p>
        <div className="flow-badges">
          <span className="mode-badge">{flow.mode}</span>
          <RiskBadge risk={flow.risk} />
          <span className="lab-badge">LAB ONLY</span>
        </div>
      </header>

      <LabNotice>
        Wykonuj tylko we własnym, izolowanym środowisku lub po uzyskaniu jednoznacznej zgody. Zapis źródłowy nie został po cichu „naprawiony”.
      </LabNotice>

      <section className="requirements-section">
        <p className="section-kicker">PARAMETRY ZE ŹRÓDŁA</p>
        <div className="requirement-chips">
          {flow.requirements.map((requirement) => <code key={requirement}>{requirement}</code>)}
        </div>
      </section>

      <section className="phases-section">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">SEKWENCJA</p>
            <h2>Kroki workflowu</h2>
          </div>
          <span>{flow.phases.length.toString().padStart(2, "0")} faz</span>
        </div>
        <div className="phase-list">
          {flow.phases.map((phase, index) => (
            <section className="phase-card" key={`${phase.title}-${index}`}>
              <header>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{phase.title}</h3>
              </header>
              <pre tabIndex={0}><code>{phase.code}</code></pre>
            </section>
          ))}
        </div>
      </section>

      <section className="one-liners-section">
        <div className="section-heading-row">
          <div>
            <p className="section-kicker">QUICK EXECUTE</p>
            <h2>One-liner{flow.oneLiners.length > 1 ? "y" : ""}</h2>
          </div>
          <span>kopiuj 1:1</span>
        </div>
        {flow.oneLiners.map((oneLiner) => (
          <CopyCommand
            key={`${oneLiner.label}-${oneLiner.command}`}
            command={oneLiner.command}
            label={oneLiner.label}
            note={oneLiner.generated ? "złożony z kroków źródłowych" : "oryginał"}
          />
        ))}
      </section>

      <aside className="verification-notes">
        <p className="section-kicker">UWAGI / DO WERYFIKACJI</p>
        <ul>
          {flow.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      </aside>

      {cleanup ? <CleanupPanel cleanup={cleanup} /> : null}
    </article>
  );
}

function BettercapOverview({
  data,
  onOpenFlow,
  onOpenCleanup,
}: {
  data: VaultData["bettercap"];
  onOpenFlow: (id: string) => void;
  onOpenCleanup: (id: string) => void;
}) {
  const groups = data.flows.reduce<Record<string, BettercapFlow[]>>((result, flow) => {
    (result[flow.category] ??= []).push(flow);
    return result;
  }, {});

  return (
    <article className="bettercap-overview">
      <header className="collection-header">
        <p className="breadcrumb">NerdBook <span>/</span> Bettercap</p>
        <p className="eyebrow">OPERATIONAL NOTE // A5 LAB</p>
        <h1>{data.title}</h1>
        <p>{data.kicker}</p>
      </header>
      <LabNotice>{data.labNotice}</LabNotice>

      <div className="collection-stats">
        <div><strong>{data.flows.length}</strong><span>workflowów</span></div>
        <div><strong>{data.cleanups.length}</strong><span>procedury CLEAN</span></div>
        <div><strong>1:1</strong><span>komendy źródłowe</span></div>
      </div>

      {Object.entries(groups).map(([category, flows]) => (
        <section className="flow-group" key={category}>
          <header>
            <p>{category}</p>
            <span>{flows.length.toString().padStart(2, "0")}</span>
          </header>
          <div className="flow-card-grid">
            {flows.map((flow) => (
              <button className="flow-card" type="button" key={flow.id} onClick={() => onOpenFlow(flow.id)}>
                <span className="flow-card-number">{flow.number}</span>
                <div>
                  <h2>{flow.title}</h2>
                  <p>{flow.goal}</p>
                  <div><span>{flow.mode}</span><RiskBadge risk={flow.risk} /></div>
                </div>
                <span className="card-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="cleanup-index">
        <p className="section-kicker">PROCEDURY STOP</p>
        <div>
          {data.cleanups.map((cleanup) => (
            <button type="button" key={cleanup.id} onClick={() => onOpenCleanup(cleanup.id)}>
              <span aria-hidden="true">×</span>
              <div><strong>{cleanup.title}</strong><small>{cleanup.scope}</small></div>
              <span aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      </section>
    </article>
  );
}

function Dashboard({ data, navigate }: { data: VaultData; navigate: (view: NotebookView) => void }) {
  const firstFlow = data.bettercap.flows[0];
  const firstChapter = data.general.chapters[0];
  const zeek = data.general.chapters.find((chapter) => chapter.id === "chapter-3");
  const indexedItems = data.general.chapters.length + data.bettercap.flows.length + data.bettercap.cleanups.length;

  return (
    <article className="dashboard">
      <header className="dashboard-hero">
        <div>
          <p className="eyebrow">MEMORY MAPPED // SESSION LOCAL</p>
          <h1>Twoja techniczna<br /><span>pamięć operacyjna.</span></h1>
          <p className="dashboard-lead">
            Zewnętrzny bufor pamięci dla zapomnianych komend, podejrzanych workflowów i rzeczy, które kiedyś zadziałały. Prawdopodobnie ważne.
          </p>
        </div>
        <div className="collection-summary" aria-label={`Kolekcja zawiera 2 notatki i ${indexedItems} pozycji w indeksie`}>
          <p className="summary-label">COLLECTION // INDEXED</p>
          <div className="summary-count">
            <strong>02</strong>
            <span>NOTATKI</span>
          </div>
          <div className="summary-categories">
            <div><span>01</span><strong>HANDBOOK</strong></div>
            <div><span>01</span><strong>LAB FLOWS</strong></div>
          </div>
          <footer><span>{indexedItems.toString().padStart(2, "0")} pozycji</span><span>LOCAL DECRYPT</span></footer>
        </div>
      </header>

      <LabNotice>{data.bettercap.labNotice}</LabNotice>

      <section className="dashboard-section">
        <header className="section-heading-row">
          <div><p className="section-kicker">COLLECTION / 02</p><h2>Notatki w buforze</h2></div>
          <span>zaktualizowano {data.generatedAt}</span>
        </header>
        <div className="note-card-grid">
          <button className="note-card note-card-handbook" type="button" onClick={() => navigate({ kind: "general", id: firstChapter.id })}>
            <div className="note-card-top"><span>01 / HANDBOOK</span><span>v{data.general.version}</span></div>
            <h3>{data.general.title}</h3>
            <p>{data.general.kicker}</p>
            <div className="note-card-stats"><span>{data.general.stats.words.toLocaleString("pl-PL")} słów</span><span>{data.general.chapters.length} rozdziałów</span></div>
            <span className="note-card-cta">Otwórz podręcznik <b>→</b></span>
          </button>
          <button className="note-card note-card-runbook" type="button" onClick={() => navigate({ kind: "bettercap" })}>
            <div className="note-card-top"><span>02 / LAB NOTE</span><span>LAB ONLY</span></div>
            <h3>{data.bettercap.title}</h3>
            <p>Uporządkowane sekwencje, parametry, one-linery i procedury zatrzymania.</p>
            <div className="note-card-stats"><span>{data.bettercap.flows.length} workflowów</span><span>{data.bettercap.cleanups.length} cleanupy</span></div>
            <span className="note-card-cta">Przejdź do flowów <b>→</b></span>
          </button>
        </div>
      </section>

      <section className="quick-access">
        <header className="section-heading-row">
          <div><p className="section-kicker">QUICK ACCESS</p><h2>Na skróty</h2></div>
          <span>⌘K — wyszukaj wszystko</span>
        </header>
        <div className="quick-list">
          <button type="button" onClick={() => navigate({ kind: "flow", id: firstFlow.id })}>
            <span>FLOW {firstFlow.number}</span><strong>{firstFlow.title}</strong><small>{firstFlow.goal}</small><b aria-hidden="true">↗</b>
          </button>
          <button type="button" onClick={() => navigate({ kind: "general", id: "chapter-2" })}>
            <span>CHAPTER 02</span><strong>Wireshark i TShark</strong><small>Filtry, pakiety, analiza i praktyka.</small><b aria-hidden="true">↗</b>
          </button>
          {zeek ? (
            <button type="button" onClick={() => navigate({ kind: "general", id: zeek.id })}>
              <span>CHAPTER {zeek.number}</span><strong>{zeek.shortTitle}</strong><small>Logi, analiza ruchu i praca z danymi sieciowymi.</small><b aria-hidden="true">↗</b>
            </button>
          ) : null}
        </div>
      </section>
    </article>
  );
}

function makeSearchHits(data: VaultData, rawQuery: string): SearchHit[] {
  const query = rawQuery.trim().toLocaleLowerCase("pl-PL");
  if (query.length < 2) return [];
  const hits: SearchHit[] = [];

  for (const chapter of data.general.chapters) {
    const match = chapter.blocks.find((block) => block.text.toLocaleLowerCase("pl-PL").includes(query));
    if (chapter.title.toLocaleLowerCase("pl-PL").includes(query) || match) {
      hits.push({
        key: `general-${chapter.id}`,
        eyebrow: `NerdBook IT / ${chapter.number}`,
        title: chapter.title,
        context: match?.text.slice(0, 150) ?? "Rozdział podręcznika",
        view: { kind: "general", id: chapter.id },
      });
    }
  }

  for (const flow of data.bettercap.flows) {
    const haystack = [flow.title, flow.goal, ...flow.requirements, ...flow.phases.map((phase) => phase.code)].join(" ").toLocaleLowerCase("pl-PL");
    if (haystack.includes(query)) {
      hits.push({
        key: `flow-${flow.id}`,
        eyebrow: `Bettercap / Flow ${flow.number}`,
        title: flow.title,
        context: flow.goal,
        view: { kind: "flow", id: flow.id },
      });
    }
  }

  for (const cleanup of data.bettercap.cleanups) {
    if ([cleanup.title, cleanup.scope, cleanup.command].join(" ").toLocaleLowerCase("pl-PL").includes(query)) {
      hits.push({
        key: `cleanup-${cleanup.id}`,
        eyebrow: "Bettercap / CLEAN",
        title: cleanup.title,
        context: cleanup.scope,
        view: { kind: "cleanup", id: cleanup.id },
      });
    }
  }

  return hits.slice(0, 10);
}

function NotebookShell({ data }: { data: VaultData }) {
  const [view, setView] = useState<NotebookView>({ kind: "home" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({ general: true, bettercap: true });
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchHits = useMemo(() => makeSearchHits(data, query), [data, query]);

  const navigate = (nextView: NotebookView) => {
    if (nextView.kind === "general") {
      setExpandedNotes((current) => ({ ...current, general: true }));
    } else if (nextView.kind === "bettercap" || nextView.kind === "flow" || nextView.kind === "cleanup") {
      setExpandedNotes((current) => ({ ...current, bettercap: true }));
    }
    setView(nextView);
    setMenuOpen(false);
    setQuery("");
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" });
    window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, []);

  const wasMenuOpen = useRef(false);
  useEffect(() => {
    if (wasMenuOpen.current && !menuOpen) menuButtonRef.current?.focus();
    wasMenuOpen.current = menuOpen;
  }, [menuOpen]);

  const active = (kind: NotebookView["kind"], id?: string) =>
    view.kind === kind && (!("id" in view) || view.id === id);
  const generalBranchActive = view.kind === "general";
  const bettercapBranchActive = view.kind === "bettercap" || view.kind === "flow" || view.kind === "cleanup";

  let content: ReactNode;
  if (view.kind === "general") {
    const chapter = data.general.chapters.find((item) => item.id === view.id) ?? data.general.chapters[0];
    content = (
      <GeneralReader
        chapter={chapter}
        noteTitle={data.general.title}
        onOpenFlows={() => navigate({ kind: "bettercap" })}
      />
    );
  } else if (view.kind === "bettercap") {
    content = (
      <BettercapOverview
        data={data.bettercap}
        onOpenFlow={(id) => navigate({ kind: "flow", id })}
        onOpenCleanup={(id) => navigate({ kind: "cleanup", id })}
      />
    );
  } else if (view.kind === "flow") {
    const flow = data.bettercap.flows.find((item) => item.id === view.id) ?? data.bettercap.flows[0];
    const cleanup = data.bettercap.cleanups.find((item) => item.id === flow.cleanupId);
    content = <FlowReader flow={flow} cleanup={cleanup} />;
  } else if (view.kind === "cleanup") {
    const cleanup = data.bettercap.cleanups.find((item) => item.id === view.id) ?? data.bettercap.cleanups[0];
    content = (
      <article className="cleanup-reader">
        <p className="breadcrumb">Bettercap / A5 Lab Flows <span>/</span> CLEAN</p>
        <p className="eyebrow">PROCEDURA STOP</p>
        <h1>{cleanup.title}</h1>
        <LabNotice>Zweryfikuj zakres poleceń przed uruchomieniem. Zapis został zachowany zgodnie z notatką źródłową.</LabNotice>
        <CleanupPanel cleanup={cleanup} />
      </article>
    );
  } else {
    content = <Dashboard data={data} navigate={navigate} />;
  }

  return (
    <div className="notebook-app">
      <a className="skip-link" href="#note-content">Przejdź do treści</a>
      <header className="topbar">
        <button
          ref={menuButtonRef}
          className="menu-button"
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-controls="notebook-sidebar"
          aria-expanded={menuOpen}
          aria-label="Otwórz nawigację notesu"
        >
          <span aria-hidden="true">☰</span>
        </button>
        <button className="mobile-brand" type="button" onClick={() => navigate({ kind: "home" })}>NB<span>{"//01"}</span></button>
        <div className="search-shell">
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="global-search">Szukaj we wszystkich notatkach</label>
          <input
            ref={searchRef}
            id="global-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Szukaj w zaszyfrowanych notatkach..."
            autoComplete="off"
          />
          <kbd>⌘ K</kbd>
          {query ? (
            <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Wyczyść wyszukiwanie">×</button>
          ) : null}
          {query.length >= 2 ? (
            <div className="search-results" role="listbox" aria-label="Wyniki wyszukiwania">
              <header><span>WYNIKI</span><span>{searchHits.length.toString().padStart(2, "0")}</span></header>
              {searchHits.length ? searchHits.map((hit) => (
                <button key={hit.key} type="button" role="option" aria-selected="false" onClick={() => navigate(hit.view)}>
                  <span>{hit.eyebrow}</span><strong>{hit.title}</strong><small>{hit.context}</small>
                </button>
              )) : <p>Brak wyników dla „{query}”.</p>}
            </div>
          ) : null}
        </div>
        <div className="topbar-status"><span aria-hidden="true" />AES-256 / OPEN</div>
        <button className="lock-button" type="button" onClick={() => window.location.reload()}>
          <span aria-hidden="true">×</span> Zablokuj
        </button>
      </header>

      <button
        className={`sidebar-overlay ${menuOpen ? "is-visible" : ""}`}
        type="button"
        aria-label="Zamknij nawigację"
        onClick={() => setMenuOpen(false)}
        tabIndex={menuOpen ? 0 : -1}
      />
      <aside id="notebook-sidebar" className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Nawigacja NerdBook">
        <header className="sidebar-brand">
          <button type="button" onClick={() => navigate({ kind: "home" })} aria-label="NerdBook — strona główna">
            <span className="brand-mark">NB</span>
            <div><strong>NERDBOOK</strong><small>EXTERNAL MEMORY // 02</small></div>
          </button>
          <button className="sidebar-close" type="button" onClick={() => setMenuOpen(false)} aria-label="Zamknij nawigację">×</button>
        </header>

        <nav className="sidebar-nav" aria-label="Drzewo notatek">
          <button className={`nav-root ${active("home") ? "is-active" : ""}`} type="button" onClick={() => navigate({ kind: "home" })}>
            <span aria-hidden="true">⌂</span><span>Start / Index</span><small>2 notatki</small>
          </button>

          <section className="nav-collection tree-note">
            <button
              className={`collection-button tree-toggle ${generalBranchActive ? "is-active" : ""}`}
              type="button"
              onClick={() => setExpandedNotes((current) => ({ ...current, general: !current.general }))}
              aria-expanded={expandedNotes.general}
              aria-controls="general-note-tree"
            >
              <span className="tree-chevron" aria-hidden="true">›</span>
              <div><strong>{data.general.title}</strong><small>NOTE 01 · {data.general.chapters.length} sekcji</small></div>
              <span className="tree-order" aria-hidden="true">01</span>
            </button>
            <div id="general-note-tree" className={`nav-children tree-children ${expandedNotes.general ? "is-expanded" : ""}`}>
              {data.general.chapters.map((chapter) => (
                <button
                  className={active("general", chapter.id) ? "is-active" : ""}
                  type="button"
                  key={chapter.id}
                  onClick={() => navigate({ kind: "general", id: chapter.id })}
                >
                  <span>{chapter.number}</span><span>{chapter.shortTitle}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="nav-collection tree-note">
            <button
              className={`collection-button tree-toggle ${bettercapBranchActive ? "is-active" : ""}`}
              type="button"
              onClick={() => setExpandedNotes((current) => ({ ...current, bettercap: !current.bettercap }))}
              aria-expanded={expandedNotes.bettercap}
              aria-controls="bettercap-note-tree"
            >
              <span className="tree-chevron" aria-hidden="true">›</span>
              <div><strong>Bettercap</strong><small>NOTE 02 · {data.bettercap.flows.length + data.bettercap.cleanups.length + 1} sekcji</small></div>
              <span className="tree-order" aria-hidden="true">02</span>
            </button>
            <div id="bettercap-note-tree" className={`nav-children tree-children ${expandedNotes.bettercap ? "is-expanded" : ""}`}>
              <button className={active("bettercap") ? "is-active" : ""} type="button" onClick={() => navigate({ kind: "bettercap" })}>
                <span>00</span><span>START / INDEX</span>
              </button>
              {data.bettercap.flows.map((flow) => (
                <button className={active("flow", flow.id) ? "is-active" : ""} type="button" key={flow.id} onClick={() => navigate({ kind: "flow", id: flow.id })}>
                  <span>{flow.number}</span><span>{flow.title}</span>
                </button>
              ))}
              {data.bettercap.cleanups.map((cleanup, index) => (
                <button className={`cleanup-nav ${active("cleanup", cleanup.id) ? "is-active" : ""}`} type="button" key={cleanup.id} onClick={() => navigate({ kind: "cleanup", id: cleanup.id })}>
                  <span>{String(data.bettercap.flows.length + index + 1).padStart(2, "0")}</span><span>{cleanup.title}</span>
                </button>
              ))}
            </div>
          </section>
        </nav>

        <footer className="sidebar-footer">
          <div><span className="status-pulse" aria-hidden="true" /><p><strong>BUFFER ONLINE</strong><small>plaintext tylko w pamięci</small></p></div>
          <span>v0.1</span>
        </footer>
      </aside>

      <main id="note-content" className="content-scroll" ref={contentRef}>
        <div ref={mainRef} tabIndex={-1} className="content-focus-target">
          {content}
        </div>
        <footer className="content-footer">
          <span>NERDBOOK // EXTERNAL MEMORY BUFFER</span>
          <span>FOR THINGS THAT WORKED ONCE</span>
        </footer>
      </main>
    </div>
  );
}

export default function NerdBookApp() {
  const [vault, setVault] = useState<VaultData | null>(null);
  return vault ? <NotebookShell data={vault} /> : <TerminalGate onUnlock={setVault} />;
}
