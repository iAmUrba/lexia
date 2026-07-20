import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB stored in packages/server/.data/lexia.db
const dataDir = path.join(__dirname, '..', '.data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'lexia.db');
const sqlite = new Database(dbPath);

// Initialize DB schema automatically for the MVP
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    file_hash TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS document_text (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    ocr_method TEXT NOT NULL,
    extracted_at INTEGER NOT NULL,
    FOREIGN KEY(id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS document_evidence (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    page INTEGER NOT NULL DEFAULT 1,
    confidence REAL NOT NULL DEFAULT 1.0,
    FOREIGN KEY(document_id) REFERENCES documents(id)
  );

  CREATE TABLE IF NOT EXISTS expedientes (
    id TEXT PRIMARY KEY,
    drive_id TEXT,
    folder_id TEXT,
    path TEXT,
    estado TEXT,
    last_scanned_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    expediente_id TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    cedula TEXT,
    FOREIGN KEY(expediente_id) REFERENCES expedientes(id)
  );

  CREATE TABLE IF NOT EXISTS actuaciones (
    id TEXT PRIMARY KEY,
    expediente_id TEXT NOT NULL,
    document_id TEXT,
    type TEXT NOT NULL,
    fecha INTEGER,
    descripcion TEXT,
    FOREIGN KEY(expediente_id) REFERENCES expedientes(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    document_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
