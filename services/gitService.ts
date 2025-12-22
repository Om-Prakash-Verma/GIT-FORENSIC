
import { Commit, FileDiff, DiffHunk, RepositoryMetadata } from '../types';

/**
 * GitService: Manages communication with the Git backend or Remote APIs.
 * Supports local path simulation and real GitHub repository importing.
 */
export class GitService {
  private static GITHUB_API_BASE = 'https://api.github.com/repos';

  static async loadRepository(pathOrUrl: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const isGitHub = this.isGitHubUrl(pathOrUrl);
    
    if (isGitHub) {
      return this.fetchGitHubRepository(pathOrUrl);
    }

    // Simulate local FS and network latency
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (pathOrUrl.length < 3) {
      throw new Error("Invalid repository path or insufficient permissions.");
    }

    const commits = this.generateRealisticHistory();
    return {
      metadata: {
        name: pathOrUrl.split(/[\\/]/).pop() || "vortex-engine",
        path: pathOrUrl,
        currentBranch: "main",
        totalCommits: commits.length
      },
      commits
    };
  }

  private static isGitHubUrl(input: string): boolean {
    return /github\.com\/[\w-]+\/[\w.-]+/.test(input);
  }

  private static async fetchGitHubRepository(url: string): Promise<{ metadata: RepositoryMetadata; commits: Commit[] }> {
    const match = url.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) throw new Error("Invalid GitHub URL format.");

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');
    const repoPath = `${owner}/${repo}`;

    try {
      const metaResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}`);
      if (!metaResponse.ok) {
        if (metaResponse.status === 403) throw new Error("GitHub API Rate Limit Exceeded (60 req/hr for unauthenticated IP). Try again later or use a local path.");
        if (metaResponse.status === 404) throw new Error("Repository not found. Ensure the repository is Public.");
        throw new Error(`GitHub metadata fetch failed: ${metaResponse.statusText}`);
      }
      const metaData = await metaResponse.json();

      const commitsResponse = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits?per_page=100`);
      if (!commitsResponse.ok) {
        throw new Error(`Failed to fetch commit history: ${commitsResponse.statusText}`);
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
      if (err.message === 'Failed to fetch') {
        throw new Error("Connection Blocked: The browser failed to reach GitHub's API. This is usually due to network restrictions, strict CORS, or an ad-blocker.");
      }
      throw new Error(`GitHub Sync Error: ${err.message}`);
    }
  }

  static async hydrateCommitDiffs(repoUrl: string, commit: Commit): Promise<Commit> {
    if (!this.isGitHubUrl(repoUrl) || commit.diffs.length > 0) return commit;

    const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) return commit;
    
    const repoPath = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
    
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/${repoPath}/commits/${commit.hash}`);
      if (!response.ok) throw new Error(`Details fetch failed: ${response.statusText}`);
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
    } catch (err) {
      console.error("Hydration failure:", err);
      return commit;
    }
  }

  private static generateRealisticHistory(): Commit[] {
    return [
      {
        hash: "7fbc12a3d9021a",
        author: "Chief Architect",
        authorEmail: "architect@enterprise.io",
        date: "2023-11-01T09:00:00Z",
        message: "feat: core protocol implementation",
        parents: [],
        stats: { insertions: 1240, deletions: 0, filesChanged: 5 },
        diffs: [{
          path: "src/protocol/core.ts",
          oldContent: "",
          newContent: "export class CoreProtocol {\n  private state: Map<string, any> = new Map();\n  \n  async dispatch(payload: any) {\n    console.log('Dispatching payload...');\n    return await this.process(payload);\n  }\n\n  private async process(p: any) {\n    return p;\n  }\n}",
          changes: "added",
          hunks: [],
          patch: "@@ -0,0 +1,11 @@\n+export class CoreProtocol {\n+  private state: Map<string, any> = new Map();\n+  \n+  async dispatch(payload: any) {\n+    console.log('Dispatching payload...');\n+    return await this.process(payload);\n+  }\n+\n+  private async process(p: any) {\n+    return p;\n+  }\n+}"
        }]
      },
      {
        hash: "d5e6f7a8b2c1d3",
        author: "Senior Dev",
        authorEmail: "dev1@enterprise.io",
        date: "2023-11-04T16:45:00Z",
        message: "refactor: simplify cache invalidation logic",
        parents: ["b9a8c7d6e"],
        stats: { insertions: 82, deletions: 54, filesChanged: 1 },
        diffs: [{
          path: "src/utils/lookup.ts",
          oldContent: "",
          newContent: "",
          changes: "modified",
          hunks: [],
          patch: "@@ -1,3 +1,7 @@\n export const lookup = (key) => {\n-  return cache.get(key);\n+  // REGRESSION INTRODUCED HERE\n+  // Using shallow copy on complex state object causes memory leaks\n+  const res = cache.get(key);\n+  const data = { ...res, timestamp: Date.now() };\n+  return data;\n };"
        }]
      }
    ];
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
