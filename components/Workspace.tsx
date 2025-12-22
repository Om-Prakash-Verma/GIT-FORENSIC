
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
      {/* Sidebar - Hidden on mobile, sticky on desktop */}
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
          {/* Timeline - Compact on mobile, larger on desktop */}
          <Timeline 
            commits={commits} selectedHash={selectedHash} onSelect={setSelectedHash}
            bisectStatuses={bisectStatuses}
            bisectRange={bisect.isActive ? { start: bisect.goodHash, end: bisect.badHash } : undefined}
          />
          
          {/* Status Bar */}
          <div className="bg-black/40 px-6 py-2 border-y border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
               <div className="flex items-center gap-2 shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Volatility Peaks</span>
               </div>
               <div className="hidden sm:flex items-center gap-2 shrink-0">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                 <span className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Stability Baselines</span>
               </div>
            </div>
            <p className="hidden md:block text-[8px] font-mono text-slate-700 uppercase">Engine: Gemini-3-Flash.LogicScanner-v3.2</p>
          </div>

          {/* Mobile Tab Navigation */}
          <nav className="lg:hidden flex border-b border-white/5 bg-black/30 shrink-0 h-14 overflow-x-auto no-scrollbar">
            {(['files', 'diff', 'impact', 'analysis'] as MobileView[]).map(view => (
              <button 
                key={view} 
                onClick={() => setMobileView(view)} 
                className={`flex-1 min-w-[80px] flex flex-col items-center justify-center gap-1 transition-all relative ${mobileView === view ? 'text-amber-500' : 'text-slate-500'}`}
              >
                <span className="text-[8px] font-black uppercase tracking-widest">{view}</span>
                {mobileView === view && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />}
              </button>
            ))}
          </nav>

          {/* Main Content Area - Grid that adapts */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
             {/* Left Panel: File Explorer */}
             <div className={`${mobileView === 'files' ? 'flex' : 'hidden'} lg:flex shrink-0 w-full lg:w-72 xl:w-80 h-full border-r border-white/5`}>
               <FileExplorer 
                 isVisible={true}
                 commit={currentCommit}
                 activeFilePath={activeFilePath}
                 onSelectFile={(path) => { setActiveFilePath(path); if (window.innerWidth < 1024) setMobileView('diff'); }}
                 isHydrating={isHydrating}
                 hydrationError={hydrationError}
               />
             </div>

             {/* Center Panel: Source / Impact */}
             <div className={`${(mobileView === 'diff' || mobileView === 'impact') ? 'flex' : 'hidden'} lg:flex flex-1 flex-col overflow-hidden min-w-0 bg-black/20`}>
                {/* View Switcher Tabs (Desktop Only) */}
                <div className="hidden lg:flex items-center gap-1 p-3 bg-black/20 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setCenterView('diff')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${centerView === 'diff' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/10' : 'text-slate-500 hover:bg-white/5'}`}
                  >
                    <Icons.History className="w-4 h-4" />
                    Source Diff
                  </button>
                  <button 
                    onClick={() => setCenterView('impact')}
                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${centerView === 'impact' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/10' : 'text-slate-500 hover:bg-white/5'}`}
                  >
                    <Icons.Impact className="w-4 h-4" />
                    Impact Graph
                  </button>
                </div>

                <div className="flex-1 relative overflow-hidden">
                  {(centerView === 'diff' && mobileView !== 'impact') ? (
                    <DiffView diffs={currentCommit?.diffs || []} activeFilePath={activeFilePath} />
                  ) : (
                    <ImpactGraph data={impactData} loading={isMappingImpact} />
                  )}
                </div>
             </div>

             {/* Right Panel: Analysis */}
             <div className={`${mobileView === 'analysis' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[380px] xl:w-[440px] flex-col shrink-0 h-full overflow-hidden border-l border-white/5 bg-[#020617]`}>
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
