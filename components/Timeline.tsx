
import React, { useEffect, useRef, useState, useMemo } from 'react';
// Fix: Import specific d3 functions to resolve property missing errors
import { select, scalePoint, mean, scaleLinear, area as d3Area, curveMonotoneX } from 'd3';
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
  const containerRef = useRef<HTMLDivElement>(null);
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

    const width = commits.length * 80 + 200;
    const height = 140;
    const margin = { top: 40, right: 60, bottom: 40, left: 60 };
    
    const innerHeight = height - margin.top - margin.bottom;

    // Fix: Using select directly instead of d3.select
    const container = select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
      
    container.selectAll("*").remove();

    const svg = container.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Fix: Using scalePoint directly instead of d3.scalePoint
    const x = scalePoint()
      .domain(commits.map(c => c.hash))
      .range([0, width - margin.left - margin.right]);

    // --- Heatmap ---
    if (showHeatmap) {
      const riskData = commits.map((c, i) => {
        const windowSize = 2;
        const neighborhood = commits.slice(Math.max(0, i - windowSize), Math.min(commits.length - 1, i + windowSize) + 1);
        // Fix: Using mean directly instead of d3.mean
        const avgRisk = mean(neighborhood, n => n.volatilityScore) || 0;
        return { hash: c.hash, risk: avgRisk };
      });

      // Fix: Using scaleLinear and d3Area directly instead of d3 namespace
      const yRisk = scaleLinear().domain([0, 100]).range([innerHeight, 0]);
      const area = d3Area<{ hash: string, risk: number }>()
        .x(d => x(d.hash) || 0)
        .y0(innerHeight)
        .y1(d => yRisk(d.risk))
        .curve(curveMonotoneX);

      svg.append("path")
        .datum(riskData)
        .attr("fill", "rgba(251, 191, 36, 0.05)")
        .attr("d", area);
    }

    // --- Backbone ---
    svg.append("line")
      .attr("x1", 0).attr("x2", width - margin.left - margin.right)
      .attr("y1", innerHeight)
      .attr("y2", innerHeight)
      .attr("stroke", "rgba(71, 85, 105, 0.2)")
      .attr("stroke-width", 1);

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
      .attr("r", 10)
      .attr("fill", "transparent")
      .attr("stroke", d => {
        const status = bisectStatuses[d.hash];
        if (status === BisectStatus.GOOD) return COLORS.success;
        if (status === BisectStatus.BAD) return COLORS.error;
        return "transparent";
      })
      .attr("stroke-width", 2);

    // Node Circle
    commitGroup.append("circle")
      .attr("r", d => d.hash === selectedHash ? 6 : 4)
      .attr("fill", d => d.hash === selectedHash ? "#fff" : CATEGORY_COLORS[d.category || 'logic'])
      .attr("stroke", d => d.hash === selectedHash ? COLORS.gold : "#020617")
      .attr("stroke-width", 2);

    // Hash Labels
    commitGroup.append("text")
      .attr("y", 22).attr("text-anchor", "middle")
      .attr("fill", d => d.hash === selectedHash ? COLORS.gold : "rgba(100, 116, 139, 0.6)")
      .attr("font-size", "8px").attr("font-family", "Fira Code")
      .text(d => d.hash.substring(0, 7));

    if (selectedHash && containerRef.current) {
      const selectedX = x(selectedHash) || 0;
      const scrollPos = selectedX + margin.left - containerRef.current.clientWidth / 2;
      containerRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [filteredCommits, selectedHash, onSelect, bisectStatuses, bisectRange, showHeatmap]);

  return (
    <div className="w-full flex flex-col bg-[#020617] shrink-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-white/5">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] whitespace-nowrap">Filter Nodes:</span>
          {(Object.keys(CATEGORY_COLORS) as CommitCategory[]).map(cat => (
            <button 
              key={cat}
              onClick={() => toggleFilter(cat)}
              className={`flex items-center gap-2 px-2 py-1 rounded-md border transition-all ${activeFilters.has(cat) ? 'bg-white/5 border-white/10' : 'opacity-20 grayscale border-transparent'}`}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">{cat}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`flex items-center gap-2 px-3 py-1 rounded-md transition-all ${showHeatmap ? 'text-amber-500' : 'text-slate-600'}`}
        >
          <div className={`w-1 h-1 rounded-full ${showHeatmap ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[8px] font-black uppercase tracking-widest">Heatmap</span>
        </button>
      </div>
      
      <div ref={containerRef} className="w-full h-[140px] relative overflow-x-auto no-scrollbar">
        <svg ref={svgRef} className="block" />
      </div>
    </div>
  );
};

export default Timeline;
