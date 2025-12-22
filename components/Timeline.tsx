
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Commit, BisectStatus } from '../types';
import { COLORS } from '../constants';

interface TimelineProps {
  commits: Commit[];
  selectedHash: string | null;
  onSelect: (hash: string) => void;
  bisectStatuses: Record<string, BisectStatus>;
  bisectRange?: { start: string | null; end: string | null };
}

const Timeline: React.FC<TimelineProps> = ({ commits, selectedHash, onSelect, bisectStatuses, bisectRange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!svgRef.current || commits.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = 150;
    const margin = { top: 45, right: 100, bottom: 45, left: 100 };
    const innerWidth = Math.max(width, commits.length * 100) - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const container = d3.select(svgRef.current);
    container.selectAll("*").remove();

    const zoomG = container.append("g")
      .attr("class", "zoom-container");

    const svg = zoomG.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint()
      .domain(commits.map(c => c.hash))
      .range([0, innerWidth]);

    // Draw active search area
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
        .attr("x", x1 - 25)
        .attr("y", -15)
        .attr("width", x2 - x1 + 50)
        .attr("height", innerHeight + 30)
        .attr("fill", "url(#search-gradient)")
        .attr("stroke", COLORS.gold)
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "6,4")
        .attr("opacity", 0.4)
        .attr("rx", 12);
    }

    // Main backbone
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", innerHeight / 2)
      .attr("y2", innerHeight / 2)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    const commitGroup = svg.selectAll(".commit")
      .data(commits)
      .enter()
      .append("g")
      .attr("class", "commit")
      .attr("transform", d => `translate(${x(d.hash)},${innerHeight / 2})`)
      .style("cursor", "pointer")
      .on("click", (_, d) => onSelect(d.hash));

    // Glow for selected
    commitGroup.filter(d => d.hash === selectedHash)
      .append("circle")
      .attr("r", 15)
      .attr("fill", COLORS.gold)
      .attr("opacity", 0.15)
      .attr("class", "animate-pulse");

    // Main node circle
    commitGroup.append("circle")
      .attr("r", d => d.hash === selectedHash ? 7 : 5)
      .attr("fill", d => {
        const status = bisectStatuses[d.hash];
        if (status === BisectStatus.GOOD) return COLORS.success;
        if (status === BisectStatus.BAD) return COLORS.error;
        if (status === BisectStatus.SUSPECTED) return COLORS.gold;
        if (status === BisectStatus.SKIPPED) return "#1e293b";
        return d.hash === selectedHash ? COLORS.gold : "#475569";
      })
      .attr("stroke", "#020617")
      .attr("stroke-width", 2);

    // Hash Labels
    commitGroup.append("text")
      .attr("y", -25)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.hash === selectedHash ? COLORS.gold : "#64748b")
      .attr("font-size", "9px")
      .attr("font-family", "Fira Code, monospace")
      .text(d => d.hash.substring(0, 7));

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        zoomG.attr("transform", event.transform);
      });

    container.call(zoom);

    // Initial positioning to show the selected or last commit
    if (selectedHash) {
      const selectedX = x(selectedHash) || 0;
      const tx = width / 2 - selectedX - margin.left;
      container.call(zoom.transform, d3.zoomIdentity.translate(tx, 0));
    }

  }, [commits, selectedHash, onSelect, bisectStatuses, bisectRange]);

  return (
    <div className="w-full h-[150px] bg-[#020617] border-b border-slate-800 relative group overflow-hidden">
      <div className="absolute top-3 left-6 flex items-center gap-5 z-20 pointer-events-none">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forensic Timeline</span>
        </div>
        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Scroll to Zoom • Drag to Pan</span>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default Timeline;
