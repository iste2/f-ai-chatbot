import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "./ui/card";

// Types matching gantt-viewer-tool.ts output schema
export type Employee = {
  id: number;
  name: string;
  assignedCapacity: number;
};
export type Operation = {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  timeCapacityDemand: number;
  resourceId: number;
  employees: Employee[];
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
      <Card>
        <CardHeader>
          <CardTitle>Gantt Chart</CardTitle>
        </CardHeader>
        <CardContent>No data to display.</CardContent>
      </Card>
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
  let rows: Array<
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
    <Card>
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-96 border rounded bg-muted" style={{ overflowY: 'auto', position: 'relative', paddingBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "row" }}>
            {/* Labels */}
            <div style={{ width: labelWidth, display: "flex", flexDirection: "column", marginTop: 40, paddingRight: 16 }}>
              {rows.map((row, i) => (
                <div
                  key={i}
                  style={{
                    height: rowHeight,
                    lineHeight: `${rowHeight}px`,
                    display: "flex",
                    alignItems: "center",
                    whiteSpace: "nowrap",
                    overflow: "visible",
                    textOverflow: "unset",
                    fontWeight:
                      row.type === "project"
                        ? 700
                        : row.type === "network"
                        ? 600
                        : row.type === "milestone"
                        ? 500
                        : 400,
                    color:
                      row.type === "project"
                        ? "#1e293b"
                        : row.type === "network"
                        ? "#334155"
                        : row.type === "milestone"
                        ? "#0e7490"
                        : undefined,
                    cursor:
                      row.type === "project" || row.type === "network"
                        ? "pointer"
                        : undefined,
                    userSelect: "none",
                    boxSizing: "border-box",
                    padding: 0,
                    margin: 0,
                  }}
                  onClick={() => {
                    if (row.type === "project") toggleProject(row.id);
                    if (row.type === "network") toggleNetwork(row.id);
                  }}
                >
                  {row.type === "project" && (
                    <span style={{ marginRight: 8, display: "inline-block", width: 16 }}>
                      {expandedProjects[row.id] ? "▼" : "▶"}
                    </span>
                  )}
                  {row.type === "network" && (
                    <span style={{ marginRight: 8, display: "inline-block", width: 16 }}>
                      {expandedNetworks[row.id] ? "▼" : "▶"}
                    </span>
                  )}
                  {row.type !== "project" && row.type !== "network" && <span style={{ width: 24 }} />}
                  {row.label}
                  {row.type === "operation" && row.operation.employees.length > 0 && (
                    <span style={{ fontSize: 12, marginLeft: 8, color: "#64748b" }}>
                      [
                      {row.operation.employees
                        .map((e) => `${e.name} (${e.assignedCapacity})`)
                        .join(", ")}
                      ]
                    </span>
                  )}
                  {row.type === "milestone" && row.milestone.dueDate && (
                    <span style={{ fontSize: 12, marginLeft: 8, color: "#0e7490" }}>
                      ({row.milestone.dueDate})
                    </span>
                  )}
                </div>
              ))}
            </div>
            {/* Chart SVG with always-visible horizontal scrollbar */}
            <div style={{ flex: 1, minWidth: chartWidth, position: 'relative' }}>
              <div style={{ width: '100%', overflowX: 'scroll', overflowY: 'hidden', position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, zIndex: 2, pointerEvents: 'auto', background: 'transparent' }}>
                {/* This empty div forces the scrollbar to always be visible */}
                <div style={{ width: chartWidth, height: 1 }} />
              </div>
              <div style={{ overflowX: 'auto', overflowY: 'visible', height: chartHeight + 40, position: 'relative', zIndex: 1 }}>
                {/* Timeline axis */}
                <svg width={chartWidth} height={40} style={{ background: "#f8fafc" }}>
                  {/* Draw time axis ticks and labels */}
                  {(() => {
                    const nTicks = 8;
                    const ticks = Array.from({ length: nTicks + 1 }, (_, i) =>
                      new Date(minDate.getTime() + ((maxDate.getTime() - minDate.getTime()) * i) / nTicks)
                    );
                    return (
                      <g>
                        {ticks.map((d, i) => (
                          <g key={i}>
                            <line
                              x1={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                              y1={0}
                              x2={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                              y2={40}
                              stroke="#cbd5e1"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={dateToX(d.toISOString(), minDate, maxDate, chartWidth)}
                              y={32}
                              fontSize={12}
                              textAnchor="middle"
                              fill="#334155"
                            >
                              {d.toISOString().slice(0, 10)}
                            </text>
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>
                <svg width={chartWidth} height={chartHeight} style={{ background: "#f8fafc" }}>
                  {/* Grid lines */}
                  {rows.map((row, i) => (
                    <rect
                      key={i}
                      x={0}
                      y={i * rowHeight}
                      width={chartWidth}
                      height={rowHeight}
                      fill={i % 2 === 0 ? "#f1f5f9" : "#e2e8f0"}
                    />
                  ))}
                  {/* Timeline bars for project, network, milestone */}
                  {rows.map((row, i) => {
                    if (
                      (row.type === "project" || row.type === "network" || row.type === "milestone") &&
                      row.timeline.start &&
                      row.timeline.end
                    ) {
                      const x = dateToX(row.timeline.start, minDate, maxDate, chartWidth);
                      const x2 = dateToX(row.timeline.end, minDate, maxDate, chartWidth);
                      const color = row.color || (row.type === "project"
                          ? "#0ea5e9"
                          : row.type === "network"
                          ? "#38bdf8"
                          : "#a21caf");
                      return (
                        <rect
                          key={row.label + "-timeline"}
                          x={x}
                          y={i * rowHeight + 4}
                          width={x2 - x}
                          height={rowHeight - 8}
                          fill={color}
                          opacity={0.18}
                          rx={4}
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
                        <g key={"ms-" + i}>
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
                            fill="#0ea5e9"
                            stroke="#0369a1"
                            strokeWidth={1}
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
                        <g key={"op-" + i}>
                          <rect
                            x={dateToX(row.operation.startDate, minDate, maxDate, chartWidth)}
                            y={i * rowHeight + 8}
                            width={
                              dateToX(row.operation.endDate, minDate, maxDate, chartWidth) -
                              dateToX(row.operation.startDate, minDate, maxDate, chartWidth)
                            }
                            height={rowHeight - 16}
                            fill={row.color || "#38bdf8"}
                            stroke={row.color || "#0ea5e9"}
                            strokeWidth={1}
                            rx={4}
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
                      // End at the start of the successor bar
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
                            stroke="#f59e42"
                            strokeWidth={2}
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
      </CardContent>
    </Card>
  );
};

export default GanttViewer;
