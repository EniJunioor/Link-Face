import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
sqlite3.verbose();
export const db = new sqlite3.Database(dbPath);

export function initDb(): void {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL,
      phone TEXT,
      token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_token TEXT,
      name TEXT NOT NULL,
      cpf TEXT NOT NULL,
      photo_path TEXT NOT NULL,
      drive_file_id TEXT,
      consent_accepted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
  
  // Migração: Adiciona coluna consent_accepted se não existir
  db.all(`PRAGMA table_info(submissions)`, (err, rows: any) => {
    if (err) return;
    const columns = Array.isArray(rows) ? rows.map((r: any) => r.name) : [];
    if (!columns.includes('consent_accepted')) {
      db.run(`ALTER TABLE submissions ADD COLUMN consent_accepted INTEGER DEFAULT 0`, (alterErr) => {
        // Ignora erro silenciosamente se a coluna já existir ou outro erro ocorrer
      });
    }
  });
}

export function findEmployeeByToken(token: string): Promise<any | null> {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM employees WHERE token = ?`, [token], (err, row) => {
      if (err) return reject(err);
      resolve((row as any) || null);
    });
  });
}

export function insertSubmission({ employeeToken, name, cpf, photoPath, driveFileId, consentAccepted }: { employeeToken: string | null; name: string; cpf: string; photoPath: string; driveFileId?: string | null; consentAccepted: boolean; }): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO submissions (employee_token, name, cpf, photo_path, drive_file_id, consent_accepted)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeToken, name, cpf, photoPath, driveFileId ?? null, consentAccepted ? 1 : 0],
      function onDone(this: sqlite3.RunResult, err: Error | null) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}


