
import { FileDiff, ImpactData, ImpactNode, ImpactLink } from '../types';

export class DependencyService {
  private static GITHUB_API_BASE = 'https://api.github.com/repos';

  /**
   * Analyzes modified files in a commit to build a dependency graph.
   * Uses regex to extract imports and maps relationships.
   */
  static async buildImpactGraph(repoUrl: string, commitHash: string, diffs: FileDiff[]): Promise<ImpactData> {
    const match = repoUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);
    if (!match) return { nodes: [], links: [] };
    
    const repoPath = `${match[1]}/${match[2].replace(/\.git$/, '')}`;
    const nodes: ImpactNode[] = [];
    const links: ImpactLink[] = [];
    const nodeMap = new Map<string, ImpactNode>();

    // Initialize nodes for all modified files
    diffs.forEach(diff => {
      const node: ImpactNode = {
        id: diff.path,
        name: diff.path.split('/').pop() || diff.path,
        isModified: true,
        type: 'file',
        impactScore: (diff.stats.additions + diff.stats.deletions) / 10
      };
      nodes.push(node);
      nodeMap.set(diff.path, node);
    });

    // For a real production app, we would fetch file contents and parse them.
    // In this environment, we'll simulate the "blast radius" detection 
    // by finding related files in the same directories and potential import patterns.
    
    for (const diff of diffs) {
      if (!diff.patch) continue;

      // Extract potential imports from patch context (simple regex fallback)
      const importRegex = /(?:import|from|require)\s+['"]([^'"]+)['"]/g;
      let m;
      while ((m = importRegex.exec(diff.patch)) !== null) {
        const importPath = m[1];
        // Only care about relative imports for internal dependency tracking
        if (importPath.startsWith('.')) {
          const resolvedPath = this.resolvePath(diff.path, importPath);
          
          if (!nodeMap.has(resolvedPath)) {
            const newNode: ImpactNode = {
              id: resolvedPath,
              name: resolvedPath.split('/').pop() || resolvedPath,
              isModified: false,
              type: 'file',
              impactScore: 1
            };
            nodes.push(newNode);
            nodeMap.set(resolvedPath, newNode);
          }

          links.push({
            source: diff.path,
            target: resolvedPath,
            value: 1
          });
        }
      }

      // Heuristic: Link files in the same directory as "potentially affected"
      const dir = diff.path.substring(0, diff.path.lastIndexOf('/'));
      diffs.forEach(other => {
        if (other.path !== diff.path && other.path.startsWith(dir) && !links.find(l => (l.source === diff.path && l.target === other.path))) {
          links.push({
            source: diff.path,
            target: other.path,
            value: 0.5
          });
        }
      });
    }

    return { nodes, links };
  }

  private static resolvePath(currentPath: string, importPath: string): string {
    const parts = currentPath.split('/');
    parts.pop(); // Remove filename
    
    const importParts = importPath.split('/');
    for (const part of importParts) {
      if (part === '.') continue;
      if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    
    let resolved = parts.join('/');
    // Append likely extensions if missing
    if (!resolved.includes('.')) resolved += '.ts'; 
    return resolved;
  }
}
