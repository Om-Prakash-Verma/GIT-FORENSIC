
import React from 'react';
import { Commit, AIAnalysis } from '../types.ts';
import { Icons, COLORS } from '../constants.tsx';

interface CommitInfoProps {
  commit: Commit | null;
  analysis: AIAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}

const CommitInfo: React.FC<CommitInfoProps> = ({ commit, analysis, loading, onAnalyze }) => {
  if (!commit) return null;

  const getScoreColor = (score: number) => {
    if (score > 75) return 'text-red-500';
    if (score > 45) return 'text-amber-500';
    return 'text-green-500';
  };

  const getScoreBg = (score: number) => {
    if (score > 75) return 'bg-red-500';
    if (score > 45) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-[400px] border-l border-slate-800/60 bg-[#020617] flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/20 to-transparent">
        <div className="flex items-center justify-between mb-4">
          <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">
            Commit Metadata
          </div>
          <span className="text-[10px] font-mono text-slate-600 uppercase">{commit.hash.substring(0, 12)}</span>
        </div>
        <h2 className="text-xl font-bold text-white mb-4 line-clamp-2 leading-snug">
          {commit.message}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-black shadow-inner">
            {commit.author[0].toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">{commit.author}</p>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
              {new Date(commit.date).toLocaleDateString()} @ {new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Impact</p>
            <p className="text-xs font-mono font-bold text-green-500">+{commit.stats.insertions}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Deltas</p>
            <p className="text-xs font-mono font-bold text-red-500">-{commit.stats.deletions}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Files</p>
            <p className="text-xs font-mono font-bold text-white">{commit.stats.filesChanged}</p>
          </div>
        </div>

        {/* AI Forensic Analysis */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Icons.Brain className="w-4 h-4 text-amber-500" />
              Forensic Reasoning
            </h3>
            {loading && (
              <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>

          {analysis ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* Score Gauge */}
              <div className="bg-black border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] opacity-20 ${getScoreBg(analysis.probabilityScore)}`} />
                <div className="flex items-end justify-between mb-4 relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Regression Confidence</p>
                    <p className={`text-3xl font-black ${getScoreColor(analysis.probabilityScore)}`}>
                      {analysis.probabilityScore}<span className="text-lg opacity-50">%</span>
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[9px] font-black uppercase ${getScoreColor(analysis.probabilityScore)} border currentColor`}>
                    {analysis.probabilityScore > 75 ? 'Critical' : analysis.probabilityScore > 45 ? 'Elevated' : 'Nominal'}
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out ${getScoreBg(analysis.probabilityScore)} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
                    style={{ width: `${analysis.probabilityScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Contributing Factors</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.riskFactors.map((factor, i) => (
                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-400 font-medium">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">High-Level Summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {analysis.summary}
                </p>
              </div>

              {/* Logic Changes */}
              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Logic Deltas</h4>
                <div className="space-y-2">
                  {analysis.logicChanges.map((change, i) => (
                    <div key={i} className="flex gap-3 p-2 rounded-lg bg-slate-900/30 border border-slate-800/50 group hover:border-amber-500/30 transition-colors">
                      <div className="w-1 h-auto bg-amber-500/40 rounded-full group-hover:bg-amber-500" />
                      <p className="text-[11px] text-slate-400 leading-normal">{change}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Explanation */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Regression Risk Audit</h4>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "{analysis.bugRiskExplanation}"
                </p>
              </div>
            </div>
          ) : loading ? (
             <div className="space-y-4 pt-4">
               <div className="h-20 bg-slate-900/50 animate-pulse rounded-2xl" />
               <div className="h-4 bg-slate-900/50 animate-pulse rounded-full w-3/4" />
               <div className="h-4 bg-slate-900/50 animate-pulse rounded-full w-1/2" />
               <div className="space-y-2">
                 <div className="h-10 bg-slate-900/50 animate-pulse rounded-xl" />
                 <div className="h-10 bg-slate-900/50 animate-pulse rounded-xl" />
               </div>
             </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/5 border border-dashed border-amber-500/30 mb-6 flex items-center justify-center">
                 <Icons.Brain className="w-8 h-8 text-amber-500/40" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Forensic Data Available</p>
              
              <button 
                onClick={onAnalyze}
                disabled={!commit || commit.diffs.length === 0}
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-[0_10px_20px_rgba(251,191,36,0.1)] active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
              >
                <Icons.Brain className="w-4 h-4" />
                Run Logic Audit
              </button>
              
              <p className="text-[9px] text-slate-600 mt-4 uppercase tracking-tighter">AI Reasoning requires manual trigger to optimize throughput</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Spacer */}
      <div className="h-20 flex-shrink-0" />
    </div>
  );
};

export default CommitInfo;
