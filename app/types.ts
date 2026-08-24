export type GeneralBlockKind =
  | "title"
  | "subtitle"
  | "meta"
  | "chapter"
  | "section"
  | "subsection"
  | "term"
  | "label"
  | "detail"
  | "paragraph"
  | "code"
  | "diagram";

export interface GeneralBlock {
  kind: GeneralBlockKind;
  text: string;
}

export interface GeneralChapter {
  id: string;
  number: string;
  title: string;
  shortTitle: string;
  blocks: GeneralBlock[];
}

export interface GeneralNote {
  id: string;
  title: string;
  kicker: string;
  version: string;
  versionDate: string;
  scope: string[];
  sourceFile: string;
  stats: {
    words: number;
    sourceParagraphs: number;
    chapters: number;
    codeBlocks: number;
  };
  chapters: GeneralChapter[];
}

export type RiskLevel = "medium" | "high" | "critical";

export interface FlowPhase {
  title: string;
  code: string;
}

export interface OneLiner {
  label: string;
  command: string;
  generated: boolean;
}

export interface BettercapFlow {
  id: string;
  number: string;
  title: string;
  category: string;
  goal: string;
  mode: string;
  risk: RiskLevel;
  requirements: string[];
  warnings: string[];
  cleanupId: string;
  phases: FlowPhase[];
  oneLiners: OneLiner[];
}

export interface CleanupProcedure {
  id: string;
  title: string;
  scope: string;
  command: string;
  warnings: string[];
}

export interface BettercapNote {
  id: string;
  title: string;
  kicker: string;
  sourceFile: string;
  labNotice: string;
  flows: BettercapFlow[];
  cleanups: CleanupProcedure[];
}

export interface VaultData {
  schemaVersion: number;
  generatedAt: string;
  identity: {
    name: string;
    title: string;
    description: string;
  };
  general: GeneralNote;
  bettercap: BettercapNote;
}

export interface VaultEnvelope {
  version: number;
  kdf: {
    name: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  cipher: {
    name: "AES-GCM";
    iv: string;
  };
  payload: string;
}

export type NotebookView =
  | { kind: "home" }
  | { kind: "general"; id: string }
  | { kind: "bettercap" }
  | { kind: "flow"; id: string }
  | { kind: "cleanup"; id: string };
