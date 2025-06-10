import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Path to the SQLite database
const dbPath = path.join(process.cwd(), 'lib', 'db', 'felios-data', 'felios.db');

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (typeof query !== 'string') {
      return NextResponse.json({ error: 'Query must be a string.' }, { status: 400 });
    }
    const db = new Database(dbPath, { readonly: true });
    const stmt = db.prepare(query);
    let result;
    if (/^\s*select/i.test(query)) {
      result = stmt.all();
    } else {
      result = stmt.run();
    }
    db.close();
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
