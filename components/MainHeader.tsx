
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
    <header className="h-16 md:h-20 lg:h-24 border-b border-white/5 px-4 md:px-8 lg:px-12 flex items-center justify-between bg-black/40 backdrop-blur-xl shrink-0 relative z-40">
      <div className="flex items-center gap-4 lg:gap-8 min-w-0">
        <div className="lg:hidden w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-black font-black text-sm shrink-0 shadow-lg shadow-amber-500/20" onClick={onExit}>
          GT
        </div>
        <h1 className="hidden md:flex text-lg lg:text-2xl font-black tracking-tighter items-center gap-3 shrink-0 uppercase">
          GIT <span className="text-amber-500 italic">FORENSICS</span>
        </h1>
        <div className="hidden xl:block h-8 w-px bg-white/10" />
        <div className="flex flex-col min-w-0 max-w-[120px] md:max-w-[200px] lg:max-w-xs">
          <span className="text-[7px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5 truncate">Repository Trace</span>
          <span className="px-2 py-0.5 bg-white/5 border border-white/10 text-[9px] lg:text-[11px] text-slate-300 font-mono rounded-md truncate">
            {metadata?.name || 'Local Trace'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {bisectActive && (
          <div className="flex items-center gap-1.5 p-1 bg-black/60 rounded-xl lg:rounded-2xl border border-white/5 shadow-2xl">
            <button 
              onClick={onMarkGood} 
              className="px-3 lg:px-6 py-1.5 lg:py-2.5 bg-green-500/10 hover:bg-green-500 hover:text-black text-green-500 text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all active:scale-95"
            >
              Good
            </button>
            <button 
              onClick={onMarkBad} 
              className="px-3 lg:px-6 py-1.5 lg:py-2.5 bg-red-500/10 hover:bg-red-500 hover:text-black text-red-500 text-[8px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl transition-all active:scale-95"
            >
              Bad
            </button>
          </div>
        )}
        <button 
          onClick={onExit}
          className="p-2 lg:px-4 lg:py-2.5 border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/40 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 rounded-lg lg:rounded-xl transition-all active:scale-95 flex items-center gap-2"
        >
          <Icons.Close className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Close Trace</span>
        </button>
      </div>
    </header>
  );
};

export default MainHeader;
