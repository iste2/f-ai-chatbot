import React from "react";

type Shift = {
  employeeId: string;
  employeeName: string;
  shiftName: string;
  date: string; // YYYY-MM-DD
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

// Build a lookup: { [employeeId]: { [date]: shiftName } }
function buildShiftLookup(shifts: Shift[]) {
  const lookup: Record<string, Record<string, string>> = {};
  shifts.forEach(({ employeeId, date, shiftName }) => {
    if (!lookup[employeeId]) lookup[employeeId] = {};
    lookup[employeeId][date] = shiftName;
  });
  return lookup;
}

export const ShiftViewer: React.FC<ShiftViewerProps> = ({ shifts }) => {
  const dates = getUniqueSortedDates(shifts);
  const employees = getUniqueEmployees(shifts);
  const shiftLookup = buildShiftLookup(shifts);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100">Employee</th>
            {dates.map((date) => (
              <th key={date} className="border px-2 py-1 bg-gray-100 text-xs">{date}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId}>
              <td className="border px-2 py-1 font-medium bg-gray-50">{emp.employeeName}</td>
              {dates.map((date) => {
                const shiftName = shiftLookup[emp.employeeId]?.[date];
                return (
                  <td key={date} className="border px-2 py-1 text-center">
                    {shiftName ? shiftName.charAt(0) : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftViewer;
