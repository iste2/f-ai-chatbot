// This script seeds a SQLite database for the Felios project structure described by the user.
// It creates tables and inserts some example data for Projects, Networks, Milestones, Operations, Resources, Employees, Shifts, and Dependencies.

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(__dirname, 'felios.db');
const db = new Database(dbPath);

// Drop tables if they exist
const tables = [
  'operation_dependency',
  'operation',
  'milestone',
  'network',
  'project',
  'operation_assignment',
  'resource',
  'employee_qualification',
  'employee',
  'shift',
  'employee_shift',
];
tables.forEach((table) => {
  db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
});

// Create tables

db.exec(`
CREATE TABLE project (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE network (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  parent_network_id INTEGER,
  name TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES project(id),
  FOREIGN KEY(parent_network_id) REFERENCES network(id)
);

CREATE TABLE milestone (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  name TEXT NOT NULL,
  due_date TEXT,
  FOREIGN KEY(project_id) REFERENCES project(id)
);

CREATE TABLE operation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  network_id INTEGER,
  name TEXT NOT NULL,
  time_capacity_demand INTEGER NOT NULL,
  resource_id INTEGER NOT NULL,
  start_date TEXT,
  end_date TEXT,
  FOREIGN KEY(network_id) REFERENCES network(id),
  FOREIGN KEY(resource_id) REFERENCES resource(id)
);

CREATE TABLE operation_dependency (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id INTEGER NOT NULL,
  depends_on_operation_id INTEGER NOT NULL,
  FOREIGN KEY(operation_id) REFERENCES operation(id),
  FOREIGN KEY(depends_on_operation_id) REFERENCES operation(id)
);

CREATE TABLE resource (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE employee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE shift (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  daily_capacity INTEGER NOT NULL
);

CREATE TABLE employee_qualification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  resource_id INTEGER NOT NULL,
  FOREIGN KEY(employee_id) REFERENCES employee(id),
  FOREIGN KEY(resource_id) REFERENCES resource(id)
);

CREATE TABLE operation_assignment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  assigned_capacity INTEGER NOT NULL,
  FOREIGN KEY(operation_id) REFERENCES operation(id),
  FOREIGN KEY(employee_id) REFERENCES employee(id)
);

CREATE TABLE employee_shift (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  shift_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY(employee_id) REFERENCES employee(id),
  FOREIGN KEY(shift_id) REFERENCES shift(id)
);
`);

// Insert example data
const projectId = db.prepare('INSERT INTO project (name) VALUES (?)').run('Project Alpha').lastInsertRowid;
const networkId = db.prepare('INSERT INTO network (project_id, name) VALUES (?, ?)').run(projectId, 'Main Network').lastInsertRowid;
const milestoneId = db.prepare('INSERT INTO milestone (project_id, name, due_date) VALUES (?, ?, ?)').run(projectId, 'Milestone 1', '2025-07-01').lastInsertRowid;
const resourceId = db.prepare('INSERT INTO resource (name) VALUES (?)').run('Resource A').lastInsertRowid;
const operationId = db.prepare('INSERT INTO operation (network_id, name, time_capacity_demand, resource_id, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').run(networkId, 'Operation 1', 8, resourceId, '2025-06-10', '2025-06-12').lastInsertRowid;
db.prepare('INSERT INTO operation_dependency (operation_id, depends_on_operation_id) VALUES (?, ?)').run(operationId, operationId); // self-dependency example
const employeeId = db.prepare('INSERT INTO employee (name) VALUES (?)').run('Alice').lastInsertRowid;
const shiftId = db.prepare('INSERT INTO shift (name, daily_capacity) VALUES (?, ?)').run('Morning', 8).lastInsertRowid;
db.prepare('INSERT INTO employee_qualification (employee_id, resource_id) VALUES (?, ?)').run(employeeId, resourceId);
db.prepare('INSERT INTO operation_assignment (operation_id, employee_id, date, assigned_capacity) VALUES (?, ?, ?, ?)').run(operationId, employeeId, '2025-06-10', 8);

db.prepare('INSERT INTO employee_shift (employee_id, shift_id, date) VALUES (?, ?, ?)').run(employeeId, shiftId, '2025-06-10');

console.log('Database seeded at', dbPath);
db.close();
