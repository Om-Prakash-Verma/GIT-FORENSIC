
// Fix: Added d3 import to provide access to SimulationNodeDatum and SimulationLinkDatum namespaces
import * as d3 from 'd3';

export type CommitCategory = 'logic' | 'refactor' | 'dependency' | 'style' | 'feat' | 'fix' | 'chore';

export interface Commit {
  hash: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  body?: string;
  parents: string[];
  category?: CommitCategory;
  volatilityScore: number; // New: 0-100 score representing heuristic churn risk
  stats: {
    insertions: number;
    deletions: number;
    filesChanged: number;
  };
  diffs: FileDiff[];
}

export interface FileDiff {
  path: string;
  changes: 'added' | 'removed' | 'modified' | 'renamed';
  oldContent: string;
  newContent: string;
  patch: string;
  hunks: DiffHunk[];
  stats: {
    additions: number;
    deletions: number;
  };
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  content: string;
  type: 'added' | 'removed' | 'context';
  lineNumber?: number;
}

export interface RepositoryMetadata {
  name: string;
  path: string;
  currentBranch: string;
  totalCommits: number;
}

export interface AIAnalysis {
  summary: string;
  conceptualSummary: string;
  category: CommitCategory;
  logicChanges: string[];
  bugRiskExplanation: string;
  dangerReasoning: string; 
  probabilityScore: number;
  riskFactors: string[];
  fixStrategies: string[]; 
  failureSimulation: string; // New: "What Broke First?" predictive failure analysis
  hiddenCouplings: string[]; // New: "Hidden Coupling Detector" for non-obvious dependencies
}

export enum BisectStatus {
  GOOD = 'good',
  BAD = 'bad',
  SUSPECTED = 'suspected',
  SKIPPED = 'skipped'
}

export interface BisectState {
  isActive: boolean;
  goodHash: string | null;
  badHash: string | null;
  currentMidpoint: string | null;
  eliminatedHashes: Set<string>;
  suspectedHash: string | null;
  history: BisectState[];
}

// Impact Graph Types
export interface ImpactNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isModified: boolean;
  type: 'file' | 'module';
  impactScore: number;
}

export interface ImpactLink extends d3.SimulationLinkDatum<ImpactNode> {
  source: string | ImpactNode;
  target: string | ImpactNode;
  value: number;
}

export interface ImpactData {
  nodes: ImpactNode[];
  links: ImpactLink[];
}
