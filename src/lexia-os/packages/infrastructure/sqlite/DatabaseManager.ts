import Database, { Database as SQLiteDatabase } from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export class DatabaseManager {
    private static instance: DatabaseManager;
    private db: SQLiteDatabase | null = null;
    private dbPath: string;

    private constructor() {
        this.dbPath = process.env.LEXIA_DB_PATH || path.join(process.cwd(), 'data', 'lexia.db');
    }

    public static getInstance(): DatabaseManager {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }

    public connect(): void {
        if (this.db) return;

        // Ensure directory exists
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        this.db = new Database(this.dbPath);

        // Required PRAGMAs for durability and concurrent reads
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.db.pragma('synchronous = FULL');
    }

    public getDb(): SQLiteDatabase {
        if (!this.db) {
            throw new Error('Database not connected. Call connect() first.');
        }
        return this.db;
    }

    public close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    public ping(): boolean {
        try {
            if (!this.db) return false;
            const row = this.db.prepare('SELECT 1 as is_alive').get() as { is_alive: number };
            return row.is_alive === 1;
        } catch {
            return false;
        }
    }

    /**
     * Executes a callback within a SQLite transaction.
     * Rollback is automatic if the callback throws an error.
     */
    public transaction<T>(cb: (db: SQLiteDatabase) => T): T {
        const database = this.getDb();
        const execute = database.transaction((innerDb: SQLiteDatabase) => {
            return cb(innerDb);
        });
        return execute(database);
    }
}
