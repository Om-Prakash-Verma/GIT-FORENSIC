
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Commit, RepositoryMetadata, AIAnalysis, ImpactData } from '../types.ts';
import { GitService } from '../services/gitService.ts';
import { GeminiService } from '../services/geminiService.ts';
import { DependencyService } from '../services/dependencyService.ts';

const STORAGE_KEY_REPO = 'git-forensics-repo-state';

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
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrationError, setHydrationError] = useState<string | null>(null);
  
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [isMappingImpact, setIsMappingImpact] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('auto');

  const gemini = useMemo(() => new GeminiService(), []);
  
  // Use a ref to track the last commit that was actually selected to prevent clearing state during hydration
  const lastAnalyzedHash = useRef<string | null>(null);
  const currentSelectedHash = useRef<string | null>(null);

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
        setIsLoaded(true);
      } catch (e) {
        console.error("[useGitRepo] Failed to restore repo session", e);
      }
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isLoaded && metadata) {
      localStorage.setItem(STORAGE_KEY_REPO, JSON.stringify({
        metadata, commits, selectedHash, activeFilePath
      }));
    }
  }, [isLoaded, metadata, commits, selectedHash, activeFilePath]);

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
    setHydrationError(null);
    currentSelectedHash.current = null;
    lastAnalyzedHash.current = null;
  }, []);

  // Sync effect for selected hash changes
  useEffect(() => {
    if (!selectedHash || commits.length === 0 || !metadata) return;
    
    // Only clear analysis and impact data if we actually switched to a DIFFERENT hash
    if (currentSelectedHash.current !== selectedHash) {
      console.log(`[useGitRepo] Context switched to ${selectedHash.substring(0, 8)}. Resetting forensic cache.`);
      setAnalysis(null);
      setImpactData(null);
      setHydrationError(null);
      currentSelectedHash.current = selectedHash;
    }

    const commitIdx = commits.findIndex(c => c.hash === selectedHash);
    const commit = commits[commitIdx];
    if (!commit) return;

    const prepareCommit = async () => {
      let activeCommit = commit;
      
      // Lazy-load diffs if missing
      if (commit.diffs.length === 0 && metadata.path.includes('github.com')) {
        setIsHydrating(true);
        try {
          activeCommit = await GitService.hydrateCommitDiffs(metadata.path, commit);
          setCommits(prevCommits => {
            const newCommits = [...prevCommits];
            const idx = newCommits.findIndex(c => c.hash === selectedHash);
            if (idx !== -1) newCommits[idx] = activeCommit;
            return newCommits;
          });
        } catch (err: any) {
          setHydrationError(err.message);
        } finally {
          setIsHydrating(false);
        }
      }

      // Generate impact graph if diffs are available and graph is missing
      if (activeCommit.diffs.length > 0 && !impactData) {
        setIsMappingImpact(true);
        try {
          const impact = await DependencyService.buildImpactGraph(metadata.path, activeCommit.hash, activeCommit.diffs);
          setImpactData(impact);
        } catch (e) {
          console.error("[useGitRepo] Impact mapping failed:", e);
        } finally {
          setIsMappingImpact(false);
        }
      }
    };

    prepareCommit();
  }, [selectedHash, metadata?.path]);

  // Handle active file selection
  useEffect(() => {
    const commit = commits.find(c => c.hash === selectedHash);
    if (commit && commit.diffs.length > 0) {
      if (!activeFilePath || !commit.diffs.find(d => d.path === activeFilePath)) {
        setActiveFilePath(commit.diffs[0].path);
      }
    } else {
      setActiveFilePath(null);
    }
  }, [selectedHash, commits.length]);

  const analyzeCommit = async () => {
    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit || commit.diffs.length === 0 || isAnalyzing) {
      console.warn("[useGitRepo] Analysis skipped: Context missing or busy.");
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log(`[useGitRepo] Dispatching audit request for ${selectedHash.substring(0, 8)} | Target: ${selectedModel}`);
      const result = await gemini.analyzeCommit(commit, selectedModel);
      
      // Double check that we are still on the same hash before updating state
      if (currentSelectedHash.current === selectedHash) {
        console.log("[useGitRepo] Commit audit succeeded. Updating UI state.");
        setAnalysis(result);
        lastAnalyzedHash.current = selectedHash;
      } else {
        console.warn("[useGitRepo] Analysis discarded: Hash context changed during request.");
      }
      return true;
    } catch (err) {
      console.error("[useGitRepo] Critical failure in analysis dispatch:", err);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isLoaded, isPathLoading, repoPath, setRepoPath, metadata, commits,
    selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
    analysis, setAnalysis, isAnalyzing, isHydrating, hydrationError,
    impactData, isMappingImpact, selectedModel, setSelectedModel,
    loadRepository, resetRepo, analyzeCommit
  };
};
