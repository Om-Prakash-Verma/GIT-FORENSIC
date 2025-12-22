
import React from 'react';
import { Commit } from '../types.ts';

interface FileExplorerProps {
  isVisible: boolean;
  commit: Commit | null;
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  isHydrating: boolean;
  hydrationError: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  isVisible, 
  commit, 
  activeFilePath, 
  onSelectFile, 
  isHydrating, 
  hydrationError 
}) => {
  return (
    <div className={`${isVisible ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 border-r border-white/5 bg-black/30 flex-col shrink-0 overflow-hidden`}>
      <div className="p-4 lg:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
        <h3 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Modified Assets</h3>
        <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] lg:text-[10px] font-mono text-slate-400">
          {isHydrating ? '...' : commit?.diffs.length || 0}
        </span>
      </div>
      <div className="flex-1 overflow-auto py-4 lg:py-6 px-3 lg:px-4 space-y-1 lg:space-y-2 custom-scrollbar">
        {isHydrating ? (
          <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : hydrationError ? (
          <div className="p-6 text-center">
            <p className="text-red-400 text-[10px] font-bold uppercase mb-2">Sync Error</p>
            <p className="text-slate-600 text-[9px] uppercase leading-tight">{hydrationError}</p>
          </div>
        ) : (
          commit?.diffs.map((d, i) => (
            <div 
              key={i} 
              onClick={() => onSelectFile(d.path)}
              className={`flex items-center gap-3 lg:gap-4 text-[10px] lg:text-[11px] p-3 lg:p-4 rounded-xl lg:rounded-2xl cursor-pointer transition-all border ${
                activeFilePath === d.path ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 font-bold' : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
              }`}
            >
              <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full shrink-0 ${d.changes === 'added' ? 'bg-green-500' : d.changes === 'removed' ? 'bg-red-500' : 'bg-blue-500'}`} />
              <span className="truncate flex-1 font-mono">{d.path}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
