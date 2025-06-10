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

export const ShiftViewer: React.FC<ShiftViewerProps> = ({ shifts }) => {
  const dates = getUniqueSortedDates(shifts);
  const employees = getUniqueEmployees(shifts);
  const shiftLookup = buildShiftLookup(shifts);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 bg-gray-100">Employee</th>
            {dates.map((date) => (
              <th key={date} className="px-2 py-1 bg-gray-100 text-xs">{date}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.employeeId}>
              <td className="px-2 py-1 font-medium bg-gray-50">{emp.employeeName}</td>
              {dates.map((date) => {
                const shift = shiftLookup[emp.employeeId]?.[date];
                return (
                  <td key={date} className="px-2 py-1 text-center">
                    {shift ? (
                      <div
                        className="rounded shadow text-xs flex flex-col items-center justify-center"
                        style={{ backgroundColor: shift.colorCode, minWidth: 48, minHeight: 32 }}
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
  );
};

export default ShiftViewer;
