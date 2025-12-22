
import React from 'react';
import { Icons } from '../constants.tsx';
import { RepositoryMetadata } from '../types.ts';

interface MainHeaderProps {
  metadata: RepositoryMetadata | null;
  bisectActive: boolean;
  onMarkGood: () => void;
  onMarkBad: () => void;
  onExit: () => void;
}

const MainHeader: React.FC<MainHeaderProps> = ({ metadata, bisectActive, onMarkGood, onMarkBad, onExit }) => {
  return (
    <header className="h-16 lg:h-24 border-b border-white/5 px-4 lg:px-12 flex items-center justify-between bg-black/20 backdrop-blur-2xl shrink-0">
      <div className="flex items-center gap-4 lg:gap-8 min-w-0">
        <h1 className="text-sm lg:text-2xl font-black tracking-tight flex items-center gap-2 lg:gap-4 shrink-0 uppercase">
          Git <span className="text-amber-500 italic">Forensics</span>
        </h1>
        <div className="hidden md:block h-10 w-px bg-white/5" />
        <div className="hidden sm:flex flex-col min-w-0">
          <span className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 lg:mb-1 truncate">Active Trace</span>
          <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-white/5 border border-white/10 text-[9px] lg:text-[11px] text-slate-300 font-mono rounded-lg max-w-[150px] lg:max-w-xs truncate">
            {metadata?.path}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        {bisectActive && (
          <div className="flex items-center gap-1 lg:gap-3 p-1 lg:p-2 bg-black/60 rounded-xl lg:rounded-[1.5rem] border border-white/5 shadow-2xl">
            <button onClick={onMarkGood} className="px-3 lg:px-6 py-1.5 lg:py-2.5 bg-green-500/10 hover:bg-green-500 hover:text-black text-green-500 text-[8px] lg:text-[11px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all">Good</button>
            <button onClick={onMarkBad} className="px-3 lg:px-6 py-1.5 lg:py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-black text-red-500 text-[8px] lg:text-[11px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all">Bad</button>
          </div>
        )}
        <button 
          onClick={onExit}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/40 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 rounded-xl transition-all active:scale-95"
        >
          <Icons.Close className="w-3.5 h-3.5" />
          Close Project
        </button>
      </div>
    </header>
  );
};

export default MainHeader;
