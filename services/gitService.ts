
import { Commit, FileDiff, RepositoryMetadata, CommitCategory } from '../types';

/**
 * GitService: Manages communication with the Git backend or Remote APIs.
 */
export class GitService {
  private static GITHUB_API_BASE = 'https://api.github.com/repos';

  static async loadRepository(pathOrUrl: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    console.log(`[GitService] Initializing repository load for path: ${pathOrUrl}`);
    
    try {
      const { owner, repo } = this.parseGitHubUrl(pathOrUrl);
      return this.fetchGitHubRepository(owner, repo);
    } catch (err: any) {
      console.error(`[GitService] Load failed: ${err.message}`);
      throw err;
    }
  }

  static calculateVolatility(stats: { insertions: number, deletions: number, filesChanged: number }, category: CommitCategory): number {
    console.debug(`[GitService] Calculating volatility for category: ${category}`, stats);
    let score = 0;
    const totalLines = stats.insertions + stats.deletions;
    
    score += Math.min(Math.log10(totalLines + 1) * 15, 45); 
    score += Math.min(stats.filesChanged * 4, 35);
    
    const categoryWeights: Record<CommitCategory, number> = {
      logic: 25,
      fix: 20,
      feat: 15,
      refactor: 10,
      dependency: 15,
      chore: 2,
      style: 0
    };
    score += categoryWeights[category] || 0;

    const finalScore = Math.min(Math.max(Math.round(score), 5), 100);
    console.debug(`[GitService] Final volatility score: ${finalScore}`);
    return finalScore;
  }

  static classifyHeuristically(message: string, files: string[] = []): CommitCategory {
    const msg = message.toLowerCase();
    let category: CommitCategory = 'logic';
    
    if (msg.includes('fix') || msg.includes('patch') || msg.includes('bug') || msg.includes('issue')) category = 'fix';
    else if (msg.includes('feat') || msg.includes('add') || msg.includes('implement')) category = 'feat';
    else if (msg.includes('refactor') || msg.includes('clean') || msg.includes('move') || msg.includes('simplify')) category = 'refactor';
    else if (msg.includes('deps') || msg.includes('dependency') || files.some(f => f.includes('lock') || f.includes('package.json') || f.includes('cargo.toml'))) category = 'dependency';
    else if (msg.includes('style') || msg.includes('format') || msg.includes('lint') || msg.includes('prettier')) category = 'style';
    else if (msg.includes('chore') || msg.includes('build') || msg.includes('release')) category = 'chore';
    
    console.debug(`[GitService] Heuristic classification: "${message.substring(0, 30)}..." -> ${category}`);
    return category;
  }

  private static parseGitHubUrl(input: string): { owner: string; repo: string } {
    const trimmed = input.trim();
    if (!trimmed) throw new Error("Repository path cannot be empty.");

    try {
      const urlStr = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      const url = new URL(urlStr);
      
      if (!url.hostname.includes('github.com')) {
        throw new Error("Only GitHub repositories are supported.");
      }

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length < 2) {
        throw new Error("Invalid GitHub URL format. Expected: github.com/owner/repo");
      }

      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, '')
      };
    } catch (e: any) {
      if (e.name === 'TypeError') {
        // Fallback for non-URL strings like "owner/repo"
        const parts = trimmed.split('/').filter(Boolean);
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1].replace(/\.git$/, '') };
        }
      }
      throw new Error(e.message || "Invalid repository URL.");
    }
  }

  private static async fetchGitHubRepository(owner: string, repo: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const repoPath = `${owner}/${repo}`;
    console.log(`[GitService] Fetching ${repoPath}`);

    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    try {
      const metaResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}`, { headers });
      if (!metaResponse.ok) {
        console.error(`[GitService] GitHub Metadata API Error: ${metaResponse.status}`);
        if (metaResponse.status === 403) throw new Error("GitHub API Rate Limit Exceeded.");
        if (metaResponse.status === 404) throw new Error("Repository not found. Please ensure it is a public repository.");
        throw new Error(`GitHub Sync Error: ${metaResponse.status}`);
      }
      const metaData = await metaResponse.json();

      console.log(`[GitService] Fetching history for ${repoPath}`);
      const commitsResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits?per_page=100`, { headers });
      if (!commitsResponse.ok) {
        console.error(`[GitService] GitHub Commits API Error: ${commitsResponse.status}`);
        throw new Error(`Failed to fetch history (Status ${commitsResponse.status})`);
      }
      const commitsData = await commitsResponse.json();

      if (!Array.isArray(commitsData)) {
        throw new Error("Unexpected API response: Commits data is not an array.");
      }

      const commits: Commit[] = commitsData.map((c: any) => {
        const message = c.commit.message;
        const category = this.classifyHeuristically(message);
        return {
          hash: c.sha,
          author: c.commit.author.name,
          authorEmail: c.commit.author.email,
          date: c.commit.author.date,
          message,
          parents: c.parents.map((p: any) => p.sha),
          category,
          volatilityScore: category === 'logic' ? 40 : 15,
          stats: { insertions: 0, deletions: 0, filesChanged: 0 },
          diffs: []
        };
      });

      return {
        metadata: {
          name: metaData.name,
          path: `https://github.com/${repoPath}`,
          currentBranch: metaData.default_branch,
          totalCommits: commits.length
        },
        commits
      };
    } catch (err: any) {
      console.error("[GitService] fetchGitHubRepository Exception:", err);
      throw new Error(err.message || "Unknown Network Error.");
    }
  }

  static async hydrateCommitDiffs(repoUrl: string, commit: Commit): Promise<Commit> {
    console.log(`[GitService] Hydrating diffs for: ${commit.hash.substring(0, 8)}`);
    
    if (commit.diffs.length > 0) return commit;

    try {
      const { owner, repo } = this.parseGitHubUrl(repoUrl);
      const repoPath = `${owner}/${repo}`;
      
      const response = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits/${commit.hash}`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!response.ok) {
        console.error(`[GitService] Hydration API Error: ${response.status}`);
        throw new Error(`Commit fetch failed (${response.status})`);
      }
      const data = await response.json();

      const files = data.files.map((f: any) => f.filename);
      const category = this.classifyHeuristically(commit.message, files);
      const stats = {
        insertions: data.stats.additions,
        deletions: data.stats.deletions,
        filesChanged: data.files.length
      };

      const diffs: FileDiff[] = data.files.map((file: any) => ({
        path: file.filename,
        changes: file.status === 'renamed' ? 'modified' : file.status,
        oldContent: '', 
        newContent: '',
        patch: file.patch || "",
        hunks: [],
        stats: {
          additions: file.additions,
          deletions: file.deletions
        }
      }));

      return {
        ...commit,
        category,
        volatilityScore: this.calculateVolatility(stats, category),
        stats,
        diffs
      };
    } catch (err: any) {
      console.error(`[GitService] Hydration failed for ${commit.hash}:`, err);
      throw err;
    }
  }
}

export class BisectEngine {
  static calculateStep(
    commits: Commit[],
    goodHash: string,
    badHash: string,
    eliminated: Set<string>
  ) {
    const goodIdx = commits.findIndex(c => c.hash === goodHash);
    const badIdx = commits.findIndex(c => c.hash === badHash);

    if (goodIdx === -1 || badIdx === -1) {
      return { midpoint: null, isDone: true, suspected: null, remaining: 0, estimatedSteps: 0 };
    }

    const startIdx = Math.min(goodIdx, badIdx);
    const endIdx = Math.max(goodIdx, badIdx);

    const candidates = [];
    for (let i = startIdx; i <= endIdx; i++) {
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
