
import React from 'react';
import LandingPage from './components/LandingPage.tsx';
import Workspace from './components/Workspace.tsx';
import { useGitRepo } from './hooks/useGitRepo.ts';
import { useGitBisect } from './hooks/useGitBisect.ts';

const App: React.FC = () => {
  const repo = useGitRepo();
  const { bisect, bisectStatuses, startBisect, markGood, markBad, resetBisect } = useGitBisect(
    repo.commits,
    repo.setSelectedHash
  );

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.repoPath.trim()) return;
    await repo.loadRepository(repo.repoPath);
  };

  const handleExit = () => {
    if (window.confirm("Are you sure you want to close this project? Unsaved forensic marks will be lost.")) {
      repo.resetRepo();
      resetBisect();
    }
  };

  if (!repo.isLoaded) {
    return (
      <LandingPage 
        repoPath={repo.repoPath} 
        setRepoPath={repo.setRepoPath} 
        onConnect={handleConnect} 
        isLoading={repo.isPathLoading} 
      />
    );
  }

  return (
    <Workspace 
      metadata={repo.metadata}
      commits={repo.commits}
      selectedHash={repo.selectedHash}
      setSelectedHash={repo.setSelectedHash}
      activeFilePath={repo.activeFilePath}
      setActiveFilePath={repo.setActiveFilePath}
      analysis={repo.analysis}
      isAnalyzing={repo.isAnalyzing}
      isHydrating={repo.isHydrating}
      hydrationError={repo.hydrationError}
      impactData={repo.impactData}
      isMappingImpact={repo.isMappingImpact}
      onAnalyze={repo.analyzeCommit}
      onExit={handleExit}
      bisect={bisect}
      bisectStatuses={bisectStatuses}
      onMarkGood={markGood}
      onMarkBad={markBad}
      onToggleBisect={bisect.isActive ? resetBisect : () => repo.selectedHash && startBisect(repo.selectedHash)}
      selectedModel={repo.selectedModel}
      setSelectedModel={repo.setSelectedModel}
    />
  );
};

export default App;
