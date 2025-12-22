
import { DiffHunk, DiffLine } from '../types.ts';

export class DiffParser {
  static parsePatch(patch: string): DiffHunk[] {
    if (!patch) return [];
    
    const hunks: DiffHunk[] = [];
    const lines = patch.split('\n');
    let currentHunk: DiffHunk | null = null;

    let oldLineNum = 0;
    let newLineNum = 0;

    for (const line of lines) {
      const hunkHeaderMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      
      if (hunkHeaderMatch) {
        if (currentHunk) hunks.push(currentHunk);
        
        oldLineNum = parseInt(hunkHeaderMatch[1], 10);
        newLineNum = parseInt(hunkHeaderMatch[3], 10);
        
        currentHunk = {
          oldStart: oldLineNum,
          oldLines: parseInt(hunkHeaderMatch[2] || '1', 10),
          newStart: newLineNum,
          newLines: parseInt(hunkHeaderMatch[4] || '1', 10),
          lines: []
        };
        continue;
      }

      if (!currentHunk) continue;

      if (line.startsWith('+')) {
        currentHunk.lines.push({ content: line.slice(1), type: 'added', lineNumber: newLineNum++ });
      } else if (line.startsWith('-')) {
        currentHunk.lines.push({ content: line.slice(1), type: 'removed', lineNumber: oldLineNum++ });
      } else {
        currentHunk.lines.push({ content: line.slice(1), type: 'context', lineNumber: newLineNum++ });
        oldLineNum++; // Sync context line number
      }
    }

    if (currentHunk) hunks.push(currentHunk);
    return hunks;
  }
}
