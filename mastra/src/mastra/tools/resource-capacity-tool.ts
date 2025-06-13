import { createTool } from "@mastra/core";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "node:path";

export const resourceCapacityTool = createTool({
    id: 'resource-capacity-tool',
    description: 'A tool to visualize the resource capacity for a given resource. Displays the maximum possible capacity and yet assigned capacity for each day in the specified date range.',
    inputSchema: z.object({
        resourceId: z.number().describe('ID of the resource to calculate capacity for'),
        startDate: z.string().describe('Start date in YYYY-MM-DD format'),
        endDate: z.string().describe('End date in YYYY-MM-DD format'),
    }),
    outputSchema: z.object({
        data: z.array(z.object({
            date: z.string().describe('Date in YYYY-MM-DD format'),
            capacity: z.number().describe('Max possible resource capacity for the given date'),
            assigned: z.number().describe('Assigned resource capacity for the given date'),
        })),
    }).describe('An object containing the resource capacity visualization data.'),
    execute: async ({ context: { resourceId, startDate, endDate } }) => {
        // Open the database (readonly)
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database(dbPath, { readonly: true });
        try {
            // 1. Get all employees qualified for the resource
            const qualifiedStmt = db.prepare(`
                SELECT employee_id FROM employee_qualification WHERE resource_id = ?
            `);
            const qualifiedRows = qualifiedStmt.all(resourceId);
            const qualifiedEmployeeIds = qualifiedRows.map((row: any) => row.employee_id);
            if (qualifiedEmployeeIds.length === 0) {
                // No qualified employees, return 0 for all days
                const result = [];
                let d = new Date(startDate);
                const end = new Date(endDate);
                while (d <= end) {
                    result.push({ date: d.toISOString().slice(0, 10), capacity: 0, assigned: 0 });
                    d.setDate(d.getDate() + 1);
                }
                return { data: result };
            }

            // 2. Get all shifts for these employees in the date range
            const shiftStmt = db.prepare(`
                SELECT es.employee_id, es.date, s.daily_capacity
                FROM employee_shift es
                JOIN shift s ON es.shift_id = s.id
                WHERE es.employee_id IN (${qualifiedEmployeeIds.map(() => '?').join(',')})
                  AND es.date >= ? AND es.date <= ?
            `);
            const shiftRows = shiftStmt.all(...qualifiedEmployeeIds, startDate, endDate);
            // Map: { [date]: { [employee_id]: daily_capacity } }
            const shiftMap: Record<string, Record<string, number>> = {};
            for (const row of shiftRows as Array<{ employee_id: string; date: string; daily_capacity: number }>) {
                if (!shiftMap[row.date]) shiftMap[row.date] = {};
                shiftMap[row.date][row.employee_id] = row.daily_capacity;
            }

            // 3. Get all operations for this resource (with their start/end/capacity demand)
            const opStmt = db.prepare(`SELECT id, start_date, end_date, time_capacity_demand FROM operation WHERE resource_id = ?`);
            const opRows = opStmt.all(resourceId);
            const opIds = opRows.map((row: any) => row.id);

            // Build a map of operationId -> {start, end, demand, duration, dailyDemand}
            const opDemandMap: Record<string, {start: string, end: string, demand: number, duration: number, dailyDemand: number}> = {};
            for (const op of opRows as Array<{id: string, start_date: string, end_date: string, time_capacity_demand: number}>) {
                const start = new Date(op.start_date);
                const end = new Date(op.end_date);
                const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000*60*60*24)) + 1);
                const dailyDemand = op.time_capacity_demand / duration;
                opDemandMap[op.id] = {
                    start: op.start_date,
                    end: op.end_date,
                    demand: op.time_capacity_demand,
                    duration,
                    dailyDemand
                };
            }

            // 4. Get all assignments for these operations in the date range
            let assignmentMap: Record<string, number> = {};
            if (opIds.length > 0) {
                const assignStmt = db.prepare(`
                    SELECT date, SUM(assigned_capacity) as assigned
                    FROM operation_assignment
                    WHERE operation_id IN (${opIds.map(() => '?').join(',')})
                      AND date >= ? AND date <= ?
                    GROUP BY date
                `);
                const assignRows = assignStmt.all(...opIds, startDate, endDate);
                for (const row of assignRows as Array<{ date: string; assigned: number }>) {
                    assignmentMap[row.date] = row.assigned;
                }
            } else {
                console.log('No operation IDs for assignments.');
            }

            // 5. For each day, calculate capacity and assigned
            const result = [];
            let d = new Date(startDate);
            const end = new Date(endDate);
            while (d <= end) {
                const dateStr = d.toISOString().slice(0, 10);
                let capacity = 0;
                if (shiftMap[dateStr]) {
                    for (const empId of Object.keys(shiftMap[dateStr])) {
                        capacity += shiftMap[dateStr][empId];
                    }
                }
                const assigned = assignmentMap[dateStr] || 0;
                result.push({ date: dateStr, capacity, assigned });
                d.setDate(d.getDate() + 1);
            }
            return { data: result };
        } finally {
            db.close();
        }
    },
});