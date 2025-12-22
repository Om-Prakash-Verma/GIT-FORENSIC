
export interface Commit {
  hash: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  body?: string;
  parents: string[];
  diffs: FileDiff[];
  stats: {
    insertions: number;
    deletions: number;
    filesChanged: number;
  };
}

export interface DiffLine {
  content: string;
  type: 'added' | 'removed' | 'context';
  lineNumber?: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  oldPath?: string;
  oldContent: string;
  newContent: string;
  changes: 'added' | 'removed' | 'modified' | 'renamed';
  hunks: DiffHunk[];
  patch?: string; // Raw GitHub patch string
}

export interface AIAnalysis {
  summary: string;
  logicChanges: string[];
  bugRiskExplanation: string;
  probabilityScore: number;
  riskFactors: string[];
}

export enum BisectStatus {
  UNMARKED = 'UNMARKED',
  GOOD = 'GOOD',
  BAD = 'BAD',
  SKIPPED = 'SKIPPED',
  SUSPECTED = 'SUSPECTED'
}

export interface BisectState {
  isActive: boolean;
  goodHash: string | null;
  badHash: string | null;
  currentMidpoint: string | null;
  eliminatedHashes: Set<string>;
  suspectedHash: string | null;
  history: Omit<BisectState, 'history'>[]; // For Undo functionality
}

export interface RepositoryMetadata {
  name: string;
  path: string;
  currentBranch: string;
  totalCommits: number;
}
