import { createTool } from "@mastra/core";
import { z } from "zod";
import Database from 'better-sqlite3';
import path from "node:path";

export const shiftViewerTool = createTool({
    id: 'shift-viewer-tool',
    description: 'A tool to view the shifts of employees over a period of time.',
    inputSchema: z.object({
        startDate: z.string().describe('Start date in YYYY-MM-DD format'),
        endDate: z.string().describe('End date in YYYY-MM-DD format'),
        employeeIds: z.array(z.number()).describe('Array of employee IDs to view shifts for'),
    }),
    outputSchema: z.object({
        shifts: z.array(z.object({
            employeeId: z.string().describe('ID of the employee'),
            employeeName: z.string().describe('Name of the employee'),
            shiftName: z.string().describe('Name of the shift'),
            date: z.string().describe('Date of the shift in YYYY-MM-DD format'),
            colorCode: z.string().describe('Color code of the shift'),
            duration: z.number().describe('Duration of the shift in hours'),
        })),
    }).describe('An object containing the shifts of employees over the specified period.'),
    execute: async ({context: { startDate, endDate, employeeIds }}) => {
        // Open the database (readonly)
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database(dbPath, { readonly: true });
        type Shift = { employeeId: string; employeeName: string; shiftName: string; date: string; colorCode: string; duration: number };
        let shifts: Shift[] = [];
        try {
            // Query all shifts for the given employees and date range
            const stmt = db.prepare(`
                SELECT es.employee_id as employeeId, e.name as employeeName, s.name as shiftName, es.date as date, s.color_code as colorCode, s.daily_capacity as duration
                FROM employee_shift es
                JOIN shift s ON es.shift_id = s.id
                JOIN employee e ON es.employee_id = e.id
                WHERE es.employee_id IN (${employeeIds.map(() => '?').join(',')})
                  AND es.date >= ? AND es.date <= ?
                ORDER BY es.employee_id, es.date
            `);
            shifts = stmt.all(...employeeIds, startDate, endDate) as Shift[];
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            db.close();
        }
        return { shifts };
    },
});