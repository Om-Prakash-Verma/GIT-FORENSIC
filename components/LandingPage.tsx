
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
    <div className="min-h-screen w-screen bg-[#020617] flex flex-col items-center justify-center p-4 md:p-8 selection:bg-amber-500/20 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      
      <main className="w-full max-w-xl space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative z-10">
        <header className="text-center space-y-4">
          <div className="relative inline-block group" aria-hidden="true">
            <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all duration-700 opacity-0 group-hover:opacity-100" />
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-black font-black text-4xl md:text-6xl mx-auto shadow-2xl rotate-3 border-8 border-black/5 hover:rotate-0 transition-all duration-500 relative z-10">
              GT
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white">
              GIT <span className="text-amber-500 italic">FORENSICS</span>
            </h1>
            <h2 className="flex items-center justify-center gap-2">
              <div className="h-px w-8 bg-amber-500/30" />
              <p className="text-slate-500 text-[10px] md:text-xs font-black tracking-[0.4em] uppercase">Enterprise Root-Cause Debugger</p>
              <div className="h-px w-8 bg-amber-500/30" />
            </h2>
          </div>
        </header>

        <section>
          <form onSubmit={onConnect} className="glass p-8 md:p-14 rounded-[3rem] md:rounded-[4rem] shadow-2xl space-y-8 md:space-y-12 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label htmlFor="repo-input" className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Repository Trace Origin</label>
                <span className="text-[9px] font-mono text-amber-500/60 uppercase">GitHub Public API</span>
              </div>
              <div className="relative group/input">
                <input 
                  id="repo-input"
                  type="url" 
                  value={repoPath}
                  onChange={(e) => setRepoPath(e.target.value)}
                  placeholder="https://github.com/facebook/react"
                  className="w-full bg-black/40 border border-slate-800/80 rounded-2xl px-8 py-6 text-sm md:text-base text-white focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 transition-all font-mono placeholder:text-slate-800"
                  required
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within/input:text-amber-500/30 transition-colors">
                  <Icons.GitBranch className="w-5 h-5" />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !repoPath}
              className="w-full py-6 md:py-8 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_20px_50px_rgba(251,191,36,0.15)] flex items-center justify-center gap-4 active:scale-95 group/btn overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                    Connecting Trace...
                  </>
                ) : (
                  <>
                    <Icons.GitBranch className="w-5 h-5" /> Import Repository Trace
                  </>
                )}
              </span>
            </button>
          </form>
        </section>

        <footer className="text-center space-y-6">
          <p className="text-slate-600 text-[10px] uppercase font-bold tracking-widest px-8 leading-relaxed opacity-60">
            Powered by Gemini 3 Flash Reasoning & D3.js High-Fidelity Logic Mapping
          </p>
          <nav className="flex items-center justify-center gap-6">
            <a href="https://github.com/Om-Prakash-Verma/GIT-FORENSICS" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-widest transition-colors">Open Source</a>
            <span className="w-1 h-1 bg-slate-800 rounded-full" />
            <a href="/sitemap.xml" className="text-[9px] font-black text-slate-500 hover:text-amber-500 uppercase tracking-widest transition-colors">Sitemap</a>
          </nav>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
