
import React, { useState } from 'react';
import { Commit, RepositoryMetadata, AIAnalysis, BisectStatus, BisectState } from '../types.ts';
import Timeline from './Timeline.tsx';
import DiffView from './DiffView.tsx';
import CommitInfo from './CommitInfo.tsx';
import NavigationSidebar from './NavigationSidebar.tsx';
import MainHeader from './MainHeader.tsx';
import FileExplorer from './FileExplorer.tsx';

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
  onAnalyze: () => void;
  onExit: () => void;
  bisect: BisectState;
  bisectStatuses: Record<string, BisectStatus>;
  onMarkGood: () => void;
  onMarkBad: () => void;
  onToggleBisect: () => void;
}

type MobileView = 'files' | 'diff' | 'analysis';

const Workspace: React.FC<WorkspaceProps> = ({
  metadata, commits, selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
  analysis, isAnalyzing, isHydrating, hydrationError, onAnalyze, onExit,
  bisect, bisectStatuses, onMarkGood, onMarkBad, onToggleBisect
}) => {
  const [mobileView, setMobileView] = useState<MobileView>('diff');
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
          
          <nav className="lg:hidden flex border-b border-white/5 bg-black/30 shrink-0 h-12">
            {(['files', 'diff', 'analysis'] as MobileView[]).map(view => (
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

             <div className={`${mobileView === 'diff' ? 'flex' : 'hidden'} lg:flex flex-1 overflow-hidden min-w-0 bg-black/40`}>
               <DiffView diffs={currentCommit?.diffs || []} activeFilePath={activeFilePath} />
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
