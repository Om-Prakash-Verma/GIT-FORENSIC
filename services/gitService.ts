
import { Commit, FileDiff, DiffHunk, RepositoryMetadata } from '../types';

/**
 * GitService: Manages communication with the Git backend or Remote APIs.
 * This version strictly enforces GitHub repository importing via the REST API.
 */
export class GitService {
  private static GITHUB_API_BASE = 'https://api.github.com/repos';

  static async loadRepository(pathOrUrl: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const isGitHub = this.isGitHubUrl(pathOrUrl);
    
    if (!isGitHub) {
      throw new Error("Invalid Repository: Only public GitHub repository URLs are supported (e.g., https://github.com/user/repo).");
    }

    return this.fetchGitHubRepository(pathOrUrl);
  }

  private static isGitHubUrl(input: string): boolean {
    // Matches standard HTTPS and git-style GitHub URLs
    return /github\.com\/[\w-]+\/[\w.-]+/.test(input);
  }

  private static async fetchGitHubRepository(url: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) throw new Error("Could not parse GitHub URL structure.");

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const repoPath = `${owner}/${repo}`;

    try {
      const metaResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}`);
      if (!metaResponse.ok) {
        if (metaResponse.status === 403) throw new Error("GitHub API Rate Limit Exceeded. Please try again later or use a different network.");
        if (metaResponse.status === 404) throw new Error("Repository not found. Ensure the repository is Public.");
        throw new Error(`GitHub Sync Error: ${metaResponse.status}`);
      }
      const metaData = await metaResponse.json();

      const commitsResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits?per_page=100`);
      if (!commitsResponse.ok) {
        throw new Error(`Failed to fetch history (Status ${commitsResponse.status})`);
      }
      const commitsData = await commitsResponse.json();

      const commits: Commit[] = commitsData.map((c: any) => ({
        hash: c.sha,
        author: c.commit.author.name,
        authorEmail: c.commit.author.email,
        date: c.commit.author.date,
        message: c.commit.message,
        parents: c.parents.map((p: any) => p.sha),
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
      throw new Error(err.message || "Unknown Network Error during GitHub synchronization.");
    }
  }

  static async hydrateCommitDiffs(repoUrl: string, commit: Commit): Promise<Commit> {
    if (!this.isGitHubUrl(repoUrl) || commit.diffs.length > 0) return commit;

    const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) return commit;
    
    const repoPath = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
    
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits/${commit.hash}`);
      if (!response.ok) {
        if (response.status === 403) throw new Error("Rate Limit reached. Differential data unavailable.");
        throw new Error(`Commit fetch failed (${response.status})`);
      }
      const data = await response.json();

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
        stats: {
          insertions: data.stats.additions,
          deletions: data.stats.deletions,
          filesChanged: data.files.length
        },
        diffs
      };
    } catch (err: any) {
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
