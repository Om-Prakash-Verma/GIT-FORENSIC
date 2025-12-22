
import React, { useState } from 'react';
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
}

type MobileView = 'files' | 'diff' | 'impact' | 'analysis';
type CenterView = 'diff' | 'impact';

const Workspace: React.FC<WorkspaceProps> = ({
  metadata, commits, selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
  analysis, isAnalyzing, isHydrating, hydrationError, impactData, isMappingImpact,
  onAnalyze, onExit, bisect, bisectStatuses, onMarkGood, onMarkBad, onToggleBisect
}) => {
  const [mobileView, setMobileView] = useState<MobileView>('diff');
  const [centerView, setCenterView] = useState<CenterView>('diff');
  const currentCommit = commits.find(c => c.hash === selectedHash) || null;

  const handleAnalyzeWithTransition = async () => {
    await onAnalyze();
    if (window.innerWidth < 1024) setMobileView('analysis');
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <NavigationSidebar 
        bisectActive={bisect.isActive} 
        onExit={onExit} 
        onToggleBisect={onToggleBisect} 
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
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
          
          <div className="bg-black/40 px-6 py-2 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volatility Peaks</span>
               </div>
               <div className="hidden md:flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-slate-700" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stability Baselines</span>
               </div>
            </div>
            <p className="text-[8px] font-mono text-slate-600 uppercase">Heuristic Depth: v3.2-VolatilityMatrix</p>
          </div>

          <nav className="lg:hidden flex border-b border-white/5 bg-black/30 shrink-0 h-12">
            {(['files', 'diff', 'impact', 'analysis'] as MobileView[]).map(view => (
              <button key={view} onClick={() => setMobileView(view)} className={`flex-1 flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all ${mobileView === view ? 'text-amber-500 bg-amber-500/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>
                {view}
              </button>
            ))}
          </nav>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
             <FileExplorer 
               isVisible={mobileView === 'files'}
               commit={currentCommit}
               activeFilePath={activeFilePath}
               onSelectFile={(path) => { setActiveFilePath(path); if (window.innerWidth < 1024) setMobileView('diff'); }}
               isHydrating={isHydrating}
               hydrationError={hydrationError}
             />

             <div className={`${(mobileView === 'diff' || mobileView === 'impact') ? 'flex' : 'hidden'} lg:flex flex-1 flex-col overflow-hidden min-w-0 bg-black/40`}>
                <div className="hidden lg:flex items-center gap-1 p-2 bg-black/20 border-b border-white/5">
                  <button 
                    onClick={() => setCenterView('diff')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${centerView === 'diff' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
                  >
                    <Icons.History className="w-3.5 h-3.5" />
                    Source Diff
                  </button>
                  <button 
                    onClick={() => setCenterView('impact')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${centerView === 'impact' ? 'bg-amber-500 text-black shadow-lg' : 'text-slate-500 hover:bg-white/5'}`}
                  >
                    <Icons.Impact className="w-3.5 h-3.5" />
                    Impact Graph
                  </button>
                </div>

                <div className="flex-1 relative">
                  {(centerView === 'diff' && mobileView !== 'impact') ? (
                    <DiffView diffs={currentCommit?.diffs || []} activeFilePath={activeFilePath} />
                  ) : (
                    <ImpactGraph data={impactData} loading={isMappingImpact} />
                  )}
                </div>
             </div>

             <div className={`${mobileView === 'analysis' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[400px] flex-col shrink-0 h-full overflow-hidden bg-[#020617]`}>
               <CommitInfo 
                 commit={currentCommit} analysis={analysis} loading={isAnalyzing || isHydrating}
                 onAnalyze={handleAnalyzeWithTransition}
               />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Workspace;
