// This script seeds a SQLite database for the Felios project structure described by the user.
// It creates tables and inserts some example data for Projects, Networks, Milestones, Operations, Resources, Employees, Shifts, and Dependencies.

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
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
  daily_capacity INTEGER NOT NULL,
  color_code TEXT NOT NULL
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

// Helper functions for random data
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const projectNames = [
  'Hydraulikpresse', 'Montagelinie', 'Roboterzelle', 'Fräsmaschine', 'Drehmaschine',
  'Förderband', 'Lackieranlage', 'Schweißroboter', 'Montageautomat', 'Prüfstand',
  'Verpackungsstraße', 'CNC-Bearbeitung', 'Blechumformung', 'Gießerei', 'Bohrwerk',
  'Laserstation', 'Stanzautomat', 'Montageinsel', 'Palettierer', 'Sortieranlage',
  'Automatisierungslinie', 'Qualitätskontrolle', 'Materialfluss', 'Werkzeugwechsel', 'Kühlanlage',
  'Presswerk', 'Montageband', 'Roboterarm', 'Bearbeitungszentrum', 'Schleifmaschine',
  'Sägeautomat', 'Montagekarussell', 'Lagerverwaltung', 'Transportmodul', 'Entgratstation',
  'Reinigungsanlage', 'Verpackungsmodul', 'Montagezelle', 'Prüfmodul', 'Handhabungsgerät',
  'Montageportal', 'Schraubstation', 'Montagepuffer', 'Sortierroboter', 'Montagewagen',
  'Montagevorrichtung', 'Montageplattform', 'Montagegreifer', 'Montageförderer', 'Montageprüfstand'
];

const networkNames = [
  'Vormontage', 'Endmontage', 'Qualitätsprüfung', 'Logistik', 'Materialbereitstellung',
  'Fertigung', 'Verpackung', 'Lackierung', 'Schweißen', 'Montage', 'Prüfung', 'Transport'
];

const operationNames = [
  'Bohren', 'Fräsen', 'Drehen', 'Montieren', 'Schweißen', 'Lackieren', 'Prüfen', 'Verpacken',
  'Transportieren', 'Justieren', 'Reinigen', 'Entgraten', 'Schrauben', 'Palettieren', 'Sortieren',
  'Einlagern', 'Auslagern', 'Beschriften', 'Kalibrieren', 'Testen'
];

const milestoneNames = [
  'Konstruktionsfreigabe', 'Materialeingang', 'Fertigungsstart', 'Montagebeginn', 'Erste Prüfung',
  'Endabnahme', 'Auslieferung', 'Projektabschluss', 'Zwischenabnahme', 'Serienstart'
];

const resourceNames = [
  'CNC-Fräse', 'Industrieroboter', 'Montageband', 'Schweißgerät', 'Lackierkabine', 'Prüfstand'
];

const employeeFirstNames = [
  'Lukas', 'Leon', 'Finn', 'Paul', 'Jonas', 'Elias', 'Noah', 'Ben', 'Luis', 'Felix',
  'Anna', 'Lea', 'Mia', 'Emma', 'Lina', 'Marie', 'Sophie', 'Hannah', 'Laura', 'Clara',
  'Maximilian', 'Moritz', 'Julian', 'Tim', 'David', 'Fabian', 'Simon', 'Tom', 'Jan', 'Philipp',
  'Johannes', 'Nico', 'Jannik', 'Erik', 'Emil', 'Oskar', 'Matteo', 'Samuel', 'Julius', 'Anton'
];
const employeeLastNames = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Hoffmann', 'Schulz',
  'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun',
  'Krüger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz', 'Krause', 'Meier', 'Lehmann',
  'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'König', 'Walter', 'Mayer', 'Huber', 'Kaiser'
];

const shiftModels = [
  { name: 'Frühschicht', daily_capacity: 8, color_code: '#B0BEC5' }, // Light blue-grey
  { name: 'Spätschicht', daily_capacity: 8, color_code: '#90A4AE' }, // Medium blue-grey
  { name: 'Nachtschicht', daily_capacity: 8, color_code: '#78909C' }, // Darker blue-grey
  { name: 'Abwesend', daily_capacity: 0, color_code: '#CFD8DC' } // Very light grey
];

// Insert resources
const resourceIds = resourceNames.map(name => db.prepare('INSERT INTO resource (name) VALUES (?)').run(name).lastInsertRowid);

// Insert employees
const employeeIds = [];
const usedNames = new Set();
while (employeeIds.length < 80) {
  const first = employeeFirstNames[randomInt(0, employeeFirstNames.length - 1)];
  const last = employeeLastNames[randomInt(0, employeeLastNames.length - 1)];
  const full = `${first} ${last}`;
  if (!usedNames.has(full)) {
    usedNames.add(full);
    employeeIds.push(db.prepare('INSERT INTO employee (name) VALUES (?)').run(full).lastInsertRowid);
  }
}

// Insert shift models
const shiftIds = shiftModels.map(s => db.prepare('INSERT INTO shift (name, daily_capacity, color_code) VALUES (?, ?, ?)').run(s.name, s.daily_capacity, s.color_code).lastInsertRowid);

// Assign qualifications: distribute employees evenly over resources
// For some employees, add qualifications to multiple resources
for (let i = 0; i < employeeIds.length; i++) {
  const resourceId = resourceIds[i % resourceIds.length];
  db.prepare('INSERT INTO employee_qualification (employee_id, resource_id) VALUES (?, ?)').run(employeeIds[i], resourceId);
  // 25% chance to add a second qualification
  if (Math.random() < 0.25) {
    let otherResourceId;
    do {
      otherResourceId = resourceIds[randomInt(0, resourceIds.length - 1)];
    } while (otherResourceId === resourceId);
    db.prepare('INSERT INTO employee_qualification (employee_id, resource_id) VALUES (?, ?)').run(employeeIds[i], otherResourceId);
  }
}

// Insert projects, networks, milestones, operations, dependencies, assignments
const operationIdsByNetwork = {};
const allOperationIds = [];
for (let p = 0; p < 50; p++) {
  const projectName = `${projectNames[p % projectNames.length]} ${p + 1}`;
  const projectId = db.prepare('INSERT INTO project (name) VALUES (?)').run(projectName).lastInsertRowid;

  // 2-3 networks per project
  const numNetworks = randomInt(2, 3);
  const networkIds = [];
  for (let n = 0; n < numNetworks; n++) {
    const networkName = `${networkNames[randomInt(0, networkNames.length - 1)]} ${n + 1}`;
    const networkId = db.prepare('INSERT INTO network (project_id, name) VALUES (?, ?)').run(projectId, networkName).lastInsertRowid;
    networkIds.push(networkId);
    operationIdsByNetwork[networkId] = [];

    // 4-10 operations per network
    const numOps = randomInt(4, 10);
    for (let o = 0; o < numOps; o++) {
      const opName = `${operationNames[randomInt(0, operationNames.length - 1)]} ${o + 1}`;
      const timeCapacity = randomInt(4, 16);
      const resourceId = resourceIds[(o + n) % resourceIds.length];
      // Random start/end in 2025
      const startDay = randomInt(1, 350);
      const startDate = new Date(2025, 0, 1 + startDay);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + randomInt(1, 5));
      const opId = db.prepare('INSERT INTO operation (network_id, name, time_capacity_demand, resource_id, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)')
        .run(networkId, opName, timeCapacity, resourceId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)).lastInsertRowid;
      operationIdsByNetwork[networkId].push(opId);
      allOperationIds.push(opId);
    }
  }

  // Add 2-4 milestones per project
  const numMilestones = randomInt(2, 4);
  for (let m = 0; m < numMilestones; m++) {
    const msName = `${milestoneNames[randomInt(0, milestoneNames.length - 1)]} ${m + 1}`;
    const dueDay = randomInt(30, 360);
    const dueDate = new Date(2025, 0, 1 + dueDay).toISOString().slice(0, 10);
    db.prepare('INSERT INTO milestone (project_id, name, due_date) VALUES (?, ?, ?)').run(projectId, msName, dueDate);
  }

  // Add dependencies: randomly connect some operations within each network
  for (const networkId of networkIds) {
    const ops = operationIdsByNetwork[networkId];
    for (let i = 1; i < ops.length; i++) {
      if (Math.random() < 0.7) { // 70% chance to depend on previous
        db.prepare('INSERT INTO operation_dependency (operation_id, depends_on_operation_id) VALUES (?, ?)').run(ops[i], ops[i - 1]);
      }
    }
  }
}

// Assign operations to employees (operation_assignment) and assign shifts (employee_shift)
const weekdays2025 = [];
for (let d = new Date(2025, 0, 1); d.getFullYear() === 2025; d.setDate(d.getDate() + 1)) {
  if (d.getDay() !== 0 && d.getDay() !== 6) { // skip weekends
    weekdays2025.push(new Date(d));
  }
}

// Assign shifts to employees for every weekday
for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
  const employeeId = employeeIds[empIdx];
  for (let i = 0; i < weekdays2025.length; i++) {
    // Cycle through shift models, but make some employees occasionally absent
    let shiftIdx = (empIdx + i) % (shiftIds.length - 1); // last is 'Abwesend'
    if (Math.random() < 0.05) shiftIdx = shiftIds.length - 1; // 5% chance absent
    db.prepare('INSERT INTO employee_shift (employee_id, shift_id, date) VALUES (?, ?, ?)')
      .run(employeeId, shiftIds[shiftIdx], weekdays2025[i].toISOString().slice(0, 10));
  }
}

// Assign employees to operations (operation_assignment)
// For 80% of operations, assign employees, respecting shift capacity per day
const employeeShiftMap = {};
for (const empId of employeeIds) {
  employeeShiftMap[empId] = {};
}
for (let i = 0; i < weekdays2025.length; i++) {
  const dateStr = weekdays2025[i].toISOString().slice(0, 10);
  for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
    const empId = employeeIds[empIdx];
    // Find shift for this employee on this day
    const shiftRow = db.prepare('SELECT shift_id FROM employee_shift WHERE employee_id = ? AND date = ?').get(empId, dateStr);
    let shiftCapacity = 0;
    if (shiftRow) {
      const shift = db.prepare('SELECT daily_capacity FROM shift WHERE id = ?').get(shiftRow.shift_id);
      shiftCapacity = shift ? shift.daily_capacity : 0;
    }
    employeeShiftMap[empId][dateStr] = { capacity: shiftCapacity, used: 0 };
  }
}

for (const opId of allOperationIds) {
  if (Math.random() > 0.8) continue; // Only assign 80% of operations
  // Pick a random employee qualified for the resource
  const op = db.prepare('SELECT resource_id, start_date, end_date, time_capacity_demand FROM operation WHERE id = ?').get(opId);
  const qualified = db.prepare('SELECT employee_id FROM employee_qualification WHERE resource_id = ?').all(op.resource_id);
  if (qualified.length === 0) continue;
  // Try to assign an employee who has enough shift capacity for all days
  let assigned = false;
  for (let tryIdx = 0; tryIdx < qualified.length && !assigned; tryIdx++) {
    const empId = qualified[tryIdx].employee_id;
    let canAssign = true;
    const start = new Date(op.start_date);
    const end = new Date(op.end_date);
    const assignDates = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
      const dateStr = d.toISOString().slice(0, 10);
      const shiftInfo = employeeShiftMap[empId][dateStr];
      if (!shiftInfo || shiftInfo.capacity - shiftInfo.used < op.time_capacity_demand) {
        canAssign = false;
        break;
      }
      assignDates.push(dateStr);
    }
    if (canAssign) {
      // Assign for each day of the operation
      for (const dateStr of assignDates) {
        db.prepare('INSERT INTO operation_assignment (operation_id, employee_id, date, assigned_capacity) VALUES (?, ?, ?, ?)')
          .run(opId, empId, dateStr, op.time_capacity_demand);
        employeeShiftMap[empId][dateStr].used += op.time_capacity_demand;
      }
      assigned = true;
    }
  }
}

// Vacuum the database to optimize storage (optional)
db.pragma('vacuum');

console.log('Seeding completed.');
