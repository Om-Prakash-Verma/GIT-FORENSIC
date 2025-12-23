
import { Commit, FileDiff, RepositoryMetadata, CommitCategory } from '../types';

/**
 * GitService: Manages communication with the Git backend or Remote APIs.
 */
export class GitService {
  private static GITHUB_API_BASE = 'https://api.github.com/repos';

  static async loadRepository(pathOrUrl: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const isGitHub = this.isGitHubUrl(pathOrUrl);
    if (!isGitHub) throw new Error("Only GitHub URLs are supported.");
    return this.fetchGitHubRepository(pathOrUrl);
  }

  static calculateVolatility(stats: { insertions: number, deletions: number, filesChanged: number }, category: CommitCategory): number {
    let score = 0;
    const totalLines = stats.insertions + stats.deletions;
    score += Math.min(Math.log10(totalLines + 1) * 15, 45); 
    score += Math.min(stats.filesChanged * 4, 35);
    const categoryWeights: Record<CommitCategory, number> = {
      logic: 25, fix: 20, feat: 15, refactor: 10, dependency: 15, chore: 2, style: 0
    };
    score += categoryWeights[category] || 0;
    return Math.min(Math.max(Math.round(score), 5), 100);
  }

  static classifyHeuristically(message: string, files: string[] = []): CommitCategory {
    const msg = message.toLowerCase();
    if (msg.includes('fix') || msg.includes('bug')) return 'fix';
    if (msg.includes('feat') || msg.includes('add')) return 'feat';
    if (msg.includes('refactor') || msg.includes('cleanup')) return 'refactor';
    if (msg.includes('deps') || files.some(f => f.includes('lock'))) return 'dependency';
    return 'logic';
  }

  private static isGitHubUrl(input: string): boolean {
    return /github\.com\/[\w-]+\/[\w.-]+/.test(input);
  }

  private static async fetchGitHubRepository(url: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) throw new Error("Invalid structure.");
    const repoPath = `${match[1]}/${match[2].replace(/\.git$/, '')}`;

    try {
      const metaResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}`);
      if (!metaResponse.ok) throw new Error("Repo not found.");
      const metaData = await metaResponse.json();

      const commitsResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits?per_page=100`);
      if (!commitsResponse.ok) throw new Error("History unavailable.");
      const commitsData = await commitsResponse.json();

      const commits: Commit[] = commitsData.map((c: any) => ({
        hash: c.sha,
        author: c.commit.author.name,
        authorEmail: c.commit.author.email,
        date: c.commit.author.date,
        message: c.commit.message,
        parents: c.parents.map((p: any) => p.sha),
        category: this.classifyHeuristically(c.commit.message),
        volatilityScore: 30,
        stats: { insertions: 0, deletions: 0, filesChanged: 0 },
        diffs: []
      }));

      return {
        metadata: {
          name: metaData.name,
          path: url,
          currentBranch: metaData.default_branch,
          totalCommits: commits.length
        },
        commits
      };
    } catch (err: any) {
      throw new Error(err.message);
    }
  }

  static async hydrateCommitDiffs(repoUrl: string, commit: Commit): Promise<Commit> {
    const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) return commit;
    const repoPath = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
    
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits/${commit.hash}`);
      if (!response.ok) throw new Error("Commit missing.");
      const data = await response.json();
      const files = data.files.map((f: any) => f.filename);
      const category = this.classifyHeuristically(commit.message, files);
      const stats = { insertions: data.stats.additions, deletions: data.stats.deletions, filesChanged: data.files.length };
      const diffs: FileDiff[] = data.files.map((file: any) => ({
        path: file.filename,
        changes: file.status === 'renamed' ? 'modified' : file.status,
        oldContent: '', newContent: '', patch: file.patch || "", hunks: [],
        stats: { additions: file.additions, deletions: file.deletions }
      }));
      return { ...commit, category, volatilityScore: this.calculateVolatility(stats, category), stats, diffs };
    } catch (err: any) { throw err; }
  }
}

export class BisectEngine {
  /**
   * Refined Bisect Engine with range safety and index validation.
   */
  static calculateStep(commits: Commit[], goodHash: string, badHash: string, eliminated: Set<string>) {
    const goodIdx = commits.findIndex(c => c.hash === goodHash);
    const badIdx = commits.findIndex(c => c.hash === badHash);

    if (goodIdx === -1 || badIdx === -1) {
      return { midpoint: null, isDone: true, suspected: null, remaining: 0, estimatedSteps: 0 };
    }

    // Safety: ensure traversal works regardless of commit list orientation
    const start = Math.min(goodIdx, badIdx);
    const end = Math.max(goodIdx, badIdx);

    const candidates = [];
    for (let i = start; i <= end; i++) {
      if (!eliminated.has(commits[i].hash)) {
        candidates.push(commits[i].hash);
      }
    }

    if (candidates.length <= 1) {
      return { midpoint: null, isDone: true, suspected: badHash, remaining: 0, estimatedSteps: 0 };
    }

    const mid = Math.floor(candidates.length / 2);
    const midpoint = candidates[mid];

    return {
      midpoint,
      isDone: false,
      suspected: null,
      remaining: candidates.length,
      estimatedSteps: Math.ceil(Math.log2(candidates.length))
    };
  }
}
