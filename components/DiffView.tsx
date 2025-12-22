
import React, { useMemo } from 'react';
import { FileDiff, DiffLine } from '../types';
import { DiffParser } from '../services/diffParser';

interface DiffViewProps {
  diffs: FileDiff[];
  activeFilePath?: string | null;
}

const DiffView: React.FC<DiffViewProps> = ({ diffs, activeFilePath }) => {
  const fileRefs = useMemo(() => {
    return diffs.reduce((acc, diff) => {
      acc[diff.path] = React.createRef<HTMLDivElement>();
      return acc;
    }, {} as Record<string, React.RefObject<HTMLDivElement>>);
  }, [diffs]);

  React.useEffect(() => {
    if (activeFilePath && fileRefs[activeFilePath]?.current) {
      fileRefs[activeFilePath].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeFilePath, fileRefs]);

  if (!diffs || diffs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 space-y-4">
        <div className="w-12 h-12 border-2 border-slate-800 rounded-full flex items-center justify-center opacity-20 animate-pulse">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        </div>
        <p className="text-xs uppercase tracking-widest font-bold">No modified assets detected in this snapshot</p>
      </div>
    );
  }

  const renderDiffLine = (line: DiffLine, idx: number) => {
    let bgColor = '';
    let textColor = 'text-slate-400';
    let sign = ' ';

    if (line.type === 'added') {
      bgColor = 'bg-green-500/10';
      textColor = 'text-green-400';
      sign = '+';
    } else if (line.type === 'removed') {
      bgColor = 'bg-red-500/10';
      textColor = 'text-red-400';
      sign = '-';
    }

    return (
      <div key={idx} className={`flex font-mono text-[12px] leading-relaxed group ${bgColor} hover:brightness-125 transition-all`}>
        <div className="w-12 flex-shrink-0 text-right pr-3 select-none text-slate-700 border-r border-slate-800/50 text-[10px] py-0.5">
          {line.lineNumber || ' '}
        </div>
        <div className={`w-6 flex-shrink-0 text-center select-none opacity-40 font-bold ${textColor}`}>
          {sign}
        </div>
        <div className={`px-2 whitespace-pre overflow-x-hidden ${textColor} flex-1`}>
          {line.content || ' '}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto bg-[#020617] p-6 space-y-10 custom-scrollbar">
      {diffs.map((diff, idx) => {
        const hunks = DiffParser.parsePatch(diff.patch || '');
        return (
          <div 
            key={idx} 
            ref={fileRefs[diff.path]}
            className={`border rounded-2xl overflow-hidden transition-all duration-500 ${
              activeFilePath === diff.path 
                ? 'border-amber-500/40 ring-1 ring-amber-500/10 shadow-2xl shadow-amber-500/5' 
                : 'border-slate-800 shadow-lg'
            }`}
          >
            <div className="bg-slate-900/90 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  diff.changes === 'added' ? 'bg-green-500' :
                  diff.changes === 'removed' ? 'bg-red-500' : 'bg-blue-500'
                } shadow-[0_0_8px_currentColor]`} />
                <span className="text-xs font-black text-slate-200 tracking-tight font-mono">{diff.path}</span>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-mono text-slate-500 uppercase px-3 py-1 bg-black/40 border border-slate-800 rounded-full font-black">
                   {diff.changes}
                 </span>
              </div>
            </div>
            <div className="bg-black/40">
              {hunks.length > 0 ? (
                hunks.map((hunk, hIdx) => (
                  <div key={hIdx} className="border-b border-slate-800/30 last:border-0">
                    <div className="px-6 py-1.5 bg-slate-900/20 text-[10px] font-mono text-slate-500 italic border-b border-slate-800/20">
                      @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                    </div>
                    <div className="py-2">
                      {hunk.lines.map((line, lIdx) => renderDiffLine(line, lIdx))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-600 italic text-[11px] font-mono">
                  No patch data available for this changeset.
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div className="h-40" />
    </div>
  );
};

export default DiffView;
