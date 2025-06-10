import { createTool } from "@mastra/core";
import { z } from "zod";
import Database from "better-sqlite3";
import path from "node:path";

export const ganttViewerTool = createTool({
    id: 'gantt-viewer-tool',
    description: 'A tool to fetch project, network, milestone, and operation data as a tree for Gantt chart display, including assigned employees for each operation. Input is a list of project IDs; the full project tree is returned for each.',
    inputSchema: z.object({
        projectIds: z.array(z.number()).describe('Array of project IDs to include'),
    }),
    outputSchema: z.object({
        projects: z.array(z.object({
            id: z.number(),
            name: z.string(),
            colorCode: z.string(),
            milestones: z.array(z.object({
                id: z.number(),
                name: z.string(),
                dueDate: z.string().nullable(),
            })),
            networks: z.array(z.object({
                id: z.number(),
                name: z.string(),
                operations: z.array(z.object({
                    id: z.number(),
                    name: z.string(),
                    startDate: z.string().nullable(),
                    endDate: z.string().nullable(),
                    timeCapacityDemand: z.number(),
                    resourceId: z.number(),
                    employees: z.array(z.object({
                        id: z.number(),
                        name: z.string(),
                        assignedCapacity: z.number(),
                    })),
                    dependencies: z.array(z.number()),
                })),
            })),
        })),
    }),
    execute: async ({ context: { projectIds } }) => {
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database(dbPath, { readonly: true });
        try {
            // Fetch projects
            const projects = db.prepare(`SELECT id, name, color_code FROM project WHERE id IN (${projectIds.map(() => '?').join(',')})`).all(...projectIds);
            // Fetch networks for all projects
            const networks = db.prepare(`SELECT id, name, project_id FROM network WHERE project_id IN (${projectIds.map(() => '?').join(',')})`).all(...projectIds);
            // Fetch milestones for all projects
            const milestones = db.prepare(`SELECT id, name, due_date, project_id FROM milestone WHERE project_id IN (${projectIds.map(() => '?').join(',')})`).all(...projectIds);
            // Fetch operations for all networks
            const networkIds = (networks as Array<{id: number}>).map(nw => nw.id);
            let operations: any[] = [];
            if (networkIds.length > 0) {
                operations = db.prepare(`SELECT id, name, start_date, end_date, time_capacity_demand, resource_id, network_id FROM operation WHERE network_id IN (${networkIds.map(() => '?').join(',')})`).all(...networkIds);
            }
            // Fetch employees for all operations (with assigned capacity)
            const opIds = operations.map(op => op.id);
            const employeesByOp: Record<number, { id: number, name: string, assignedCapacity: number }[]> = {};
            if (opIds.length > 0) {
                const rows = db.prepare(`
                    SELECT oa.operation_id as opId, e.id as id, e.name as name, SUM(oa.assigned_capacity) as assignedCapacity
                    FROM operation_assignment oa
                    JOIN employee e ON oa.employee_id = e.id
                    WHERE oa.operation_id IN (${opIds.map(() => '?').join(',')})
                    GROUP BY oa.operation_id, e.id
                `).all(...opIds) as Array<{opId: number, id: number, name: string, assignedCapacity: number}>;
                for (const row of rows) {
                    if (!employeesByOp[row.opId]) employeesByOp[row.opId] = [];
                    employeesByOp[row.opId].push({ id: row.id, name: row.name, assignedCapacity: row.assignedCapacity });
                }
            }
            // Fetch dependencies for all operations
            const dependenciesByOp: Record<number, number[]> = {};
            if (opIds.length > 0) {
                const depRows = db.prepare(`
                    SELECT operation_id, depends_on_operation_id
                    FROM operation_dependency
                    WHERE operation_id IN (${opIds.map(() => '?').join(',')})
                `).all(...opIds) as Array<{operation_id: number, depends_on_operation_id: number}>;
                for (const row of depRows) {
                    if (!dependenciesByOp[row.operation_id]) dependenciesByOp[row.operation_id] = [];
                    dependenciesByOp[row.operation_id].push(row.depends_on_operation_id);
                }
            }
            // Build tree
            const projectTree = (projects as Array<{id: number, name: string, color_code: string}>).map(proj => {
                const projMilestones = (milestones as Array<{id: number, name: string, due_date: string|null, project_id: number}>).filter(ms => ms.project_id === proj.id);
                const projNetworks = (networks as Array<{id: number, name: string, project_id: number}>).filter(nw => nw.project_id === proj.id);
                return {
                    id: proj.id,
                    name: proj.name,
                    colorCode: proj.color_code,
                    milestones: projMilestones.map(ms => ({
                        id: ms.id,
                        name: ms.name,
                        dueDate: ms.due_date,
                    })),
                    networks: projNetworks.map(nw => {
                        const nwOperations = (operations as Array<{id: number, name: string, start_date: string|null, end_date: string|null, time_capacity_demand: number, resource_id: number, network_id: number}>).filter(op => op.network_id === nw.id);
                        return {
                            id: nw.id,
                            name: nw.name,
                            operations: nwOperations.map(op => ({
                                id: op.id,
                                name: op.name,
                                startDate: op.start_date,
                                endDate: op.end_date,
                                timeCapacityDemand: op.time_capacity_demand,
                                resourceId: op.resource_id,
                                employees: employeesByOp[op.id] || [],
                                dependencies: dependenciesByOp[op.id] || [],
                            })),
                        };
                    }),
                };
            });
            return { projects: projectTree };
        } finally {
            db.close();
        }
    },
});
