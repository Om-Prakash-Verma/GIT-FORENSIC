
import React, { useState, useEffect, useMemo } from 'react';
import { Commit, BisectState, BisectStatus, AIAnalysis, RepositoryMetadata } from './types.ts';
import { GitService, BisectEngine } from './services/gitService.ts';
import { GeminiService } from './services/geminiService.ts';
import Timeline from './components/Timeline.tsx';
import DiffView from './components/DiffView.tsx';
import CommitInfo from './components/CommitInfo.tsx';

// Decomposed Sub-components
import LandingPage from './components/LandingPage.tsx';
import NavigationSidebar from './components/NavigationSidebar.tsx';
import MainHeader from './components/MainHeader.tsx';
import FileExplorer from './components/FileExplorer.tsx';

const STORAGE_KEY = 'git-forensics-state';
type MobileView = 'files' | 'diff' | 'analysis';

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPathLoading, setIsPathLoading] = useState(false);
  const [repoPath, setRepoPath] = useState('');
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>('diff');
  
  const [bisect, setBisect] = useState<BisectState & { remaining?: number; steps?: number }>({
    isActive: false,
    goodHash: null,
    badHash: null,
    currentMidpoint: null,
    eliminatedHashes: new Set<string>(),
    suspectedHash: null,
    history: []
  });

  const gemini = useMemo(() => new GeminiService(), []);

  // Persistent State Recovery
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMetadata(parsed.metadata);
        setCommits(parsed.commits);
        setSelectedHash(parsed.selectedHash);
        setBisect({
          ...parsed.bisect,
          eliminatedHashes: new Set<string>(parsed.bisect.eliminatedHashes)
        });
        setIsLoaded(true);
      } catch (e) {
        console.error("Failed to restore forensic session", e);
      }
    }
  }, []);

  // Save State on Change
  useEffect(() => {
    if (isLoaded && metadata) {
      const stateToSave = {
        metadata,
        commits,
        selectedHash,
        bisect: {
          ...bisect,
          eliminatedHashes: Array.from(bisect.eliminatedHashes)
        }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [isLoaded, metadata, commits, selectedHash, bisect]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoPath.trim()) return;
    
    setIsPathLoading(true);
    try {
      const { metadata, commits } = await GitService.loadRepository(repoPath);
      setMetadata(metadata);
      setCommits(commits);
      if (commits.length > 0) setSelectedHash(commits[0].hash);
      setIsLoaded(true);
    } catch (err: any) {
      alert(`Import Error: ${err.message}`);
    } finally {
      setIsPathLoading(false);
    }
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to close this project? Unsaved forensic marks will be lost.")) {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoaded(false);
      setMetadata(null);
      setCommits([]);
      setSelectedHash(null);
      setAnalysis(null);
      setBisect({
        isActive: false, goodHash: null, badHash: null, currentMidpoint: null,
        eliminatedHashes: new Set<string>(), suspectedHash: null, history: []
      });
      setActiveFilePath(null);
      setRepoPath('');
      setHydrationError(null);
    }
  };

  useEffect(() => {
    if (!selectedHash || commits.length === 0 || !metadata) return;
    const commitIdx = commits.findIndex(c => c.hash === selectedHash);
    const commit = commits[commitIdx];
    if (!commit) return;

    setAnalysis(null);
    setHydrationError(null);

    const prepareCommit = async () => {
      if (commit.diffs.length === 0 && metadata.path.includes('github.com')) {
        setIsHydrating(true);
        try {
          const hydrated = await GitService.hydrateCommitDiffs(metadata.path, commit);
          const newCommits = [...commits];
          newCommits[commitIdx] = hydrated;
          setCommits(newCommits);
        } catch (err: any) {
          console.error("Hydration failed", err);
          setHydrationError(err.message);
        } finally {
          setIsHydrating(false);
        }
      }

      const activeCommit = commits[commitIdx];
      if (activeCommit.diffs.length > 0) {
        if (!activeFilePath || !activeCommit.diffs.find(d => d.path === activeFilePath)) {
          setActiveFilePath(activeCommit.diffs[0].path);
        }
      } else {
        setActiveFilePath(null);
      }
    };
    prepareCommit();
  }, [selectedHash, metadata]);

  const handleAnalyzeCommit = async () => {
    if (!selectedHash || commits.length === 0 || isAnalyzing) return;
    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit || commit.diffs.length === 0) return;

    setIsAnalyzing(true);
    try {
      const result = await gemini.analyzeCommit(commit);
      setAnalysis(result);
      if (window.innerWidth < 1024) setMobileView('analysis');
    } catch (err) {
      console.error("Analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startBisect = () => {
    if (!selectedHash || commits.length < 2) return;
    const first = commits[commits.length - 1].hash;
    const last = commits[0].hash;
    const newState: any = { isActive: true, goodHash: first, badHash: last, currentMidpoint: null, eliminatedHashes: new Set<string>(), suspectedHash: null, history: [] };
    setBisect(newState);
    runBisectLogic(first, last, new Set<string>(), newState);
  };

  const runBisectLogic = (good: string, bad: string, eliminated: Set<string>, currentState: any) => {
    const { midpoint, suspected, remaining, estimatedSteps } = BisectEngine.calculateStep(commits, good, bad, eliminated);
    setBisect(prev => ({ ...prev, ...currentState, currentMidpoint: midpoint, suspectedHash: suspected, remaining, steps: estimatedSteps }));
    if (suspected) setSelectedHash(suspected);
    else if (midpoint) setSelectedHash(midpoint);
  };

  const markGood = () => {
    if (!bisect.currentMidpoint) return;
    const newEliminated = new Set<string>(bisect.eliminatedHashes);
    const goodIdx = commits.findIndex(c => c.hash === bisect.goodHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    for (let i = Math.min(goodIdx, midIdx); i <= Math.max(goodIdx, midIdx); i++) newEliminated.add(commits[i].hash);
    const next = { goodHash: bisect.currentMidpoint, eliminatedHashes: newEliminated, history: [...bisect.history, { ...bisect, history: [] }] };
    runBisectLogic(bisect.currentMidpoint!, bisect.badHash!, newEliminated, next);
  };

  const markBad = () => {
    if (!bisect.currentMidpoint) return;
    const newEliminated = new Set<string>(bisect.eliminatedHashes);
    const badIdx = commits.findIndex(c => c.hash === bisect.badHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    for (let i = Math.min(badIdx, midIdx); i <= Math.max(badIdx, midIdx); i++) newEliminated.add(commits[i].hash);
    const next = { badHash: bisect.currentMidpoint, eliminatedHashes: newEliminated, history: [...bisect.history, { ...bisect, history: [] }] };
    runBisectLogic(bisect.goodHash!, bisect.currentMidpoint!, newEliminated, next);
  };

  const resetBisect = () => setBisect({ isActive: false, goodHash: null, badHash: null, currentMidpoint: null, eliminatedHashes: new Set<string>(), suspectedHash: null, history: [] });

  const bisectStatuses = useMemo(() => {
    const statuses: Record<string, BisectStatus> = {};
    if (bisect.goodHash) statuses[bisect.goodHash] = BisectStatus.GOOD;
    if (bisect.badHash) statuses[bisect.badHash] = BisectStatus.BAD;
    if (bisect.suspectedHash) statuses[bisect.suspectedHash] = BisectStatus.SUSPECTED;
    bisect.eliminatedHashes.forEach(h => { if (!statuses[h]) statuses[h] = BisectStatus.SKIPPED; });
    return statuses;
  }, [bisect]);

  const currentCommit = commits.find(c => c.hash === selectedHash) || null;

  if (!isLoaded) {
    return <LandingPage repoPath={repoPath} setRepoPath={setRepoPath} onConnect={handleConnect} isLoading={isPathLoading} />;
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      <NavigationSidebar 
        bisectActive={bisect.isActive} 
        onExit={handleExit} 
        onToggleBisect={bisect.isActive ? resetBisect : startBisect} 
      />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <MainHeader 
          metadata={metadata} 
          bisectActive={bisect.isActive} 
          onMarkGood={markGood} 
          onMarkBad={markBad} 
          onExit={handleExit} 
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
                 onAnalyze={handleAnalyzeCommit}
               />
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
