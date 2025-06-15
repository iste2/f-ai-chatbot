import React, { useMemo, useState } from "react";
import { FullscreenWrapper } from './fullscreen-wrapper';

// Types matching the outputSchema from assignment-viewer-tool
export interface Assignment {
  employeeId: string;
  employeeName: string;
  operationId: string;
  operationName: string;
  operation_startDate: string; // YYYY-MM-DD
  operation_endDate: string;   // YYYY-MM-DD
  operation_colorCode: string;
  duration: number; // hours
  date: string; // YYYY-MM-DD
  operation_capacityDemand: number; // Capacity demand of the operation in hours
}

export interface AssignmentViewerProps {
  assignments: Assignment[];
}

// Helper to get all dates between two dates (inclusive)
function getDateRange(start: string, end: string): string[] {
  const result: string[] = [];
  const current = new Date(start);
  const last = new Date(end);
  while (current <= last) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  // Ensure unique dates (deduplicate)
  return Array.from(new Set(result));
}

// Group assignments by operation, then by employee
function groupAssignments(assignments: Assignment[]) {
  const operations: Record<string, {
    operationName: string;
    operation_startDate: string;
    operation_endDate: string;
    operation_colorCode: string;
    assignments: Assignment[];
    employees: Record<string, { employeeName: string; assignments: Assignment[] }>
  }> = {};
  for (const a of assignments) {
    if (!operations[a.operationId]) {
      operations[a.operationId] = {
        operationName: a.operationName,
        operation_startDate: a.operation_startDate,
        operation_endDate: a.operation_endDate,
        operation_colorCode: a.operation_colorCode,
        assignments: [],
        employees: {},
      };
    }
    operations[a.operationId].assignments.push(a);
    if (!operations[a.operationId].employees[a.employeeId]) {
      operations[a.operationId].employees[a.employeeId] = {
        employeeName: a.employeeName,
        assignments: [],
      };
    }
    operations[a.operationId].employees[a.employeeId].assignments.push(a);
  }
  return operations;
}

const AssignmentViewer: React.FC<AssignmentViewerProps> = ({ assignments }) => {
  // Compute date range
  const { dateRange, operations } = useMemo(() => {
    if (assignments.length === 0) return { dateRange: [], operations: {} };
    let minDate = assignments[0].operation_startDate;
    let maxDate = assignments[0].operation_endDate;
    for (const a of assignments) {
      if (a.operation_startDate < minDate) minDate = a.operation_startDate;
      if (a.operation_endDate > maxDate) maxDate = a.operation_endDate;
    }
    return {
      dateRange: getDateRange(minDate, maxDate),
      operations: groupAssignments(assignments),
    };
  }, [assignments]);

  // State for expanded operations
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleExpand = (opId: string) => setExpanded(e => ({ ...e, [opId]: !e[opId] }));

  return (
    <FullscreenWrapper>
      <div className="overflow-x-auto">
        <div className="max-h-96 overflow-y-auto border rounded bg-muted" style={{ maxHeight: '24rem' }}>
          <table className="min-w-full border text-sm bg-white dark:bg-gray-900">
            <thead>
              <tr>
                <th className="px-4 py-1 border min-w-[200px] whitespace-nowrap sticky bg-white dark:bg-gray-900 left-0 top-0 z-30 text-gray-900 dark:text-gray-100">Name</th>
                <th className="px-4 py-1 border min-w-[120px] whitespace-nowrap sticky top-0 bg-white dark:bg-gray-900 z-20 text-gray-900 dark:text-gray-100">Assigned Hours</th>
                {dateRange.map((date) => (
                  <th key={date} className="p-1 border text-xs sticky top-0 bg-white dark:bg-gray-900 z-10 text-gray-900 dark:text-gray-100">{date.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(operations).map(([opId, op]) => {
                // Use real demand from the first assignment for this operation
                const opAssignment = op.assignments[0];
                const totalDemand = opAssignment?.operation_capacityDemand ?? 0;
                const totalAssigned = op.assignments.reduce((sum, a) => sum + a.duration, 0);
                return (
                  <React.Fragment key={opId}>
                    {/* Operation row */}
                    <tr className="bg-gray-100 dark:bg-gray-800 cursor-pointer" onClick={() => toggleExpand(opId)}>
                      <td className="px-4 py-1 border font-semibold flex items-center gap-2 min-w-[200px] whitespace-nowrap bg-white dark:bg-gray-900 sticky left-0 z-20 text-gray-900 dark:text-gray-100">
                        <span className="inline-block size-3 rounded-full" style={{ background: op.operation_colorCode }} />
                        {op.operationName}
                      </td>
                      <td className="px-4 py-1 border min-w-[120px] whitespace-nowrap text-gray-900 dark:text-gray-100">{totalAssigned} / {totalDemand}h</td>
                      {dateRange.map((date) => {
                        const inOp = date >= op.operation_startDate && date <= op.operation_endDate;
                        return (
                          <td key={date} className="p-1 border">
                            {inOp && (
                              <div className="size-4 mx-auto rounded" style={{ background: op.operation_colorCode, opacity: 0.3 }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    {/* Employee rows */}
                    {expanded[opId] && Object.entries(op.employees).map(([empId, emp]) => {
                      const empTotal = emp.assignments.reduce((sum, a) => sum + a.duration, 0);
                      return (
                        <tr key={empId} className="bg-white dark:bg-gray-900">
                          <td className="px-2 py-1 border pl-8 bg-white dark:bg-gray-900 sticky left-0 z-20 text-gray-900 dark:text-gray-100">{emp.employeeName}</td>
                          <td className="px-2 py-1 border text-gray-900 dark:text-gray-100">{empTotal}h</td>
                          {dateRange.map((date) => {
                            const assignment = emp.assignments.find(a => a.date === date);
                            return (
                              <td key={date} className="p-1 border">
                                {assignment && (
                                  <div className="size-4 mx-auto rounded" style={{ background: op.operation_colorCode }} title={`${assignment.duration}h`} />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </FullscreenWrapper>
  );
};

export default AssignmentViewer;
