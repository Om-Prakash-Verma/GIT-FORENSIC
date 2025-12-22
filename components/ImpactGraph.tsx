
import React, { useEffect, useRef } from 'react';
// Fix: Import specific d3 functions and modules to resolve property missing errors
import { 
  select, 
  zoom as d3Zoom, 
  forceSimulation, 
  forceLink, 
  forceManyBody, 
  forceCenter, 
  forceCollide, 
  drag as d3Drag 
} from 'd3';
import { ImpactData, ImpactNode, ImpactLink } from '../types.ts';
import { COLORS } from '../constants.tsx';

interface ImpactGraphProps {
  data: ImpactData | null;
  loading: boolean;
}

const ImpactGraph: React.FC<ImpactGraphProps> = ({ data, loading }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data || data.nodes.length === 0) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    const updateDimensions = () => {
      if (!containerRef.current) return;
      width = containerRef.current.clientWidth;
      height = containerRef.current.clientHeight;
    };

    updateDimensions();

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = forceSimulation<ImpactNode>(data.nodes)
      .force("link", forceLink<ImpactNode, ImpactLink>(data.links).id(d => d.id).distance(120))
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collision", forceCollide().radius(70));

    // Arrowhead definition
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#475569")
      .style("stroke", "none");

    const link = g.append("g")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", d => Math.sqrt(d.value) * 1.5)
      .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .call(d3Drag<SVGGElement, ImpactNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.filter(d => d.isModified)
      .append("circle")
      .attr("r", 18)
      .attr("fill", COLORS.gold)
      .attr("opacity", 0.1)
      .attr("class", "animate-pulse");

    node.append("circle")
      .attr("r", d => d.isModified ? 10 : 6)
      .attr("fill", d => d.isModified ? COLORS.gold : "#1e293b")
      .attr("stroke", d => d.isModified ? COLORS.goldDark : "#475569")
      .attr("stroke-width", d => d.isModified ? 3 : 1.5);

    const label = node.append("text")
      .attr("dx", 15)
      .attr("dy", 4)
      .attr("fill", d => d.isModified ? "#fff" : "#94a3b8")
      .attr("font-size", d => d.isModified ? "11px" : "9px")
      .attr("font-family", "Fira Code, monospace")
      .attr("font-weight", d => d.isModified ? "700" : "400")
      .attr("pointer-events", "none")
      .text(d => d.name);

    label.clone(true)
      .attr("fill", "none")
      .attr("stroke", "#020617")
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("opacity", 0.8)
      .lower();

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Handle container resizing to update center force
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      simulation.force("center", forceCenter(newWidth / 2, newHeight / 2));
      simulation.alpha(0.3).restart();
    });

    resizeObserver.observe(containerRef.current);

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => resizeObserver.disconnect();

  }, [data, loading]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black/40">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Mapping Impact Radius...</p>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-600 bg-black/40">
        <p className="text-xs uppercase tracking-widest font-bold">No cross-file dependencies detected</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-black/40 h-full w-full">
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Dependency Blast Radius</h3>
        <p className="text-[9px] text-slate-500 max-w-xs uppercase leading-relaxed">
          Visualizing direct and inferred dependencies of modified modules to identify potential side-effects.
        </p>
      </div>
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-[8px] font-black uppercase text-slate-400">Changed File</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600" />
          <span className="text-[8px] font-black uppercase text-slate-400">Impacted Module</span>
        </div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move block" />
    </div>
  );
};

export default ImpactGraph;
