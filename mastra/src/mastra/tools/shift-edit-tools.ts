import { createTool } from "@mastra/core";
import { z } from "zod";
import * as Database from 'better-sqlite3';
import path from "node:path";

// Tool 1: Upsert Employee Shift
export const upsertEmployeeShiftTool = createTool({
    id: 'felios-upsert-employee-shift',
    description: 'Upsert (remove then insert) an employee_shift for a given employee and date.',
    inputSchema: z.object({
        employee_id: z.number().describe('The employee id.'),
        shift_id: z.number().describe('The shift id.'),
        date: z.string().describe('The date (YYYY-MM-DD).'),
    }),
    outputSchema: z.object({
        success: z.boolean().describe('Whether the operation was successful.'),
        message: z.string().describe('The SQL output or error message.'),
    }),
    execute: async ({ context: { employee_id, shift_id, date } }) => {
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database.default(dbPath);
        let success = true;
        let message = '';
        try {
            db.prepare('DELETE FROM employee_shift WHERE employee_id = ? AND date = ?').run(employee_id, date);
            db.prepare('INSERT INTO employee_shift (employee_id, shift_id, date) VALUES (?, ?, ?)').run(employee_id, shift_id, date);
            message = 'Upsert successful.';
        } catch (error) {
            success = false;
            message = `Error: ${error}`;
        } finally {
            db.close();
        }
        return { success, message };
    },
});

// Tool 2: Delete Employee Shift
export const deleteEmployeeShiftTool = createTool({
    id: 'felios-delete-employee-shift',
    description: 'Delete all employee_shift entries for a given employee and date.',
    inputSchema: z.object({
        employee_id: z.number().describe('The employee id.'),
        date: z.string().describe('The date (YYYY-MM-DD).'),
    }),
    outputSchema: z.object({
        success: z.boolean().describe('Whether the operation was successful.'),
        message: z.string().describe('The SQL output or error message.'),
    }),
    execute: async ({ context: { employee_id, date } }) => {
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database.default(dbPath);
        let success = true;
        let message = '';
        try {
            db.prepare('DELETE FROM employee_shift WHERE employee_id = ? AND date = ?').run(employee_id, date);
            message = 'Delete successful.';
        } catch (error) {
            success = false;
            message = `Error: ${error}`;
        } finally {
            db.close();
        }
        return { success, message };
    },
});
