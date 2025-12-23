
import { FileDiff, ImpactData, ImpactNode, ImpactLink } from '../types';

export class DependencyService {
  /**
   * Refined dependency builder with multi-line regex and alias support.
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

    // 2. Multi-pattern Dependency Extraction
    const patterns = [
      // Multi-line ESM Imports/Exports
      /(?:import|export)\s+[\s\S]*?from\s+['"]([^'"]+)['"]/g,
      // CommonJS require
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // Dynamic import()
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // Side-effect only imports
      /import\s+['"]([^'"]+)['"]/g
    ];

    for (const diff of diffs) {
      if (!diff.patch) continue;

      for (const regex of patterns) {
        let m;
        while ((m = regex.exec(diff.patch)) !== null) {
          const importPath = m[1];
          let resolvedPath = '';

          // Alias resolution (@/ -> src/)
          if (importPath.startsWith('@/')) {
            resolvedPath = importPath.replace('@/', 'src/');
          } else if (importPath.startsWith('.')) {
            resolvedPath = this.resolvePath(diff.path, importPath);
          }

          if (resolvedPath) {
            // Ensure proper file extension if missing
            if (!resolvedPath.includes('.')) {
              resolvedPath += resolvedPath.toLowerCase().includes('component') ? '.tsx' : '.ts';
            }

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
      }

      // Proximity: Contextual coupling within same directory
      const dir = diff.path.substring(0, diff.path.lastIndexOf('/'));
      diffs.forEach(other => {
        if (other.path !== diff.path && other.path.startsWith(dir)) {
          const alreadyLinked = links.some(l => 
            (l.source === diff.path && l.target === other.path) || 
            (l.source === other.path && l.target === diff.path)
          );
          if (!alreadyLinked) {
            links.push({ source: diff.path, target: other.path, value: 0.5 });
          }
        }
      });
    }

    return { nodes, links };
  }

  private static resolvePath(currentPath: string, importPath: string): string {
    const parts = currentPath.split('/');
    parts.pop(); // filename
    
    const importParts = importPath.split('/');
    for (const part of importParts) {
      if (part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    
    return parts.join('/');
  }
}
