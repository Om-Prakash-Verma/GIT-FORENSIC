
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

  const currentCategory = analysis?.category || commit.category || 'logic';

  return (
    <div className="w-full h-full border-l border-slate-800/60 bg-[#020617] flex flex-col overflow-y-auto custom-scrollbar">
      <div className="p-6 lg:p-8 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/20 to-transparent shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[9px] font-black text-amber-500 uppercase tracking-widest">
              Forensic Node
            </div>
            <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Pattern: <span className="text-white italic">{currentCategory}</span>
            </div>
          </div>
          <span className="text-[9px] lg:text-[10px] font-mono text-slate-600 uppercase">{commit.hash.substring(0, 12)}</span>
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-white mb-4 line-clamp-3 leading-snug">
          {commit.message}
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-black shadow-inner">
            {commit.author[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-200 truncate">{commit.author}</p>
            <p className="text-[9px] lg:text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
              {new Date(commit.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8 lg:space-y-10 flex-1">
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 lg:p-3 text-center">
            <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase mb-1">Impact</p>
            <p className="text-[10px] lg:text-xs font-mono font-bold text-green-500">+{commit.stats.insertions}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 lg:p-3 text-center">
            <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase mb-1">Deltas</p>
            <p className="text-[10px] lg:text-xs font-mono font-bold text-red-500">-{commit.stats.deletions}</p>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 lg:p-3 text-center">
            <p className="text-[8px] lg:text-[9px] font-black text-slate-500 uppercase mb-1">Files</p>
            <p className="text-[10px] lg:text-xs font-mono font-bold text-white">{commit.stats.filesChanged}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] lg:text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Icons.Brain className={`w-4 h-4 ${loading ? 'text-amber-500 animate-pulse' : 'text-amber-500'}`} />
              Forensic Audit
            </h3>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {analysis ? (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="p-4 lg:p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-amber-500 rounded flex items-center justify-center">
                     <Icons.Brain className="w-3 h-3 text-black" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Conceptual Shift</h4>
                </div>
                <p className="text-xs lg:text-[13px] text-slate-200 leading-relaxed font-semibold">
                  {analysis.conceptualSummary}
                </p>
              </div>

               <div className="bg-black border border-slate-800 p-4 lg:p-5 rounded-2xl relative overflow-hidden">
                <div className="flex items-end justify-between mb-4 relative z-10">
                  <div>
                    <p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Regression Risk</p>
                    <p className="text-2xl lg:text-3xl font-black text-amber-500">{analysis.probabilityScore}%</p>
                  </div>
                  <div className="px-2 py-0.5 rounded text-[8px] lg:text-[9px] font-black uppercase border border-amber-500 text-amber-500">
                    {analysis.category}
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${analysis.probabilityScore}%` }}></div>
                </div>
              </div>

              <div className="p-4 lg:p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Remediation Advisory</h4>
                </div>
                <div className="space-y-3">
                  {analysis.fixStrategies.map((strategy, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-blue-500 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                      <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{strategy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 lg:p-5 rounded-2xl border border-red-500/30 bg-red-500/5">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Alert className="w-4 h-4 text-red-500" />
                  <h4 className="text-[10px] font-black uppercase text-red-500">Forensic Danger Alert</h4>
                </div>
                <p className="text-[11px] lg:text-xs text-slate-200 font-mono italic p-3 bg-black/40 rounded-lg">"{analysis.dangerReasoning}"</p>
              </div>

              <div>
                <h4 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Intent</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{analysis.summary}</p>
              </div>

              <div>
                <h4 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Logic Deltas</h4>
                <div className="space-y-2">
                  {analysis.logicChanges.map((change, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800/50">
                      <div className="w-1 h-auto bg-amber-500/40 rounded-full" />
                      <p className="text-[10px] lg:text-[11px] text-slate-400 leading-normal">{change}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 lg:py-12 flex flex-col items-center justify-center text-center px-4">
              <button 
                onClick={onAnalyze}
                disabled={loading || !commit.diffs.length}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl disabled:opacity-50 active:scale-95 group overflow-hidden relative"
              >
                <div className={`absolute inset-0 bg-white/20 transition-transform duration-1000 ${loading ? 'translate-x-0' : '-translate-x-full'}`}></div>
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Icons.Brain className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Crunching Audit Data...' : 'Initiate Forensic Audit'}
                </span>
              </button>
              {loading && (
                <p className="mt-4 text-[9px] text-slate-500 uppercase font-black animate-pulse">Requesting Fast-Path Audit (max 15s)...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitInfo;
