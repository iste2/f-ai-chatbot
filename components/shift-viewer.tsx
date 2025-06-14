import React from "react";

type Shift = {
  employeeId: string;
  employeeName: string;
  shiftName: string;
  date: string; // YYYY-MM-DD
  colorCode: string;
  duration: number;
};

interface ShiftViewerProps {
  shifts: Shift[];
}

// Helper to get all unique dates in the shifts array, sorted
function getUniqueSortedDates(shifts: Shift[]): string[] {
  const dateSet = new Set(shifts.map((s) => s.date));
  return Array.from(dateSet).sort();
}

// Helper to get all unique employees in the shifts array, sorted by name
function getUniqueEmployees(shifts: Shift[]): { employeeId: string; employeeName: string }[] {
  const map = new Map<string, string>();
  shifts.forEach((s) => {
    if (!map.has(s.employeeId)) map.set(s.employeeId, s.employeeName);
  });
  return Array.from(map.entries())
    .map(([employeeId, employeeName]) => ({ employeeId, employeeName }))
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

// Build a lookup: { [employeeId]: { [date]: Shift } }
function buildShiftLookup(shifts: Shift[]) {
  const lookup: Record<string, Record<string, Shift>> = {};
  shifts.forEach((shift) => {
    if (!lookup[shift.employeeId]) lookup[shift.employeeId] = {};
    lookup[shift.employeeId][shift.date] = shift;
  });
  return lookup;
}

// Helper to get all dates between two dates (inclusive)
function getAllDatesBetween(start: string, end: string): string[] {
  const result: string[] = [];
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

// Helper to get the earliest and latest date in the shifts array
function getDateRange(shifts: Shift[]): { start: string; end: string } | null {
  if (shifts.length === 0) return null;
  let min = shifts[0].date;
  let max = shifts[0].date;
  for (const s of shifts) {
    if (s.date < min) min = s.date;
    if (s.date > max) max = s.date;
  }
  return { start: min, end: max };
}

export const ShiftViewer: React.FC<ShiftViewerProps> = ({ shifts }) => {
  const dateRange = getDateRange(shifts);
  const dates = dateRange ? getAllDatesBetween(dateRange.start, dateRange.end) : [];
  const employees = getUniqueEmployees(shifts);
  const shiftLookup = buildShiftLookup(shifts);

  return (
    <div className="overflow-x-auto">
      <div className="max-h-96 overflow-y-auto border rounded bg-muted">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th
                className="px-2 py-1 bg-gray-100 sticky top-0 left-0 z-30 dark:bg-gray-800 whitespace-nowrap align-middle"
                style={{ background: undefined, height: 40 }}
              >
                Employee
              </th>
              {dates.map((date) => (
                <th
                  key={date}
                  className="p-0 bg-gray-100 text-xs sticky top-0 z-20 dark:bg-gray-800 align-middle"
                  style={{ width: 40, minWidth: 40, maxWidth: 40, height: 40, textAlign: 'center' }}
                >
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.employeeId}>
                <td className="px-2 py-1 font-medium bg-gray-50 sticky left-0 z-10 dark:bg-gray-900 whitespace-nowrap" style={{ background: undefined }}>{emp.employeeName}</td>
                {dates.map((date) => {
                  const shift = shiftLookup[emp.employeeId]?.[date];
                  return (
                    <td key={date} className="px-2 py-1 text-center">
                      {shift ? (
                        <div
                          className="rounded shadow text-xs flex flex-col items-center justify-center"
                          style={{ backgroundColor: shift.colorCode, minWidth: 40, minHeight: 40, width: 40, height: 40 }}
                          title={`${shift.shiftName} (${shift.duration}h)`}
                        >
                          <span>{shift.shiftName.charAt(0)}</span>
                          {shift.duration ? (
                            <span className="text-[10px]">{shift.duration}h</span>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShiftViewer;
