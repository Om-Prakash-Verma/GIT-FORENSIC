
import { useState, useEffect, useMemo, useCallback } from 'react';
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

  const gemini = useMemo(() => new GeminiService(), []);

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
        console.error("Failed to restore repo session", e);
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
  }, []);

  // Hydration and Impact logic
  useEffect(() => {
    if (!selectedHash || commits.length === 0 || !metadata) return;
    const commitIdx = commits.findIndex(c => c.hash === selectedHash);
    const commit = commits[commitIdx];
    if (!commit) return;

    setAnalysis(null);
    setImpactData(null);
    setHydrationError(null);

    const prepareCommit = async () => {
      let activeCommit = commit;
      if (commit.diffs.length === 0 && metadata.path.includes('github.com')) {
        setIsHydrating(true);
        try {
          activeCommit = await GitService.hydrateCommitDiffs(metadata.path, commit);
          const newCommits = [...commits];
          newCommits[commitIdx] = activeCommit;
          setCommits(newCommits);
        } catch (err: any) {
          setHydrationError(err.message);
        } finally {
          setIsHydrating(false);
        }
      }

      // Generate impact graph automatically on commit select
      if (activeCommit.diffs.length > 0) {
        setIsMappingImpact(true);
        try {
          const impact = await DependencyService.buildImpactGraph(metadata.path, activeCommit.hash, activeCommit.diffs);
          setImpactData(impact);
        } catch (e) {
          console.error("Impact mapping failed", e);
        } finally {
          setIsMappingImpact(false);
        }
      }
    };
    prepareCommit();
  }, [selectedHash, metadata?.path]);

  // Set initial active file when commit changes
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
    if (!selectedHash || commits.length === 0 || isAnalyzing) return;
    const commit = commits.find(c => c.hash === selectedHash);
    if (!commit || commit.diffs.length === 0) return;

    setIsAnalyzing(true);
    try {
      const result = await gemini.analyzeCommit(commit);
      setAnalysis(result);
      return true;
    } catch (err) {
      console.error("Analysis failed", err);
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isLoaded, isPathLoading, repoPath, setRepoPath, metadata, commits,
    selectedHash, setSelectedHash, activeFilePath, setActiveFilePath,
    analysis, setAnalysis, isAnalyzing, isHydrating, hydrationError,
    impactData, isMappingImpact,
    loadRepository, resetRepo, analyzeCommit
  };
};
