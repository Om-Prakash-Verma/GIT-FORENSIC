
import React from 'react';
import { Commit, AIAnalysis } from '../types.ts';
import { Icons } from '../constants.tsx';
import { AnalysisStep } from '../hooks/useGitRepo.ts';

interface CommitInfoProps {
  commit: Commit | null;
  analysis: AIAnalysis | null;
  loading: boolean;
  analysisStep: AnalysisStep;
  onAnalyze: () => void;
  selectedModel: string;
  setSelectedModel: (m: string) => void;
}

const STEP_LABELS: Record<AnalysisStep, string> = {
  idle: 'Forensic Audit Standby',
  hydrating: 'Hydrating Patch Data...',
  mapping: 'Mapping Logic Deltas...',
  thinking: 'Allocating 32k Thinking Budget...',
  synthesizing: 'Synthesizing Report...',
  done: 'Audit Complete',
  error: 'Forensic System Failure'
};

const CommitInfo: React.FC<CommitInfoProps> = ({ 
  commit, analysis, loading, analysisStep, onAnalyze, selectedModel, setSelectedModel 
}) => {
  if (!commit) return null;

  const currentCategory = analysis?.category || commit.category || 'logic';
  const isHeuristic = analysis?.summary.toLowerCase().includes('heuristic');

  const models = [
    { id: 'auto', name: 'Gemini 3 Pro (Deep)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (32k)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#020617] overflow-y-auto custom-scrollbar relative">
      <div className="sticky top-0 z-20 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 p-6 lg:p-8 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-black text-amber-500 uppercase tracking-[0.2em]">
              Forensic Node
            </div>
            <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] font-black text-slate-500 uppercase tracking-widest">
              ID: <span className="text-slate-300 font-mono">{commit.hash.substring(0, 8)}</span>
            </div>
          </div>
          <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-slate-800 text-slate-400 border border-slate-700">
             {currentCategory}
          </div>
        </div>
        <h2 className="text-lg lg:text-xl font-bold text-white mb-6 leading-tight line-clamp-3">
          {commit.message}
        </h2>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 font-black text-lg shadow-inner ring-1 ring-white/5">
            {commit.author[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">{commit.author}</p>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-0.5">
              {new Date(commit.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8 space-y-8 flex-1 pb-24 min-h-0">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Impact', val: `+${commit.stats.insertions}`, color: 'text-green-500' },
            { label: 'Deltas', val: `-${commit.stats.deletions}`, color: 'text-red-500' },
            { label: 'Entropy', val: commit.stats.filesChanged, color: 'text-blue-500' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-[8px] font-black text-slate-600 uppercase mb-1 tracking-widest">{stat.label}</p>
              <p className={`text-xs font-mono font-black ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <Icons.Brain className={`w-4 h-4 text-amber-500 ${loading ? 'animate-pulse' : ''}`} />
              Forensic Intelligence
            </h3>
            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-200 px-3 py-1.5 outline-none focus:border-amber-500/50 cursor-pointer appearance-none text-center"
            >
              {models.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white py-2">
                  {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {analysis ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {isHeuristic && (
                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                   <Icons.Alert className="w-4 h-4 text-red-400 shrink-0" />
                   <span className="text-[9px] font-black uppercase text-red-400 tracking-tighter">AI Reasoning Unavailable - Using Heuristic Fallback</span>
                 </div>
               )}

               <div className="p-5 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <h4 className="text-[9px] font-black uppercase text-amber-500 tracking-widest">Architectural Pivot</h4>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-semibold">
                  {analysis.conceptualSummary}
                </p>
              </div>

               <div className="glass p-6 rounded-3xl space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Regression Risk Profile</p>
                    <p className="text-3xl font-black text-white">{analysis.probabilityScore}%</p>
                  </div>
                  <Icons.Alert className={`w-6 h-6 ${analysis.probabilityScore > 60 ? 'text-red-500' : 'text-amber-500'}`} />
                </div>
                <div className="w-full bg-slate-900/50 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div className={`h-full rounded-full transition-all duration-1000 ${analysis.probabilityScore > 60 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${analysis.probabilityScore}%` }} />
                </div>
              </div>

              {analysis.failureSimulation && (
                <div className="p-5 rounded-3xl border border-purple-500/20 bg-purple-500/5 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Icons.Alert className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <h4 className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Failure Path Simulation</h4>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed font-medium bg-black/40 p-4 rounded-2xl border border-white/5">
                    <span className="text-purple-400 font-black mr-2">FIRST BREAK:</span>
                    {analysis.failureSimulation}
                  </p>
                </div>
              )}

              {analysis.hiddenCouplings && analysis.hiddenCouplings.length > 0 && (
                <div className="p-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="p-1.5 bg-cyan-500/20 rounded-lg text-cyan-400">
                      <Icons.Impact className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-[9px] font-black uppercase text-cyan-400 tracking-widest">Hidden Coupling Scan</h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.hiddenCouplings.map((coupling, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                        <p className="text-[10px] text-slate-300 font-mono font-medium tracking-tight">{coupling}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-white/5">
                <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Technical Intent</h4>
                <p className="text-xs text-slate-400 leading-relaxed font-medium px-1">{analysis.summary}</p>
              </div>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 group cursor-pointer" onClick={onAnalyze}>
                <Icons.Brain className={`w-8 h-8 text-slate-700 group-hover:text-amber-500 transition-colors ${loading ? 'animate-pulse' : ''}`} />
              </div>
              <button 
                onClick={onAnalyze}
                disabled={loading || !commit.diffs.length}
                className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl disabled:opacity-50 active:scale-95 relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? 'Crunching Deep Audit...' : 'Run Forensic Audit'}
                </span>
              </button>
              {loading && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => <div key={i} className="w-1 h-1 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />)}
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                    {STEP_LABELS[analysisStep]}
                  </p>
                  {selectedModel.includes('pro') && (
                    <span className="text-[7px] text-amber-500/60 font-black uppercase tracking-[0.2em] animate-pulse">
                      High-End Reasoning Active
                    </span>
                  )}
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
