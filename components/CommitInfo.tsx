
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
              <Icons.Brain className="w-4 h-4 text-amber-500" />
              Forensic Audit
            </h3>
            {loading && <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>}
          </div>

          {analysis ? (
            <div className="space-y-6 lg:space-y-8">
               {/* Conceptual Summary View */}
               <div className="p-4 lg:p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent relative group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-md flex items-center justify-center">
                     <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>
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

              {/* New: Remediation Advisory Section */}
              <div className="p-4 lg:p-5 rounded-2xl border border-blue-500/30 bg-blue-500/5 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-blue-500/20 rounded">
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
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

                <div className="pt-2 border-t border-blue-500/10">
                  <p className="text-[8px] font-bold text-slate-500 uppercase italic">
                    Note: Advisory Only. No code will be auto-applied.
                  </p>
                </div>
              </div>

              <div className="p-4 lg:p-5 rounded-2xl border border-red-500/30 bg-red-500/5 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Icons.Alert className="w-4 h-4 text-red-500" />
                  <h4 className="text-[10px] font-black uppercase text-red-500">Forensic Danger Alert</h4>
                </div>
                <p className="text-[11px] lg:text-xs text-slate-200 font-mono italic">"{analysis.dangerReasoning}"</p>
              </div>

              <div>
                <h4 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Technical Intent</h4>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{analysis.summary}</p>
              </div>

              <div>
                <h4 className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Logic Deltas</h4>
                <div className="space-y-2">
                  {analysis.logicChanges.map((change, i) => (
                    <div key={i} className="flex gap-3 p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
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
                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Icons.Brain className="w-4 h-4" />
                Analyze Pattern
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitInfo;
