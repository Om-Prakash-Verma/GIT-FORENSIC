
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Commit, BisectState, BisectStatus } from '../types.ts';
import { BisectEngine } from '../services/gitService.ts';

const STORAGE_KEY_BISECT = 'git-forensics-bisect-state';

export const useGitBisect = (commits: Commit[], onMidpointSelected: (hash: string) => void) => {
  const [bisect, setBisect] = useState<BisectState & { remaining?: number; steps?: number }>({
    isActive: false,
    goodHash: null,
    badHash: null,
    currentMidpoint: null,
    eliminatedHashes: new Set<string>(),
    suspectedHash: null,
    history: []
  });

  // Recovery
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BISECT);
    if (saved) {
      console.log("[useGitBisect] Recovering bisect state from localStorage");
      try {
        const parsed = JSON.parse(saved);
        setBisect({
          ...parsed,
          eliminatedHashes: new Set<string>(parsed.eliminatedHashes)
        });
        console.log(`[useGitBisect] Recovered bisect session. Status: ${parsed.isActive ? 'Active' : 'Idle'}`);
      } catch (e) {
        console.error("[useGitBisect] Failed to restore bisect session", e);
      }
    }
  }, []);

  // Save
  useEffect(() => {
    if (bisect.isActive) {
      console.debug("[useGitBisect] Saving active bisect state");
      localStorage.setItem(STORAGE_KEY_BISECT, JSON.stringify({
        ...bisect,
        eliminatedHashes: Array.from(bisect.eliminatedHashes)
      }));
    } else {
      localStorage.removeItem(STORAGE_KEY_BISECT);
    }
  }, [bisect]);

  const runBisectLogic = useCallback((good: string, bad: string, eliminated: Set<string>, currentState: Partial<BisectState>) => {
    console.log(`[useGitBisect] Executing step calculation for Good: ${good.substring(0, 7)}, Bad: ${bad.substring(0, 7)}`);
    const { midpoint, suspected, remaining, estimatedSteps } = BisectEngine.calculateStep(commits, good, bad, eliminated);
    
    setBisect(prev => ({
      ...prev,
      ...currentState,
      currentMidpoint: midpoint,
      suspectedHash: suspected,
      remaining,
      steps: estimatedSteps
    }));
    
    if (suspected) {
      console.info(`[useGitBisect] Binary search converged! Culprit: ${suspected.substring(0, 8)}`);
      onMidpointSelected(suspected);
    } else if (midpoint) {
      console.log(`[useGitBisect] Midpoint suggested: ${midpoint.substring(0, 8)}`);
      onMidpointSelected(midpoint);
    } else {
      console.warn("[useGitBisect] No midpoint or suspected hash found in calculation.");
    }
  }, [commits, onMidpointSelected]);

  const startBisect = (initialBadHash: string) => {
    console.log(`[useGitBisect] Starting binary search with initial Bad Hash: ${initialBadHash.substring(0, 8)}`);
    if (commits.length < 2) {
      console.error("[useGitBisect] Not enough commits to start bisect.");
      return;
    }
    const first = commits[commits.length - 1].hash;
    const last = initialBadHash;
    const newState: any = { isActive: true, goodHash: first, badHash: last, currentMidpoint: null, eliminatedHashes: new Set<string>(), suspectedHash: null, history: [] };
    runBisectLogic(first, last, new Set<string>(), newState);
  };

  const markGood = () => {
    if (!bisect.currentMidpoint) return;
    console.log(`[useGitBisect] User marked current midpoint ${bisect.currentMidpoint.substring(0, 8)} as GOOD`);
    const newEliminated = new Set<string>(bisect.eliminatedHashes);
    const goodIdx = commits.findIndex(c => c.hash === bisect.goodHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    
    console.debug(`[useGitBisect] Eliminating range between indices ${goodIdx} and ${midIdx}`);
    for (let i = Math.min(goodIdx, midIdx); i <= Math.max(goodIdx, midIdx); i++) newEliminated.add(commits[i].hash);
    
    const next = { goodHash: bisect.currentMidpoint, eliminatedHashes: newEliminated, history: [...bisect.history, { ...bisect, history: [] }] };
    runBisectLogic(bisect.currentMidpoint!, bisect.badHash!, newEliminated, next);
  };

  const markBad = () => {
    if (!bisect.currentMidpoint) return;
    console.log(`[useGitBisect] User marked current midpoint ${bisect.currentMidpoint.substring(0, 8)} as BAD`);
    const newEliminated = new Set<string>(bisect.eliminatedHashes);
    const badIdx = commits.findIndex(c => c.hash === bisect.badHash);
    const midIdx = commits.findIndex(c => c.hash === bisect.currentMidpoint);
    
    console.debug(`[useGitBisect] Eliminating range between indices ${badIdx} and ${midIdx}`);
    for (let i = Math.min(badIdx, midIdx); i <= Math.max(badIdx, midIdx); i++) newEliminated.add(commits[i].hash);
    
    const next = { badHash: bisect.currentMidpoint, eliminatedHashes: newEliminated, history: [...bisect.history, { ...bisect, history: [] }] };
    runBisectLogic(bisect.goodHash!, bisect.currentMidpoint!, newEliminated, next);
  };

  const resetBisect = useCallback(() => {
    console.log("[useGitBisect] Manual reset of bisect session.");
    setBisect({ isActive: false, goodHash: null, badHash: null, currentMidpoint: null, eliminatedHashes: new Set<string>(), suspectedHash: null, history: [] });
    localStorage.removeItem(STORAGE_KEY_BISECT);
  }, []);

  const bisectStatuses = useMemo(() => {
    const statuses: Record<string, BisectStatus> = {};
    if (bisect.goodHash) statuses[bisect.goodHash] = BisectStatus.GOOD;
    if (bisect.badHash) statuses[bisect.badHash] = BisectStatus.BAD;
    if (bisect.suspectedHash) statuses[bisect.suspectedHash] = BisectStatus.SUSPECTED;
    bisect.eliminatedHashes.forEach(h => { if (!statuses[h]) statuses[h] = BisectStatus.SKIPPED; });
    return statuses;
  }, [bisect]);

  return { bisect, bisectStatuses, startBisect, markGood, markBad, resetBisect };
};
