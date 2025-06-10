import { createTool } from "@mastra/core";
import { z } from "zod";
import Database from 'better-sqlite3';
import path from "node:path";

const description = `Felios Project Database Schema Overview

This database models a mechanical engineering project environment, including projects, networks, operations, resources, employees, shifts, and their relationships.

Tables and Relationships
project

id (PK): Unique project identifier.
name: Project name.
network

id (PK): Unique network identifier.
project_id (FK): References project(id).
parent_network_id (FK, nullable): References network(id) for hierarchical networks.
name: Network name.
milestone

id (PK): Unique milestone identifier.
project_id (FK): References project(id).
name: Milestone name.
due_date: Due date (YYYY-MM-DD).
operation

id (PK): Unique operation identifier.
network_id (FK): References network(id).
name: Operation name.
time_capacity_demand: Required work time (hours).
resource_id (FK): References resource(id).
start_date, end_date: Operation time window (YYYY-MM-DD).
operation_dependency

id (PK): Unique dependency identifier.
operation_id (FK): Operation that depends on another.
depends_on_operation_id (FK): Operation that must be completed first.
resource

id (PK): Unique resource identifier.
name: Resource name (e.g., machine, workstation).
employee

id (PK): Unique employee identifier.
name: Employee name.
employee_qualification

id (PK): Unique qualification identifier.
employee_id (FK): References employee(id).
resource_id (FK): References resource(id).
(Defines which resources an employee is qualified to operate.)
shift

id (PK): Unique shift identifier.
name: Shift name (e.g., Frühschicht, Spätschicht, Nachtschicht, Abwesend).
daily_capacity: Maximum work hours per day for this shift.
employee_shift

id (PK): Unique assignment identifier.
employee_id (FK): References employee(id).
shift_id (FK): References shift(id).
date: Date of the shift (YYYY-MM-DD).
operation_assignment

id (PK): Unique assignment identifier.
operation_id (FK): References operation(id).
employee_id (FK): References employee(id).
date: Assignment date (YYYY-MM-DD).
assigned_capacity: Number of hours assigned for this operation on this date.
Key Points for Query Generation
Employees can only be assigned to operations if they are qualified for the required resource.
An employee’s total assigned capacity per day (across all operations) must not exceed their shift’s daily_capacity.
Operations can have dependencies (must be completed in order).
Shifts and assignments are tracked per day.
Projects contain networks, which contain operations.
Milestones are linked to projects.`;

export const databaseSchemaDescriptionTool = createTool({
    id: 'felios-database-schema-description',
    description: 'Get the description of the database schema for the Felios project, including tables, relationships, and key points for query generation.',
    outputSchema: z.object({
        description: z.string().describe('The description of the Felios project database schema, including tables, relationships, and key points for query generation.'),
    }),
    execute: async () => {
        return {
            description: description,
        };
    },
});

export const sqlTool = createTool({
    id: 'felios-sql-string-tool',
    description: 'Execute SQL queries against the Felios project database. Only SELECT queries are allowed for security reasons.',
    inputSchema: z.object({
        query: z.string().describe('The SQL query to display data from the Felios project database. Only SELECT queries are allowed for security reasons. For database schema see the "felios-database-schema-description" tool.'),
    }),
    outputSchema: z.object({
        query: z.string().describe('The query to be shown in the UI.'),
        result: z.any().describe('The result of the SQL query.'),
        valid: z.boolean().describe('Indicates whether the query was valid and executed successfully.'),
    }),
    execute: async ({ context: { query } }) => {
        // Only select queries are allowed for security reasons
        let result : any;
        let valid = true;

        if (!query.trim().toLowerCase().startsWith('select')) {
            result = 'Only SELECT queries are allowed for security reasons.';
            valid = false;
            return {
                query: query.trim(),
                result: JSON.stringify(result),
                valid,
            };
        }
        // Get the result of the query from felios project database, query the database directly
        const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');
        const db = new Database(dbPath, { readonly: true });
        
        try {
            
            const stmt = db.prepare(query);
            if (/^\s*select/i.test(query)) {
                result = stmt.all();
            } else {
                result = stmt.run();
            }
        } catch (error) {
            console.error('Error executing SQL query:', error);
            result = `Error executing SQL query: ${error}`;
            valid = false;
        } finally {
            db.close();
        }

        return {
            query: query.trim(),
            result: JSON.stringify(result),
            valid,
        };
    },
});