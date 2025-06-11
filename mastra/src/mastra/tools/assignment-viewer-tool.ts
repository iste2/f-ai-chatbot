import { createTool } from "@mastra/core";
import { z } from "zod";
import Database from 'better-sqlite3';
import path from "node:path";

export const assignmentViewerTool = createTool({
    id: 'assignment-viewer-tool',
    description: 'A tool to view the assignments of employees to operations.',
    inputSchema: z.object({
        operationIds: z.array(z.string()).describe('Array of operation IDs to view assignments for'),
    }),
    outputSchema: z.object({
        assignments: z.array(z.object({
            employeeId: z.string().describe('ID of the employee'),
            employeeName: z.string().describe('Name of the employee'),
            operationId: z.string().describe('ID of the operation'),
            operationName: z.string().describe('Name of the operation'),
            operation_startDate: z.string().describe('Start date of the operation in YYYY-MM-DD format'),
            operation_endDate: z.string().describe('End date of the operation in YYYY-MM-DD format'),
            operation_colorCode: z.string().describe('Color code of the operation'),
            duration: z.number().describe('Duration of the assignment in hours'),
            date: z.string().describe('Date of the assignment in YYYY-MM-DD format'),
            operation_capacityDemand: z.number().describe('Capacity demand of the operation in hours'),
        })),
    }).describe('An object containing the assignments of employees to operations.'),
    execute: async ({context: { operationIds }}) => {
        // Open the database (readonly)
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database(dbPath, { readonly: true });
        let assignments = [];
        try {
            if (!operationIds || operationIds.length === 0) {
                return { assignments: [] };
            }
            // Query all assignments for the given operationIds
            const stmt = db.prepare(`
                SELECT 
                    oa.employee_id as employeeId,
                    e.name as employeeName,
                    oa.operation_id as operationId,
                    o.name as operationName,
                    o.start_date as operation_startDate,
                    o.end_date as operation_endDate,
                    p.color_code as operation_colorCode,
                    oa.assigned_capacity as duration,
                    oa.date as date,
                    o.time_capacity_demand as operation_capacityDemand
                FROM operation_assignment oa
                JOIN employee e ON oa.employee_id = e.id
                JOIN operation o ON oa.operation_id = o.id
                JOIN network n ON o.network_id = n.id
                JOIN project p ON n.project_id = p.id
                WHERE oa.operation_id IN (${operationIds.map(() => '?').join(',')})
                ORDER BY oa.employee_id, oa.date
            `);
            assignments = stmt.all(...operationIds).map((row: any) => ({
                employeeId: String(row.employeeId),
                employeeName: row.employeeName,
                operationId: String(row.operationId),
                operationName: row.operationName,
                operation_startDate: row.operation_startDate,
                operation_endDate: row.operation_endDate,
                operation_colorCode: row.operation_colorCode,
                duration: row.duration,
                date: row.date,
                operation_capacityDemand: row.operation_capacityDemand,
            }));
        } finally {
            db.close();
        }
        return { assignments };
    },
});