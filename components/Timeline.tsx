
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Commit, BisectStatus, CommitCategory } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface TimelineProps {
  commits: Commit[];
  selectedHash: string | null;
  onSelect: (hash: string) => void;
  bisectStatuses: Record<string, BisectStatus>;
  bisectRange?: { start: string | null; end: string | null };
}

const CATEGORY_COLORS: Record<CommitCategory, string> = {
  logic: '#fbbf24', 
  feat: '#10b981', 
  fix: '#ef4444', 
  refactor: '#8b5cf6', 
  dependency: '#06b6d4', 
  style: '#64748b', 
  chore: '#475569'  
};

const Timeline: React.FC<TimelineProps> = ({ commits, selectedHash, onSelect, bisectStatuses, bisectRange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeFilters, setActiveFilters] = useState<Set<CommitCategory>>(new Set(['logic', 'feat', 'fix', 'refactor', 'dependency', 'style', 'chore']));
  const [showHeatmap, setShowHeatmap] = useState(true);

  const toggleFilter = (cat: CommitCategory) => {
    const next = new Set(activeFilters);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setActiveFilters(next);
  };

  const filteredCommits = useMemo(() => {
    return commits.map(c => ({
      ...c,
      isFiltered: !activeFilters.has(c.category || 'logic')
    }));
  }, [commits, activeFilters]);

  useEffect(() => {
    if (!svgRef.current || commits.length === 0) return;

    const isMobile = window.innerWidth < 640;
    const width = svgRef.current.clientWidth;
    const height = isMobile ? 120 : 180;
    const margin = { top: 60, right: 100, bottom: 40, left: 100 };
    
    const nodeSpacing = isMobile ? 70 : 100;
    const timelineWidth = Math.max(width, commits.length * nodeSpacing) - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = d3.select(svgRef.current);
    container.selectAll("*").remove();

    const svg = container.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(commits.map(c => c.hash))
      .range([0, timelineWidth]);

    // --- Technical Debt Heatmap Layer ---
    if (showHeatmap) {
      const riskData = commits.map((c, i) => {
        // Calculate rolling average for smoothing
        const windowSize = 3;
        const start = Math.max(0, i - windowSize);
        const end = Math.min(commits.length - 1, i + windowSize);
        const neighborhood = commits.slice(start, end + 1);
        const avgRisk = d3.mean(neighborhood, n => n.volatilityScore) || 0;
        return { hash: c.hash, risk: avgRisk };
      });

      const yRisk = d3.scaleLinear()
        .domain([0, 100])
        .range([innerHeight, -20]);

      const areaGenerator = d3.area<{ hash: string, risk: number }>()
        .x(d => x(d.hash) || 0)
        .y0(innerHeight)
        .y1(d => yRisk(d.risk))
        .curve(d3.curveMonotoneX);

      const defs = svg.append("defs");
      const riskGradient = defs.append("linearGradient")
        .attr("id", "risk-gradient")
        .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
      
      riskGradient.append("stop").attr("offset", "0%").attr("stop-color", "#ef4444").attr("stop-opacity", 0.3);
      riskGradient.append("stop").attr("offset", "100%").attr("stop-color", "#fbbf24").attr("stop-opacity", 0);

      svg.append("path")
        .datum(riskData)
        .attr("fill", "url(#risk-gradient)")
        .attr("d", areaGenerator)
        .attr("class", "animate-in fade-in duration-700");
    }

    // --- Backbone ---
    svg.append("line")
      .attr("x1", 0).attr("x2", timelineWidth)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight)
      .attr("stroke", "#1e293b").attr("stroke-width", 2);

    const commitGroup = svg.selectAll(".commit")
      .data(filteredCommits)
      .enter()
      .append("g")
      .attr("class", "commit")
      .attr("transform", d => `translate(${x(d.hash)},${innerHeight})`)
      .style("cursor", "pointer")
      .style("opacity", d => d.isFiltered ? 0.2 : 1)
      .on("click", (_, d) => onSelect(d.hash));

    // Outer ring (Bisect status)
    commitGroup.append("circle")
      .attr("r", 12)
      .attr("fill", "transparent")
      .attr("stroke", d => {
        const status = bisectStatuses[d.hash];
        if (status === BisectStatus.GOOD) return COLORS.success;
        if (status === BisectStatus.BAD) return COLORS.error;
        return "transparent";
      })
      .attr("stroke-width", 2);

    // Node Circle (Categorized)
    commitGroup.append("circle")
      .attr("r", d => d.hash === selectedHash ? 7 : 5)
      .attr("fill", d => CATEGORY_COLORS[d.category || 'logic'])
      .attr("stroke", "#020617")
      .attr("stroke-width", 2);

    // Heatmap Tick (Vertical Line indicating individual risk)
    if (showHeatmap) {
      commitGroup.append("line")
        .attr("y1", 0)
        .attr("y2", d => -Math.min(d.volatilityScore, 60))
        .attr("stroke", d => d.volatilityScore > 70 ? "#ef4444" : "#475569")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,2")
        .attr("opacity", 0.4);
    }

    // Hash Labels
    commitGroup.append("text")
      .attr("y", 25).attr("text-anchor", "middle")
      .attr("fill", d => d.hash === selectedHash ? COLORS.gold : "#64748b")
      .attr("font-size", "9px").attr("font-family", "Fira Code")
      .text(d => d.hash.substring(0, 7));

    if (selectedHash) {
      const selectedX = x(selectedHash) || 0;
      svgRef.current?.parentElement?.scrollTo({ left: selectedX + margin.left - width / 2, behavior: 'smooth' });
    }
  }, [filteredCommits, selectedHash, onSelect, bisectStatuses, bisectRange, showHeatmap]);

  return (
    <div className="w-full flex flex-col bg-[#020617] border-b border-slate-800 shrink-0">
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Clusters:</span>
          {(Object.keys(CATEGORY_COLORS) as CommitCategory[]).map(cat => (
            <button 
              key={cat}
              onClick={() => toggleFilter(cat)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${activeFilters.has(cat) ? 'bg-white/5 border-white/10' : 'opacity-30 grayscale border-transparent'}`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              <span className="text-[8px] font-black uppercase text-slate-300 tracking-tighter">{cat}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all ${showHeatmap ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${showHeatmap ? 'bg-amber-500' : 'bg-slate-700'}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Risk Heatmap</span>
        </button>
      </div>
      
      <div className="w-full h-[120px] lg:h-[180px] relative group overflow-x-auto overflow-y-hidden custom-scrollbar">
        <svg ref={svgRef} className="h-full" style={{ width: commits.length * 100 + 200 }} />
      </div>
    </div>
  );
};

export default Timeline;
