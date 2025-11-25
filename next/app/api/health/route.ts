import { NextResponse } from 'next/server';
import { initDb } from '../../../src/lib/db';
import fs from 'fs';
import path from 'path';

initDb();

export async function GET() {
  try {
    const dbPath = path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'app.db');
    const dbExists = fs.existsSync(dbPath);
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbExists ? 'connected' : 'not_found',
      storage: process.env.STORAGE_TYPE || 'local',
      version: '1.0.0'
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
}

