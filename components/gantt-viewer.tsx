import React from "react";
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

// Main GanttViewer component
export const GanttViewer: React.FC<GanttViewerProps> = ({ projects }) => {
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
  const labelWidth = 260;
  const chartWidth = 800;
  // Build rows: each row is { type, label, operation?, milestone?, y }
  let rows: Array<
    | { type: "project"; label: string; y: number }
    | { type: "milestone"; label: string; y: number; milestone: Milestone }
    | { type: "network"; label: string; y: number }
    | { type: "operation"; label: string; y: number; operation: Operation }
  > = [];
  let y = 0;
  for (const project of projects) {
    rows.push({ type: "project", label: project.name, y });
    y += rowHeight;
    for (const ms of project.milestones) {
      rows.push({ type: "milestone", label: ms.name, y, milestone: ms });
      y += rowHeight;
    }
    for (const network of project.networks) {
      rows.push({ type: "network", label: network.name, y });
      y += rowHeight;
      for (const op of network.operations) {
        rows.push({ type: "operation", label: op.name, y, operation: op });
        y += rowHeight;
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
        <div style={{ display: "flex", flexDirection: "row" }}>
          {/* Labels */}
          <div style={{ width: labelWidth }}>
            {rows.map((row, i) => (
              <div
                key={i}
                style={{
                  height: rowHeight,
                  display: "flex",
                  alignItems: "center",
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
                }}
              >
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
          {/* Chart SVG */}
          <div style={{ flex: 1, overflowX: "auto" }}>
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
              {/* Milestone markers */}
              {rows.map(
                (row, i) =>
                  row.type === "milestone" &&
                  row.milestone.dueDate && (
                    <g key={"ms-" + i}>
                      <rect
                        x={dateToX(row.milestone.dueDate, minDate, maxDate, chartWidth) - 4}
                        y={i * rowHeight + rowHeight / 2 - 8}
                        width={8}
                        height={16}
                        fill="#0ea5e9"
                        stroke="#0369a1"
                        strokeWidth={1}
                        rx={2}
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
                        fill="#38bdf8"
                        stroke="#0ea5e9"
                        strokeWidth={1}
                        rx={4}
                      />
                    </g>
                  )
              )}
              {/* Dependency arrows */}
              {rows.flatMap((row, i) => {
                if (row.type !== "operation") return [];
                const fromIdx = i;
                const fromOp = row.operation;
                const fromX = dateToX(fromOp.startDate, minDate, maxDate, chartWidth);
                const fromY = fromIdx * rowHeight + rowHeight / 2;
                return fromOp.dependencies.map((depId) => {
                  const toIdx = opIdToRowIdx[depId];
                  if (toIdx === undefined) return null;
                  const toOp = rows[toIdx] as typeof row;
                  const toX = dateToX(
                    toOp.operation.endDate,
                    minDate,
                    maxDate,
                    chartWidth
                  );
                  const toY = toIdx * rowHeight + rowHeight / 2;
                  // Draw a rectangular arrow: right from 'to', down, left to 'from', then arrowhead
                  const midX = Math.max(fromX, toX) + 24;
                  return (
                    <g key={`dep-${fromOp.id}-${depId}`}>
                      <polyline
                        points={`
                          ${toX},${toY}
                          ${midX},${toY}
                          ${midX},${fromY}
                          ${fromX},${fromY}
                        `}
                        fill="none"
                        stroke="#f59e42"
                        strokeWidth={2}
                        markerEnd="url(#arrowhead)"
                      />
                    </g>
                  );
                });
              })}
              {/* Arrowhead marker */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L8,4 L0,8 Z" fill="#f59e42" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GanttViewer;
