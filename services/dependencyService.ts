
import { FileDiff, ImpactData, ImpactNode, ImpactLink } from '../types';

export class DependencyService {
  /**
   * Enhanced dependency builder with alias support and robust regex.
   */
  static async buildImpactGraph(repoUrl: string, commitHash: string, diffs: FileDiff[]): Promise<ImpactData> {
    const nodes: ImpactNode[] = [];
    const links: ImpactLink[] = [];
    const nodeMap = new Map<string, ImpactNode>();

    // 1. Initialize nodes for modified files
    diffs.forEach(diff => {
      const node: ImpactNode = {
        id: diff.path,
        name: diff.path.split('/').pop() || diff.path,
        isModified: true,
        type: 'file',
        impactScore: Math.min((diff.stats.additions + diff.stats.deletions) / 5, 25) + 5
      };
      nodes.push(node);
      nodeMap.set(diff.path, node);
    });

    // 2. Identify and Link Relationships
    for (const diff of diffs) {
      if (!diff.patch) continue;

      // Robust Regex for ESM, CJS, and Dynamic Imports
      const importRegex = /(?:import|from|require|export)\s+(?:[\w\s{},*]*\s+from\s+)?['"]([^'"]+)['"]/g;
      let m;
      while ((m = importRegex.exec(diff.patch)) !== null) {
        let importPath = m[1];
        let resolvedPath = '';

        // Handle Aliases (Assuming @/ maps to src/ or root)
        if (importPath.startsWith('@/')) {
          resolvedPath = importPath.replace('@/', 'src/');
          if (!resolvedPath.includes('.')) resolvedPath += '.ts';
        } else if (importPath.startsWith('.')) {
          resolvedPath = this.resolvePath(diff.path, importPath);
        }

        if (resolvedPath) {
          if (!nodeMap.has(resolvedPath)) {
            const newNode: ImpactNode = {
              id: resolvedPath,
              name: resolvedPath.split('/').pop() || resolvedPath,
              isModified: false,
              type: 'file',
              impactScore: 5
            };
            nodes.push(newNode);
            nodeMap.set(resolvedPath, newNode);
          }

          if (!links.some(l => l.source === diff.path && l.target === resolvedPath)) {
            links.push({ source: diff.path, target: resolvedPath, value: 2 });
          }
        }
      }

      // Proximity Heuristic: Files in the same directory often share context
      const dir = diff.path.substring(0, diff.path.lastIndexOf('/'));
      diffs.forEach(other => {
        if (other.path !== diff.path && other.path.startsWith(dir)) {
          const alreadyLinked = links.some(l => 
            (l.source === diff.path && l.target === other.path) || 
            (l.source === other.path && l.target === diff.path)
          );
          if (!alreadyLinked) {
            links.push({ source: diff.path, target: other.path, value: 0.8 });
          }
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
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    
    let resolved = parts.join('/');
    // Heuristic: common extensions
    if (!resolved.includes('.')) {
      if (resolved.toLowerCase().includes('component')) resolved += '.tsx';
      else resolved += '.ts';
    }
    return resolved;
  }
}
