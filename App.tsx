
import React, { useState, useEffect, useMemo } from 'react';
import { Commit, BisectState, BisectStatus, AIAnalysis, RepositoryMetadata } from './types.ts';
import { GitService, BisectEngine } from './services/gitService.ts';
import { GeminiService } from './services/geminiService.ts';
import { Icons, COLORS } from './constants.tsx';
import Timeline from './components/Timeline.tsx';
import DiffView from './components/DiffView.tsx';
import CommitInfo from './components/CommitInfo.tsx';

const STORAGE_KEY = 'git-forensics-state';

type MobileTab = 'diff' | 'files' | 'analysis';

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
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('diff');
  
  const [bisect, setBisect] = useState<BisectState & { remaining?: number; steps?: number }>({
    isActive: false,
    goodHash: null,
    badHash: null,
    currentMidpoint: null,
    eliminatedHashes: new Set(),
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
          eliminatedHashes: new Set(parsed.bisect.eliminatedHashes)
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

  const handleExit = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const confirmed = window.confirm("Are you sure you want to close this project? Unsaved forensic marks will be lost.");
    if (confirmed) {
      localStorage.removeItem(STORAGE_KEY);
      setIsLoaded(false);
      setMetadata(null);
      setCommits([]);
      setSelectedHash(null);
      setAnalysis(null);
      setBisect({
        isActive: false,
        goodHash: null,
        badHash: null,
        currentMidpoint: null,
        eliminatedHashes: new Set(),
        suspectedHash: null,
        history: []
      });
      setActiveFilePath(null);
    }
  };

  useEffect(() => {
    if (!selectedHash || commits.length === 0 || !metadata) return;
    
    const commitIdx = commits.findIndex(c => c.hash === selectedHash);
    const commit = commits[commitIdx];
    if (!commit) return;

    setAnalysis(null);

    const prepareCommit = async () => {
      if (commit.diffs.length === 0 && metadata.path.includes('github.com')) {
        setIsHydrating(true);
        try {
          const hydrated = await GitService.hydrateCommitDiffs(metadata.path, commit);
          const newCommits = [...commits];
          newCommits[commitIdx] = hydrated;
          setCommits(newCommits);
        } catch (err) {
          console.error("Hydration failed", err);
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
  }, [selectedHash, metadata, commits.length]);

  const handleAnalyzeCommit = async () => {
    if (!selectedHash || commits.length === 0 || isAnalyzing) return;
    
    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit || commit.diffs.length === 0) return;

    setIsAnalyzing(true);
    try {
      const result = await gemini.analyzeCommit(commit);
      setAnalysis(result);
      // On mobile, automatically switch to analysis tab to show results
      if (window.innerWidth < 1024) setMobileTab('analysis');
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
    const newState: any = {
      isActive: true,
      goodHash: first,
      badHash: last,
      currentMidpoint: null,
      eliminatedHashes: new Set(),
      suspectedHash: null,
      history: []
    };
    setBisect(newState);
    runBisectLogic(first, last, new Set(), newState);
  };

  const runBisectLogic = (good: string, bad: string, eliminated: Set<string>, currentState: any) => {
    const { midpoint, suspected, remaining, estimatedSteps } = BisectEngine.calculateStep(commits, good, bad, eliminated);
    
    setBisect(prev => ({
      ...prev,
      ...currentState,
      currentMidpoint: midpoint,
      suspectedHash: suspected,
      remaining,
      steps: estimatedSteps
    }));

    if (suspected) setSelectedHash(suspected);
    else if (midpoint) setSelectedHash(midpoint);
  };

  const markGood = () => {
    if (!bisect.currentMidpoint) return;
    const newEliminated = new Set(bisect.eliminatedHashes);
    const goodIdx = commits.findIndex(c => c.hash === bisect.goodHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    const start = Math.min(goodIdx, midIdx);
    const end = Math.max(goodIdx, midIdx);
    for (let i = start; i <= end; i++) newEliminated.add(commits[i].hash);
    
    const next = { 
      goodHash: bisect.currentMidpoint, 
      eliminatedHashes: newEliminated,
      history: [...bisect.history, { ...bisect, history: [] }]
    };
    runBisectLogic(bisect.currentMidpoint!, bisect.badHash!, newEliminated, next);
  };

  const markBad = () => {
    if (!bisect.currentMidpoint) return;
    const newEliminated = new Set(bisect.eliminatedHashes);
    const badIdx = commits.findIndex(c => c.hash === bisect.badHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    const start = Math.min(badIdx, midIdx);
    const end = Math.max(badIdx, midIdx);
    for (let i = start; i <= end; i++) newEliminated.add(commits[i].hash);

    const next = { 
      badHash: bisect.currentMidpoint, 
      eliminatedHashes: newEliminated,
      history: [...bisect.history, { ...bisect, history: [] }]
    };
    runBisectLogic(bisect.goodHash!, bisect.currentMidpoint!, newEliminated, next);
  };

  const resetBisect = () => {
    setBisect({ isActive: false, goodHash: null, badHash: null, currentMidpoint: null, eliminatedHashes: new Set(), suspectedHash: null, history: [] });
  };

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
    return (
      <div className="min-h-screen w-screen bg-[#020617] flex flex-col items-center justify-center p-4 selection:bg-amber-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="w-full max-w-md space-y-6 sm:space-y-8 animate-in fade-in zoom-in duration-700 relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-black font-black text-4xl sm:text-5xl mx-auto mb-6 sm:mb-10 shadow-[0_0_50px_rgba(251,191,36,0.15)] rotate-3 border-4 sm:border-8 border-black/10 transition-transform cursor-default">
              GT
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-2 sm:mb-4 uppercase">
              Git <span className="text-amber-500 italic">Forensics</span>
            </h1>
            <p className="text-slate-500 text-[10px] sm:text-sm font-medium tracking-[0.2em] uppercase">Enterprise-Grade Time-Travel Debugger</p>
          </div>

          <form onSubmit={handleConnect} className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl space-y-8 sm:space-y-10 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full group-hover:bg-amber-500/20 transition-all duration-700" />
            <div>
              <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-4 sm:mb-5">Repository Asset Location</label>
              <input 
                type="text" 
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="https://github.com/facebook/react.git"
                className="w-full bg-black/60 border border-slate-800/80 rounded-xl sm:rounded-2xl px-5 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-4 sm:focus:ring-8 focus:ring-amber-500/5 transition-all font-mono placeholder:text-slate-800"
              />
            </div>
            <button 
              type="submit"
              disabled={isPathLoading || !repoPath}
              className="w-full py-4 sm:py-6 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl transition-all shadow-[0_20px_40px_rgba(251,191,36,0.1)] flex items-center justify-center gap-4 active:scale-[0.96]"
            >
              {isPathLoading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 sm:border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                  Synchronizing...
                </>
              ) : (
                <>
                  <Icons.GitBranch className="w-4 h-4 sm:w-5 sm:h-5" /> Import Repository
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200 flex-col lg:flex-row">
      {/* Sidebar - Horizontal on Mobile, Vertical on Desktop */}
      <aside className="h-16 lg:h-full w-full lg:w-20 border-b lg:border-r border-white/5 flex lg:flex-col items-center justify-between lg:justify-start lg:py-10 px-6 lg:px-0 lg:gap-10 bg-black/40 backdrop-blur-3xl z-50">
        <div 
          className="w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-2xl shadow-amber-500/20 cursor-pointer hover:rotate-6 active:scale-90 transition-all border-2 lg:border-4 border-black/5"
          onClick={handleExit}
        >
          GT
        </div>
        <div className="flex lg:flex-col gap-3 lg:gap-6">
           <button className="p-3 lg:p-4 text-amber-500 bg-amber-500/5 border border-amber-500/10 rounded-xl lg:rounded-2xl hover:bg-amber-500/10 transition-all shadow-inner" title="History">
            <Icons.History className="w-5 h-5" />
          </button>
          <button 
            className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl transition-all border ${bisect.isActive ? 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 'text-slate-500 hover:text-amber-500 border-transparent hover:bg-white/5'}`} 
            onClick={bisect.isActive ? resetBisect : startBisect}
          >
            <Icons.Search className="w-5 h-5" />
          </button>
        </div>
        <div className="lg:hidden" /> {/* Spacer for flex justify-between on mobile */}
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        <header className="h-20 sm:h-24 border-b border-white/5 px-4 sm:px-12 flex items-center justify-between bg-black/20 backdrop-blur-2xl shrink-0">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight shrink-0">
              GIT <span className="text-amber-500 italic">FORENSICS</span>
            </h1>
            <div className="hidden sm:block h-10 w-px bg-white/5" />
            <div className="flex flex-col min-w-0">
              <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 sm:mb-1 truncate">Active Trace</span>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-white/5 border border-white/10 text-[9px] sm:text-[11px] text-slate-300 font-mono rounded-lg max-w-[120px] sm:max-w-xs truncate">
                {metadata?.path}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             {bisect.isActive && (
                <div className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 bg-black/60 rounded-xl sm:rounded-[1.5rem] border border-white/5 shadow-2xl">
                  <button 
                    onClick={markGood} 
                    disabled={!!bisect.suspectedHash}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500/10 hover:bg-green-500 hover:text-black text-green-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all disabled:opacity-10"
                  >
                    Good
                  </button>
                  <button 
                    onClick={markBad} 
                    disabled={!!bisect.suspectedHash}
                    className="px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500/10 hover:bg-red-500 hover:text-black text-red-500 text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl transition-all disabled:opacity-10"
                  >
                    Bad
                  </button>
                </div>
              )}
              <button 
                onClick={handleExit}
                className="flex items-center gap-2 px-3 py-2 border border-white/5 bg-white/5 hover:bg-red-500/10 hover:border-red-500/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-400 rounded-xl transition-all group"
              >
                <Icons.Close className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:scale-110" />
                <span className="hidden sm:inline">Close</span>
              </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Timeline 
            commits={commits} 
            selectedHash={selectedHash} 
            onSelect={setSelectedHash}
            bisectStatuses={bisectStatuses}
            bisectRange={bisect.isActive ? { start: bisect.goodHash, end: bisect.badHash } : undefined}
          />
          
          {/* Main Layout: Tabbed on small screens, Multi-column on desktop */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
             
             {/* Mobile Tab Navigation */}
             <div className="lg:hidden flex border-b border-white/5 bg-black/40 shrink-0">
               <button 
                 onClick={() => setMobileTab('diff')}
                 className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mobileTab === 'diff' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
               >
                 Diff
               </button>
               <button 
                 onClick={() => setMobileTab('files')}
                 className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mobileTab === 'files' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
               >
                 Files
               </button>
               <button 
                 onClick={() => setMobileTab('analysis')}
                 className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mobileTab === 'analysis' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500'}`}
               >
                 Analysis
               </button>
             </div>

             {/* Assets List Panel */}
             <div className={`w-full lg:w-80 border-r border-white/5 bg-black/30 flex flex-col lg:flex ${mobileTab === 'files' ? 'flex' : 'hidden lg:flex'}`}>
               <div className="p-4 lg:p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                 <h3 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Changed Assets</h3>
                 <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] lg:text-[10px] font-mono text-slate-400">
                   {isHydrating ? '...' : currentCommit?.diffs.length}
                 </span>
               </div>
               <div className="flex-1 overflow-auto py-4 lg:py-6 px-3 lg:px-4 space-y-1 lg:space-y-2 custom-scrollbar">
                 {isHydrating ? (
                   <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                 ) : (
                   currentCommit?.diffs.map((d, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setActiveFilePath(d.path); if(window.innerWidth < 1024) setMobileTab('diff'); }}
                      className={`flex items-center gap-3 lg:gap-4 text-[10px] lg:text-[11px] p-3 lg:p-4 rounded-xl lg:rounded-2xl cursor-pointer group transition-all border ${
                        activeFilePath === d.path ? 'bg-amber-500/5 border-amber-500/20 text-amber-500 font-bold' : 'border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${d.changes === 'added' ? 'bg-green-500' : d.changes === 'removed' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <span className="truncate flex-1 font-mono">{d.path}</span>
                    </div>
                   ))
                 )}
               </div>
             </div>

             {/* Diff View Panel */}
             <div className={`flex-1 flex min-w-0 ${mobileTab === 'diff' ? 'flex' : 'hidden lg:flex'}`}>
               <DiffView diffs={currentCommit?.diffs || []} activeFilePath={activeFilePath} />
             </div>

             {/* Analysis Panel */}
             <div className={`w-full lg:w-[400px] shrink-0 ${mobileTab === 'analysis' ? 'flex' : 'hidden lg:flex'}`}>
               <CommitInfo 
                 commit={currentCommit} 
                 analysis={analysis} 
                 loading={isAnalyzing || isHydrating}
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
