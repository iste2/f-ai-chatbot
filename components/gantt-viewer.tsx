import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { FullscreenWrapper } from './fullscreen-wrapper';

// Types matching gantt-viewer-tool.ts output schema
export type Operation = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  timeCapacityDemand: number;
  resourceId: number;
  dependencies: number[];
};
export type Network = {
  id: number;
  name: string;
  operations: Operation[];
};
export type Milestone = {
  id: number;
  name: string;
  dueDate: string | null;
};
export type Project = {
  id: number;
  name: string;
  colorCode: string;
  milestones: Milestone[];
  networks: Network[];
};

export type GanttViewerProps = {
  projects: Project[];
};

// Helper to flatten all operations for dependency lookup
function getAllOperations(projects: Project[]): Operation[] {
  return projects.flatMap((p) =>
    p.networks.flatMap((n) => n.operations)
  );
}

// Helper to get min/max date for chart scaling
function getDateRange(operations: Operation[], milestones: Milestone[]) {
  const opDates = operations
    .flatMap((op) => [op.startDate, op.endDate])
    .filter(Boolean) as string[];
  const msDates = milestones.map((m) => m.dueDate).filter(Boolean) as string[];
  const allDates = [...opDates, ...msDates];
  if (allDates.length === 0) return [null, null];
  const min = new Date(Math.min(...allDates.map((d) => new Date(d).getTime())));
  const max = new Date(Math.max(...allDates.map((d) => new Date(d).getTime())));
  return [min, max];
}

// Date to X coordinate
function dateToX(date: string | null, min: Date, max: Date, chartWidth: number) {
  if (!date) return 0;
  const t = new Date(date).getTime();
  const t0 = min.getTime();
  const t1 = max.getTime();
  if (t1 === t0) return 0;
  return ((t - t0) / (t1 - t0)) * chartWidth;
}

// Helper to get earliest start and latest end for a set of operations
function getTimeline(operations: Operation[]): { start: string | null; end: string | null } {
  const starts = operations.map((op) => op.startDate).filter(Boolean) as string[];
  const ends = operations.map((op) => op.endDate).filter(Boolean) as string[];
  if (starts.length === 0 || ends.length === 0) return { start: null, end: null };
  return {
    start: starts.reduce((a, b) => (a < b ? a : b)),
    end: ends.reduce((a, b) => (a > b ? a : b)),
  };
}

// Main GanttViewer component
export const GanttViewer: React.FC<GanttViewerProps> = ({ projects }) => {
  // Expansion state (must be before any early return)
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [expandedNetworks, setExpandedNetworks] = useState<Record<number, boolean>>({});
  // Flatten for date range
  const allOperations = getAllOperations(projects);
  const allMilestones = projects.flatMap((p) => p.milestones);
  const [minDate, maxDate] = getDateRange(allOperations, allMilestones);
  if (!minDate || !maxDate) {
    return (
      <div className="overflow-x-auto">
        <div className="max-h-96 overflow-y-auto border rounded bg-muted mt-6 dark:bg-gray-900">
          <div className="flex flex-col items-center justify-center h-40">
            <span className="text-gray-500 dark:text-gray-300">No data to display.</span>
          </div>
        </div>
      </div>
    );
  }
  // Chart layout
  const rowHeight = 32;
  const labelWidth = 340;
  const chartWidth = 800;
  const toggleProject = (id: number) =>
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleNetwork = (id: number) =>
    setExpandedNetworks((prev) => ({ ...prev, [id]: !prev[id] }));

  // Build rows: each row is { type, label, ... } and only visible if parent is expanded
  // Extend row types to include color
  const rows: Array<
    | { type: "project"; label: string; y: number; timeline: { start: string | null; end: string | null }; id: number; color: string }
    | { type: "milestone"; label: string; y: number; milestone: Milestone; timeline: { start: string | null; end: string | null }; projectId: number; color: string }
    | { type: "network"; label: string; y: number; timeline: { start: string | null; end: string | null }; id: number; projectId: number; color: string }
    | { type: "operation"; label: string; y: number; operation: Operation; networkId: number; projectId: number; color: string }
  > = [];
  let y = 0;
  for (const project of projects) {
    const projectOps = project.networks.flatMap((n) => n.operations);
    const projectTimeline = getTimeline(projectOps);
    rows.push({ type: "project", label: project.name, y, timeline: projectTimeline, id: project.id, color: project.colorCode });
    y += rowHeight;
    if (expandedProjects[project.id]) {
      for (const ms of project.milestones) {
        const msOps = project.networks.flatMap((n) => n.operations);
        const msTimeline = getTimeline(msOps);
        rows.push({ type: "milestone", label: ms.name, y, milestone: ms, timeline: msTimeline, projectId: project.id, color: project.colorCode });
        y += rowHeight;
      }
      for (const network of project.networks) {
        const nwTimeline = getTimeline(network.operations);
        rows.push({ type: "network", label: network.name, y, timeline: nwTimeline, id: network.id, projectId: project.id, color: project.colorCode });
        y += rowHeight;
        if (expandedNetworks[network.id]) {
          for (const op of network.operations) {
            rows.push({ type: "operation", label: op.name, y, operation: op, networkId: network.id, projectId: project.id, color: project.colorCode });
            y += rowHeight;
          }
        }
      }
    }
  }
  // For dependency arrows: map opId to row index
  const opIdToRowIdx: Record<number, number> = {};
  rows.forEach((row, idx) => {
    if (row.type === "operation") opIdToRowIdx[row.operation.id] = idx;
  });
  // SVG height
  const chartHeight = rows.length * rowHeight;
  // Render
  return (
    <FullscreenWrapper>
      {(isFullscreen: boolean) => (
        <div className="overflow-x-auto">
          <div className={
            `${isFullscreen ? '' : 'max-h-96'} overflow-y-auto border rounded bg-muted dark:bg-gray-900`
          }>
            <div className="flex flex-row">
              {/* Labels */}
              <div
                className="sticky left-0 top-10 z-20 bg-muted dark:bg-gray-900 pt-10"
                style={{ width: labelWidth, minWidth: labelWidth, paddingRight: 16 }}
              >
                {rows.map((row, i) => (
                  <div
                    key={
                      row.type === "project"
                        ? `project-${row.id}`
                        : row.type === "network"
                        ? `network-${row.id}`
                        : row.type === "milestone"
                        ? `milestone-${row.projectId}-${row.milestone.id}`
                        : row.type === "operation"
                        ? `operation-${row.projectId}-${row.networkId}-${row.operation.id}`
                        : `row-${i}`
                    }
                    className={
                      `h-8 flex items-center whitespace-nowrap px-2 border-b border-gray-200 dark:border-gray-800 font-$
                      {row.type === "project" ? "bold" : row.type === "network" ? "semibold" : row.type === "milestone" ? "medium" : "normal"} ` +
                      (row.type === "project"
                        ? "text-slate-900 dark:text-white cursor-pointer bg-gray-100 dark:bg-gray-800"
                        : row.type === "network"
                        ? "text-slate-800 dark:text-white cursor-pointer bg-gray-50 dark:bg-gray-900"
                        : row.type === "milestone"
                        ? "text-cyan-700 dark:text-cyan-50 bg-white dark:bg-gray-900"
                        : "text-slate-700 dark:text-white bg-white dark:bg-gray-900")
                    }
                    style={{ lineHeight: `${rowHeight}px` }}
                    tabIndex={row.type === "project" || row.type === "network" ? 0 : undefined}
                    role={row.type === "project" || row.type === "network" ? "button" : undefined}
                    onClick={() => {
                      if (row.type === "project") toggleProject(row.id);
                      if (row.type === "network") toggleNetwork(row.id);
                    }}
                    onKeyDown={e => {
                      if ((e.key === "Enter" || e.key === " ") && (row.type === "project" || row.type === "network")) {
                        e.preventDefault();
                        if (row.type === "project") toggleProject(row.id);
                        if (row.type === "network") toggleNetwork(row.id);
                      }
                    }}
                  >
                    {row.type === "project" && (
                      <span className="mr-2 inline-block w-4">{expandedProjects[row.id] ? "▼" : "▶"}</span>
                    )}
                    {row.type === "network" && (
                      <span className="mr-2 inline-block w-4">{expandedNetworks[row.id] ? "▼" : "▶"}</span>
                    )}
                    {row.type !== "project" && row.type !== "network" && <span className="w-6 inline-block" />}
                    <span style={{ userSelect: "text" }}>
                      {row.label}
                    </span>
                    {row.type === "milestone" && row.milestone.dueDate && (
                      <span className="text-xs ml-2 text-cyan-700 dark:text-cyan-100">({row.milestone.dueDate})</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Chart SVG */}
              <div className="flex-1 min-w-[800px] relative">
                <div style={{ height: chartHeight + 40, position: 'relative', zIndex: 1 }}>
                  {/* Timeline axis */}
                  <svg width={chartWidth} height={40} className="bg-[#f8fafc] dark:bg-gray-800 sticky top-0 z-20">
                    {/* Draw time axis ticks and labels */}
                    {(() => {
                      const nTicks = 8;
                      const ticks = Array.from({ length: nTicks + 1 }, (_, i) =>
                        new Date(minDate.getTime() + ((maxDate.getTime() - minDate.getTime()) * i) / nTicks)
                      );
                      // Use CSS variable for dark mode stroke
                      const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
                      const axisStroke = isDark ? 'var(--gantt-axis-stroke-dark, #334155)' : 'var(--gantt-axis-stroke, #cbd5e1)';
                      const axisText = isDark ? 'var(--gantt-axis-text-dark, #fff)' : 'var(--gantt-axis-text, #334155)';
                      return (
                        <g>
                          {ticks.map((d, i) => (
                            <g key={d.toISOString()}>
                              <line
                                x1={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                                y1={0}
                                x2={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                                y2={40}
                                stroke={axisStroke}
                                strokeDasharray="2 2"
                              />
                              <text
                                x={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                                y={32}
                                fontSize={13}
                                textAnchor="middle"
                                fill={axisText}
                                fontWeight={isDark ? 700 : 500}
                              >
                                {d.toISOString().slice(0, 10)}
                              </text>
                            </g>
                          ))}
                        </g>
                      );
                    })()}
                  </svg>
                  <svg width={chartWidth} height={chartHeight} className="bg-[#f8fafc] dark:bg-gray-800">
                    {/* Grid lines */}
                    {rows.map((row, i) => (
                      <rect
                        key={
                          row.type === "project"
                            ? `project-${row.id}`
                            : row.type === "network"
                            ? `network-${row.id}`
                            : row.type === "milestone"
                            ? `milestone-${row.projectId}-${row.milestone.id}`
                            : row.type === "operation"
                            ? `operation-${row.projectId}-${row.networkId}-${row.operation.id}`
                            : `row-${i}`
                        }
                        x={0}
                        y={i * rowHeight}
                        width={chartWidth}
                        height={rowHeight}
                        fill={i % 2 === 0 ? "var(--gantt-row-even, #f1f5f9)" : "var(--gantt-row-odd, #e2e8f0)"}
                        className={i % 2 === 0 ? "dark:fill-gray-900" : "dark:fill-gray-800"}
                      />
                    ))}
                    {/* Timeline bars for project, network, milestone */}
                    {rows.map((row, i) => {
                      if (
                        row.type === "project" &&
                        row.timeline.start &&
                        row.timeline.end
                      ) {
                        // Project: pill-shaped (fully rounded) rectangle
                        const x = dateToX(row.timeline.start, minDate, maxDate, chartWidth);
                        const x2 = dateToX(row.timeline.end, minDate, maxDate, chartWidth);
                        const color = row.color;
                        return (
                          <rect
                            key={`${row.label}-timeline`}
                            x={x}
                            y={i * rowHeight + 4}
                            width={x2 - x}
                            height={rowHeight - 8}
                            fill={color}
                            rx={(rowHeight - 8) / 2}
                          />
                        );
                      }
                      if (
                        row.type === "network" &&
                        row.timeline.start &&
                        row.timeline.end
                      ) {
                        // Network: parallelogram (slanted rectangle) with reduced height
                        const x = dateToX(row.timeline.start, minDate, maxDate, chartWidth);
                        const x2 = dateToX(row.timeline.end, minDate, maxDate, chartWidth);
                        const yCenter = i * rowHeight + rowHeight / 2;
                        const netHeight = rowHeight * 0.5; // 50% of row height
                        const yTop = yCenter - netHeight / 2;
                        const yBot = yCenter + netHeight / 2;
                        const slant = 18;
                        const color = row.color;
                        return (
                          <polygon
                            key={`${row.label}-timeline`}
                            points={`
                              ${x + slant},${yTop}
                              ${x2},${yTop}
                              ${x2 - slant},${yBot}
                              ${x},${yBot}
                            `}
                            fill={color}
                          />
                        );
                      }
                      return null;
                    })}
                    {/* Milestone markers */}
                    {rows.map(
                      (row, i) =>
                        row.type === "milestone" &&
                        row.milestone.dueDate && (
                          <g key={`ms-${row.projectId}-${row.milestone.id}`}>
                            {/* Diamond shape for milestone */}
                            <polygon
                              points={(() => {
                                const cx = dateToX(row.milestone.dueDate, minDate, maxDate, chartWidth);
                                const cy = i * rowHeight + rowHeight / 2;
                                const size = 12;
                                return [
                                  `${cx},${cy - size / 2}`,
                                  `${cx + size / 2},${cy}`,
                                  `${cx},${cy + size / 2}`,
                                  `${cx - size / 2},${cy}`
                                ].join(" ");
                              })()}
                              fill="var(--gantt-milestone-fill, #0ea5e9)"
                              stroke="var(--gantt-milestone-stroke, #0369a1)"
                              strokeWidth={1}
                              className="dark:fill-cyan-400 dark:stroke-cyan-700"
                            />
                          </g>
                        )
                    )}
                    {/* Operation bars */}
                    {rows.map(
                      (row, i) =>
                        row.type === "operation" &&
                        row.operation.startDate &&
                        row.operation.endDate && (
                          <g key={`op-${row.projectId}-${row.networkId}-${row.operation.id}`}>
                            <rect
                              x={dateToX(row.operation.startDate, minDate, maxDate, chartWidth)}
                              y={i * rowHeight + 8}
                              width={
                                dateToX(row.operation.endDate, minDate, maxDate, chartWidth) -
                                dateToX(row.operation.startDate, minDate, maxDate, chartWidth)
                              }
                              height={rowHeight - 16}
                              fill={row.color || "var(--gantt-bar-operation, #38bdf8)"}
                              stroke={row.color || "var(--gantt-bar-operation-stroke, #0ea5e9)"}
                              strokeWidth={1}
                              rx={4}
                              className="dark:fill-sky-700 dark:stroke-sky-400"
                            />
                          </g>
                        )
                    )}
                    {/* Dependency arrows */}
                    {rows.flatMap((row, i) => {
                      if (row.type !== "operation") return [];
                      const successorIdx = i;
                      const successorOp = row.operation;
                      if (!successorOp.startDate) return [];
                      const successorX = dateToX(successorOp.startDate, minDate, maxDate, chartWidth);
                      const successorY = successorIdx * rowHeight + rowHeight / 2;
                      return successorOp.dependencies.map((predecessorId) => {
                        const predecessorIdx = opIdToRowIdx[predecessorId];
                        if (predecessorIdx === undefined) return null;
                        const predecessorRow = rows[predecessorIdx] as typeof row;
                        const predecessorOp = predecessorRow.operation;
                        if (!predecessorOp.endDate) return null;
                        // Start at the end of the predecessor bar
                        const predecessorX = dateToX(predecessorOp.endDate, minDate, maxDate, chartWidth);
                        const predecessorY = predecessorIdx * rowHeight + rowHeight / 2;
                        // Start with orange, use lighter orange in dark mode
                        const arrowStroke = typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'var(--gantt-arrow-dark, #fbbf24)' : 'var(--gantt-arrow, #f59e42)';
                        // Draw a polyline: horizontal from predecessorX to a midX, vertical to successorY, then horizontal to successorX
                        const midX = Math.min(predecessorX + 24, successorX - 12); // 24px horizontal, but don't overshoot
                        const points = [
                          `${predecessorX},${predecessorY}`,
                          `${midX},${predecessorY}`,
                          `${midX},${successorY}`,
                          `${successorX},${successorY}`
                        ].join(" ");
                        return (
                          <g key={`dep-${predecessorOp.id}-${successorOp.id}`}>
                            <polyline
                              points={points}
                              fill="none"
                              stroke={arrowStroke}
                              strokeWidth={2}
                              className="dark:stroke-amber-400"
                            />
                          </g>
                        );
                      });
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </FullscreenWrapper>
  );
};

export default GanttViewer;
