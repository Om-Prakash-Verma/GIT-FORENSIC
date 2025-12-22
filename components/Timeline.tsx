
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Commit, BisectStatus } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface TimelineProps {
  commits: Commit[];
  selectedHash: string | null;
  onSelect: (hash: string) => void;
  bisectStatuses: Record<string, BisectStatus>;
  bisectRange?: { start: string | null; end: string | null };
}

const Timeline: React.FC<TimelineProps> = ({ commits, selectedHash, onSelect, bisectStatuses, bisectRange }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || commits.length === 0) return;

    const isMobile = window.innerWidth < 640;
    const width = svgRef.current.clientWidth;
    const height = isMobile ? 120 : 150;
    const margin = { 
      top: isMobile ? 30 : 45, 
      right: isMobile ? 60 : 100, 
      bottom: isMobile ? 30 : 45, 
      left: isMobile ? 60 : 100 
    };
    
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

    // Draw active search area (Bisect Range)
    if (bisectRange?.start && bisectRange?.end) {
      const startX = x(bisectRange.start) || 0;
      const endX = x(bisectRange.end) || 0;
      const x1 = Math.min(startX, endX);
      const x2 = Math.max(startX, endX);

      const defs = container.append("defs");
      const gradient = defs.append("linearGradient")
        .attr("id", "search-gradient")
        .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
      gradient.append("stop").attr("offset", "0%").attr("stop-color", COLORS.gold).attr("stop-opacity", 0.08);
      gradient.append("stop").attr("offset", "100%").attr("stop-color", COLORS.gold).attr("stop-opacity", 0.02);

      svg.append("rect")
        .attr("x", x1 - (isMobile ? 15 : 25))
        .attr("y", -10)
        .attr("width", x2 - x1 + (isMobile ? 30 : 50))
        .attr("height", innerHeight + 20)
        .attr("fill", "url(#search-gradient)")
        .attr("stroke", COLORS.gold)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.4)
        .attr("rx", isMobile ? 8 : 12);
    }

    // Main backbone line
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", timelineWidth)
      .attr("y1", innerHeight / 2)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", isMobile ? 1 : 2);

    const commitGroup = svg.selectAll(".commit")
      .data(commits)
      .enter()
      .append("g")
      .attr("class", "commit")
      .attr("transform", d => `translate(${x(d.hash)},${innerHeight / 2})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => onSelect(d.hash));

    // Glow for selected commit
    commitGroup.filter(d => d.hash === selectedHash)
      .append("circle")
      .attr("r", isMobile ? 10 : 15)
      .attr("fill", COLORS.gold)
      .attr("opacity", 0.15)
      .attr("class", "animate-pulse");

    // Main node circle
    commitGroup.append("circle")
      .attr("r", d => d.hash === selectedHash ? (isMobile ? 6 : 7) : (isMobile ? 4 : 5))
      .attr("fill", d => {
        const status = bisectStatuses[d.hash];
        if (status === BisectStatus.GOOD) return COLORS.success;
        if (status === BisectStatus.BAD) return COLORS.error;
        if (status === BisectStatus.SUSPECTED) return COLORS.gold;
        if (status === BisectStatus.SKIPPED) return "#1e293b";
        return d.hash === selectedHash ? COLORS.gold : "#475569";
      })
      .attr("stroke", "#020617")
      .attr("stroke-width", isMobile ? 1.5 : 2);

    // Hash Labels
    commitGroup.append("text")
      .attr("y", isMobile ? -18 : -25)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.hash === selectedHash ? COLORS.gold : "#64748b")
      .attr("font-size", isMobile ? "7px" : "9px")
      .attr("font-family", "Fira Code, monospace")
      .attr("font-weight", d => d.hash === selectedHash ? "700" : "400")
      .text(d => d.hash.substring(0, isMobile ? 6 : 7));

    // Auto-scroll logic
    if (selectedHash) {
      const selectedX = x(selectedHash) || 0;
      const scrollParent = svgRef.current?.parentElement;
      if (scrollParent) {
        const targetScroll = selectedX + margin.left - scrollParent.clientWidth / 2;
        scrollParent.scrollTo({ left: targetScroll, behavior: 'smooth' });
      }
    }

  }, [commits, selectedHash, onSelect, bisectStatuses, bisectRange]);

  return (
    <div className="w-full h-[120px] sm:h-[150px] bg-[#020617] border-b border-slate-800 relative group overflow-x-auto overflow-y-hidden custom-scrollbar shrink-0">
      <div className="absolute top-2 sm:top-3 left-4 sm:left-6 flex items-center gap-2 sm:gap-5 z-20 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
           <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
           <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Timeline</span>
        </div>
      </div>
      <svg 
        ref={svgRef} 
        className="h-full" 
        style={{ width: commits.length > 0 ? Math.max(window.innerWidth, commits.length * (window.innerWidth < 640 ? 70 : 100) + 200) : '100%' }}
      />
    </div>
  );
};

export default Timeline;
