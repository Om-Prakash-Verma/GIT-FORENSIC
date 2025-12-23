import React, { useState, useEffect } from 'react';
import { Commit, RepositoryMetadata, AIAnalysis, BisectStatus, BisectState, ImpactData } from '../types.ts';
import Timeline from './Timeline.tsx';
import DiffView from './DiffView.tsx';
import CommitInfo from './CommitInfo.tsx';
import ImpactGraph from './ImpactGraph.tsx';
import NavigationSidebar from './NavigationSidebar.tsx';
import MainHeader from './MainHeader.tsx';
import FileExplorer from './FileExplorer.tsx';
import { Icons } from '../constants.tsx';

interface WorkspaceProps {
  metadata: RepositoryMetadata | null;
  commits: Commit[];
  selectedHash: string | null;
  setSelectedHash: (hash: string) => void;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  analysis: AIAnalysis | null;
  isAnalyzing: boolean;
  isHydrating: boolean;
  hydrationError: string | null;
  impactData: ImpactData | null;
  isMappingImpact: boolean;
  onAnalyze: () => void;
  onExit: () => void;
  bisect: BisectState;
  bisectStatuses: Record<string, BisectStatus>;
  onMarkGood: () => void;
  onMarkBad: () => void;
  onToggleBisect: () => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

type MobileView = 'files' | 'diff' | 'impact' | 'analysis';
type CenterView = 'diff' | 'impact';

const Workspace: React.FC<WorkspaceProps> = ({
  metadata, commits, selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
  analysis, isAnalyzing, isHydrating, hydrationError, impactData, isMappingImpact,
  onAnalyze, onExit, bisect, bisectStatuses, onMarkGood, onMarkBad, onToggleBisect,
  selectedModel, setSelectedModel
}) => {
  const [mobileView, setMobileView] = useState<MobileView>('diff');
  const [centerView, setCenterView] = useState<CenterView>('diff');
  const [isCenterExpanded, setIsCenterExpanded] = useState(false);
  const currentCommit = commits.find(c => c.hash === selectedHash) || null;

  const handleAnalyzeWithTransition = async () => {
    await onAnalyze();
    // Auto-switch on mobile to show the analysis result
    if (window.innerWidth < 1024) setMobileView('analysis');
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30">
      <NavigationSidebar 
        bisectActive={bisect.isActive} 
        onExit={onExit} 
        onToggleBisect={onToggleBisect} 
      />

      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] overflow-hidden relative">
        <MainHeader 
          metadata={metadata} 
          bisectActive={bisect.isActive} 
          onMarkGood={onMarkGood} 
          onMarkBad={onMarkBad} 
          onExit={onExit} 
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <Timeline 
            commits={commits} selectedHash={selectedHash} onSelect={setSelectedHash}
            bisectStatuses={bisectStatuses}
            bisectRange={bisect.isActive ? { start: bisect.goodHash, end: bisect.badHash } : undefined}
          />
          
          <div className="bg-black/60 px-6 py-2 border-y border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-2 shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Volatility Peaks</span>
               </div>
               <div className="hidden sm:flex items-center gap-2 shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                 <span className="text-[7px] lg:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Stability Baseline</span>
               </div>
            </div>
            <p className="hidden md:block text-[7px] font-mono text-slate-600 uppercase tracking-widest">Forensic Engine: V3.5-PRO-ENABLED</p>
          </div>

          {/* Mobile Tab Navigation */}
          <nav className="lg:hidden grid grid-cols-4 border-b border-white/5 bg-[#020617] shrink-0 h-16">
            {(['files', 'diff', 'impact', 'analysis'] as MobileView[]).map(view => (
              <button 
                key={view} 
                onClick={() => setMobileView(view)} 
                className={`flex flex-col items-center justify-center gap-1.5 transition-all relative ${mobileView === view ? 'text-amber-500 bg-white/[0.03]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <div className="text-[7px] font-black uppercase tracking-[0.2em]">{view}</div>
                {mobileView === view && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                )}
              </button>
            ))}
          </nav>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
             {/* Panel 1: File Explorer */}
             <div className={`${mobileView === 'files' ? 'flex' : 'hidden'} lg:${isCenterExpanded ? 'hidden' : 'flex'} shrink-0 w-full lg:w-64 xl:w-72 2xl:w-80 h-full transition-all duration-300 ease-in-out`}>
               <FileExplorer 
                 isVisible={true}
                 commit={currentCommit}
                 activeFilePath={activeFilePath}
                 onSelectFile={(path) => { setActiveFilePath(path); if (window.innerWidth < 1024) setMobileView('diff'); }}
                 isHydrating={isHydrating}
                 hydrationError={hydrationError}
               />
             </div>

             {/* Panel 2: Center Content (Diff / Impact Graph) */}
             <div className={`${(mobileView === 'diff' || mobileView === 'impact') ? 'flex' : 'hidden'} lg:flex flex-1 flex-col overflow-hidden min-w-0 bg-black/40`}>
                <div className="hidden lg:flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/5 shrink-0 backdrop-blur-md">
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setCenterView('diff')}
                      className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${centerView === 'diff' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icons.History className="w-3.5 h-3.5" />
                      Trace Diff
                    </button>
                    <button 
                      onClick={() => setCenterView('impact')}
                      className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 ${centerView === 'impact' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icons.Impact className="w-3.5 h-3.5" />
                      Blast Radius
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setIsCenterExpanded(!isCenterExpanded)}
                    title={isCenterExpanded ? "Restore Sidebars" : "Full Viewport"}
                    className={`p-2.5 rounded-xl border transition-all ${isCenterExpanded ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'border-white/5 text-slate-500 hover:bg-white/5'}`}
                  >
                    {isCenterExpanded ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"></path></svg>
                    )}
                  </button>
                </div>

                <div className="flex-1 relative overflow-hidden bg-[#020617]/40">
                  {/* Tablet specific layout adjustment: merge mobile view logic into center view logic */}
                  {(centerView === 'diff' && mobileView !== 'impact') || (mobileView === 'diff') ? (
                    <DiffView diffs={currentCommit?.diffs || []} activeFilePath={activeFilePath} />
                  ) : (
                    <ImpactGraph data={impactData} loading={isMappingImpact} />
                  )}
                </div>
             </div>

             {/* Panel 3: Forensic Intelligence */}
             <div className={`${mobileView === 'analysis' ? 'flex' : 'hidden'} lg:${isCenterExpanded ? 'hidden' : 'flex'} w-full lg:w-[360px] xl:w-[400px] 2xl:w-[460px] flex-col shrink-0 h-full overflow-hidden transition-all duration-300 ease-in-out`}>
               <CommitInfo 
                 commit={currentCommit} analysis={analysis} loading={isAnalyzing || isHydrating}
                 onAnalyze={handleAnalyzeWithTransition}
                 selectedModel={selectedModel}
                 setSelectedModel={setSelectedModel}
               />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Workspace;
