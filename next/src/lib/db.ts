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
      email TEXT,
      token TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Migração: Adiciona coluna email se não existir
    db.all(`PRAGMA table_info(employees)`, (err, rows: any) => {
      if (err) return;
      const columns = Array.isArray(rows) ? rows.map((r: any) => r.name) : [];
      if (!columns.includes('email')) {
        db.run(`ALTER TABLE employees ADD COLUMN email TEXT`, (alterErr) => {
          // Ignora erro se a coluna já existir
        });
      }
    });
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

export function getAllSubmissions(limit: number = 100, offset: number = 0, employeeToken?: string | null): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let query = 'SELECT * FROM submissions';
    const params: any[] = [];
    
    if (employeeToken) {
      query += ' WHERE employee_token = ?';
      params.push(employeeToken);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    db.all(query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as any[]);
    });
  });
}

export function searchSubmissions(searchTerm: string, limit: number = 100): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const term = `%${searchTerm}%`;
    db.all(
      `SELECT * FROM submissions 
       WHERE name LIKE ? OR cpf LIKE ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [term, term, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows as any[]);
      }
    );
  });
}

export function getSubmissionById(id: number): Promise<any | null> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM submissions WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve((row as any) || null);
    });
  });
}

export function getSubmissionsByEmployeeToken(token: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM submissions WHERE employee_token = ? ORDER BY created_at DESC',
      [token],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows as any[]);
      }
    );
  });
}

export function getAllEmployees(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM employees ORDER BY created_at DESC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows as any[]);
    });
  });
}

export function createEmployee({ name, cpf, phone, email, token }: { name: string; cpf: string; phone?: string; email?: string; token: string }): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO employees (name, cpf, phone, email, token) VALUES (?, ?, ?, ?, ?)',
      [name, cpf, phone || null, email || null, token],
      function onDone(this: sqlite3.RunResult, err: Error | null) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

export function getSubmissionStats(): Promise<{ total: number; today: number; byEmployee: any[] }> {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as total FROM submissions', [], (err, totalRow: any) => {
      if (err) return reject(err);
      
      db.get(
        "SELECT COUNT(*) as today FROM submissions WHERE DATE(created_at) = DATE('now')",
        [],
        (err, todayRow: any) => {
          if (err) return reject(err);
          
          db.all(
            `SELECT employee_token, COUNT(*) as count 
             FROM submissions 
             WHERE employee_token IS NOT NULL 
             GROUP BY employee_token 
             ORDER BY count DESC`,
            [],
            (err, byEmployeeRows: any) => {
              if (err) return reject(err);
              
              resolve({
                total: totalRow?.total || 0,
                today: todayRow?.today || 0,
                byEmployee: byEmployeeRows || []
              });
            }
          );
        }
      );
    });
  });
}


