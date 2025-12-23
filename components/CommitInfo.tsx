import React, { useEffect } from 'react';
import { Commit, AIAnalysis } from '../types.ts';
import { Icons } from '../constants.tsx';

interface CommitInfoProps {
  commit: Commit | null;
  analysis: AIAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

const CommitInfo: React.FC<CommitInfoProps> = ({ 
  commit, analysis, loading, onAnalyze, selectedModel, setSelectedModel 
}) => {
  useEffect(() => {
    if (analysis) {
      console.log("[CommitInfo] Forensic data hydration complete.");
    }
  }, [analysis]);

  if (!commit) return null;

  const currentCategory = analysis?.category || commit.category || 'logic';
  const isHeuristic = analysis?.summary.toLowerCase().includes('heuristic');

  const models = [
    { id: 'auto', name: 'Auto Optimized' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#020617] overflow-y-auto custom-scrollbar relative border-l border-white/5">
      {/* Sticky Header with Meta Info */}
      <div className="sticky top-0 z-30 bg-slate-900/60 backdrop-blur-2xl border-b border-white/5 p-5 md:p-6 lg:p-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-black text-amber-500 uppercase tracking-[0.2em]">
              Forensic Audit
            </div>
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[7px] font-black text-slate-500 uppercase tracking-widest font-mono">
              SHA: <span className="text-slate-300">{commit.hash.substring(0, 8)}</span>
            </div>
          </div>
          <div className="px-2 py-1 rounded text-[7px] font-black uppercase bg-slate-800/50 text-slate-400 border border-slate-700/50">
             {currentCategory}
          </div>
        </div>
        <h2 className="text-base md:text-lg lg:text-xl font-bold text-white mb-6 leading-tight line-clamp-3 tracking-tight">
          {commit.message}
        </h2>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-black text-sm shadow-inner">
              {commit.author[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-100 truncate">{commit.author}</p>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-tighter mt-0.5">
                {new Date(commit.date).toLocaleDateString()} • {new Date(commit.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Diff Stats</span>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-green-500">+{commit.stats.insertions}</span>
              <span className="text-red-500">-{commit.stats.deletions}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 lg:p-8 space-y-8 flex-1 pb-32">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Icons.Brain className={`w-4 h-4 text-amber-500 ${loading ? 'animate-pulse' : ''}`} />
              Forensic Intelligence
            </h3>
            <div className="relative">
              <select 
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-300 pl-3 pr-8 py-1.5 outline-none focus:border-amber-500/50 cursor-pointer appearance-none transition-all hover:bg-slate-800"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    {m.name.toUpperCase()}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          {analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
               {isHeuristic && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                   <Icons.Alert className="w-4 h-4 text-red-400 shrink-0" />
                   <span className="text-[8px] font-black uppercase text-red-400 tracking-tighter">AI Reasoning Latency - Applied Heuristic Fallback</span>
                 </div>
               )}

               {/* 1. Architectural Pivot Card */}
               <div className="relative group">
                 <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-transparent rounded-[2rem] blur opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                 <div className="relative p-6 rounded-[2rem] border border-amber-500/20 bg-[#020617] space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#fbbf24]" />
                      <h4 className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Architectural Pivot</h4>
                    </div>
                    <p className="text-sm text-slate-100 leading-relaxed font-semibold italic">
                      "{analysis.conceptualSummary}"
                    </p>
                  </div>
               </div>

               {/* 2. Risk Meter */}
               <div className="p-6 rounded-[2rem] border border-white/5 bg-white/[0.02] space-y-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Regression Risk Profile</p>
                    <p className="text-3xl font-black text-white tracking-tighter">{analysis.probabilityScore}%</p>
                  </div>
                  <div className={`p-2 rounded-xl ${analysis.probabilityScore > 60 ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    <Icons.Alert className="w-6 h-6" />
                  </div>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${analysis.probabilityScore > 60 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`} style={{ width: `${analysis.probabilityScore}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-medium opacity-80">
                  {analysis.bugRiskExplanation}
                </p>
              </div>

              {/* 3. Failure Simulation (Terminal Style) */}
              {analysis.failureSimulation && (
                <div className="p-6 rounded-[2rem] border border-purple-500/20 bg-purple-500/[0.03] space-y-4 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Icons.Brain className="w-20 h-20 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-3 relative">
                     <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Icons.Alert className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h4 className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Forensic Failure Path</h4>
                  </div>
                  <div className="p-4 bg-black/60 rounded-2xl border border-white/5 font-mono">
                    <div className="flex gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                    </div>
                    <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                      <span className="text-purple-400 font-black mr-2">PREDICTION:</span>
                      {analysis.failureSimulation}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Hidden Couplings (Grid List) */}
              {analysis.hiddenCouplings && analysis.hiddenCouplings.length > 0 && (
                <div className="p-6 rounded-[2rem] border border-cyan-500/20 bg-cyan-500/[0.03] space-y-5">
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">
                      <Icons.Impact className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">Ghost Dependencies</h4>
                  </div>
                  <div className="grid gap-2">
                    {analysis.hiddenCouplings.map((coupling, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5 group hover:border-cyan-500/30 transition-all">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 group-hover:bg-cyan-500 transition-colors" />
                        <p className="text-[9px] text-slate-300 font-mono tracking-tight line-clamp-2">{coupling}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Remediation Protocol (Steps) */}
              {analysis.fixStrategies && analysis.fixStrategies.length > 0 && (
                <div className="p-6 rounded-[2rem] border border-blue-500/20 bg-blue-500/[0.03] space-y-6">
                  <h4 className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Remediation Protocol</h4>
                  <div className="space-y-4">
                    {analysis.fixStrategies.map((strategy, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/5">
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400">
                          {i + 1}
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-relaxed">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Trace Footer */}
              <div className="space-y-3 pt-6 border-t border-white/5">
                <h4 className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex justify-between">
                  <span>Logic Trace Summary</span>
                  <span>v3.5.0-Gemini</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium px-1 italic">
                  {analysis.summary}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-16 md:py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="relative mb-10">
                <div className="absolute -inset-8 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-900 border-2 border-slate-800 rounded-full flex items-center justify-center relative z-10 group cursor-pointer" onClick={onAnalyze}>
                  <Icons.Brain className={`w-10 h-10 md:w-12 md:h-12 text-slate-700 group-hover:text-amber-500 transition-all duration-500 ${loading ? 'animate-pulse scale-110' : 'group-hover:scale-110'}`} />
                </div>
              </div>
              
              <div className="space-y-4 max-w-xs mx-auto mb-10">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Audit Pending</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-tighter">
                  Initiate a deep forensic reasoning pass on this commit's architectural impact.
                </p>
              </div>

              <button 
                onClick={onAnalyze}
                disabled={loading || !commit.diffs.length}
                className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:opacity-50 text-black font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl active:scale-[0.98] relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-700" />
                <span className="relative z-10">
                  {loading ? 'Crunching Audit...' : 'Run Forensic Audit'}
                </span>
              </button>
              
              {loading && (
                <div className="mt-8 space-y-2">
                  <p className="text-[8px] text-amber-500/60 uppercase font-black animate-pulse tracking-[0.2em]">Allocating Thinking Budget...</p>
                  <div className="w-32 h-0.5 bg-slate-800 mx-auto rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommitInfo;
