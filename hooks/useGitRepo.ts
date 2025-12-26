
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Commit, RepositoryMetadata, AIAnalysis, ImpactData } from '../types.ts';
import { GitService } from '../services/gitService.ts';
import { GeminiService } from '../services/geminiService.ts';
import { DependencyService } from '../services/dependencyService.ts';

const STORAGE_KEY_REPO = 'git-forensics-repo-state';

export type AnalysisStep = 'idle' | 'hydrating' | 'mapping' | 'thinking' | 'synthesizing' | 'done' | 'error';

export const useGitRepo = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPathLoading, setIsPathLoading] = useState(false);
  const [repoPath, setRepoPath] = useState('');
  const [metadata, setMetadata] = useState<RepositoryMetadata | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<AnalysisStep>('idle');
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [isMappingImpact, setIsMappingImpact] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  
  const [auditHistory, setAuditHistory] = useState<Record<string, string>>({});
  const currentHashRef = useRef<string | null>(null);

  // Persistence: Recovery
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REPO);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMetadata(parsed.metadata);
        setCommits(parsed.commits);
        setSelectedHash(parsed.selectedHash);
        setActiveFilePath(parsed.activeFilePath);
        setAuditHistory(parsed.auditHistory || {});
        setIsLoaded(true);
      } catch (e) { console.error(e); }
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isLoaded && metadata) {
      const prunedCommits = commits.map(c => ({
        ...c, diffs: c.diffs.map(d => ({ ...d, patch: '', hunks: [] }))
      }));
      localStorage.setItem(STORAGE_KEY_REPO, JSON.stringify({
        metadata, commits: prunedCommits, selectedHash, activeFilePath, auditHistory
      }));
    }
  }, [isLoaded, metadata, commits, selectedHash, activeFilePath, auditHistory]);

  const loadRepository = async (path: string) => {
    setIsPathLoading(true);
    try {
      const data = await GitService.loadRepository(path);
      setMetadata(data.metadata);
      setCommits(data.commits);
      if (data.commits.length > 0) setSelectedHash(data.commits[0].hash);
      setIsLoaded(true);
      return true;
    } catch (err: any) {
      alert(`Import Error: ${err.message}`);
      return false;
    } finally {
      setIsPathLoading(false);
    }
  };

  const resetRepo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_REPO);
    setIsLoaded(false);
    setMetadata(null);
    setCommits([]);
    setSelectedHash(null);
    setAnalysis(null);
    setActiveFilePath(null);
    setImpactData(null);
    setRepoPath('');
    setAuditHistory({});
    setAnalysisStep('idle');
  }, []);

  useEffect(() => {
    if (!selectedHash || commits.length === 0 || !metadata) return;
    
    if (currentHashRef.current !== selectedHash) {
      setAnalysis(null);
      setImpactData(null);
      setHydrationError(null);
      setAnalysisStep('idle');
      currentHashRef.current = selectedHash;
    }

    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit) return;

    const prepareCommit = async () => {
      let activeCommit = commit;
      if (commit.diffs.length === 0 || !commit.diffs[0].patch) {
        setIsHydrating(true);
        try {
          activeCommit = await GitService.hydrateCommitDiffs(metadata.path, commit);
          setCommits(prev => {
            const next = [...prev];
            const idx = next.findIndex(c => c.hash === selectedHash);
            if (idx !== -1) next[idx] = activeCommit;
            return next;
          });
        } catch (err: any) { setHydrationError(err.message); }
        finally { setIsHydrating(false); }
      }

      if (activeCommit.diffs.length > 0 && !impactData) {
        setIsMappingImpact(true);
        try {
          const impact = await DependencyService.buildImpactGraph(metadata.path, activeCommit.hash, activeCommit.diffs);
          setImpactData(impact);
        } catch (e) { console.error(e); }
        finally { setIsMappingImpact(false); }
      }
    };
    prepareCommit();
  }, [selectedHash, metadata?.path]);

  const analyzeCommit = async () => {
    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit || commit.diffs.length === 0 || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisStep('thinking');
    try {
      const previousSummaries = Object.values(auditHistory).slice(-3).join('\n');
      
      // Simulate synthetic steps for UX
      setTimeout(() => setAnalysisStep('mapping'), 800);
      setTimeout(() => setAnalysisStep('synthesizing'), 2200);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commit, 
          model: selectedModel,
          previousAnalyses: previousSummaries
        })
      });

      if (!response.ok) throw new Error("Audit failed");
      const result = await response.json();
      
      if (currentHashRef.current === selectedHash) {
        setAnalysis(result);
        setAuditHistory(prev => ({ ...prev, [selectedHash]: result.conceptualSummary }));
        setAnalysisStep('done');
      }
      return true;
    } catch (err) {
      console.error(err);
      setAnalysisStep('error');
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isLoaded, isPathLoading, repoPath, setRepoPath, metadata, commits,
    selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
    analysis, setAnalysis, isAnalyzing, analysisStep, isHydrating, hydrationError,
    impactData, isMappingImpact, selectedModel, setSelectedModel,
    loadRepository, resetRepo, analyzeCommit
  };
};
