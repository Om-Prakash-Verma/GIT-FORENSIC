
import React from 'react';
import { Icons } from '../constants.tsx';

interface LandingPageProps {
  repoPath: string;
  setRepoPath: (path: string) => void;
  onConnect: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ repoPath, setRepoPath, onConnect, isLoading }) => {
  return (
    <div className="min-h-screen w-screen bg-[#020617] flex flex-col items-center justify-center p-6 selection:bg-amber-500/20 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="text-center">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-black font-black text-4xl md:text-5xl mx-auto mb-8 md:mb-10 shadow-[0_0_50px_rgba(251,191,36,0.15)] rotate-3 border-4 md:border-8 border-black/10 transition-transform cursor-default">
            GT
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
            GIT <span className="text-amber-500 italic">FORENSICS</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium tracking-[0.2em] uppercase">Enterprise-Grade Time-Travel Debugger</p>
        </div>

        <form onSubmit={onConnect} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl space-y-8 md:space-y-10 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-all duration-700" />
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-5">Repository Asset Location</label>
            <input 
              type="text" 
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="https://github.com/facebook/react.git"
              className="w-full bg-black/60 border border-slate-800/80 rounded-2xl px-6 py-5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all font-mono placeholder:text-slate-800"
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading || !repoPath}
            className="w-full py-5 md:py-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_20px_40px_rgba(251,191,36,0.1)] flex items-center justify-center gap-4 active:scale-95"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                Synchronizing...
              </>
            ) : (
              <>
                <Icons.GitBranch className="w-5 h-5" /> Import Repository
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LandingPage;
