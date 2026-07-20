import { DatabaseManager } from './DatabaseManager.js';
import * as fs from 'fs';
import * as path from 'path';

export class MigrationManager {
    constructor(private dbManager: DatabaseManager) {}

    public init(): void {
        const db = this.dbManager.getDb();
        db.prepare(`
            CREATE TABLE IF NOT EXISTS migrations_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();
    }

    public getAppliedMigrations(): string[] {
        const db = this.dbManager.getDb();
        const rows = db.prepare('SELECT name FROM migrations_history ORDER BY id ASC').all() as { name: string }[];
        return rows.map(r => r.name);
    }

    public runMigrations(migrationsDir: string): void {
        this.init();
        const applied = new Set(this.getAppliedMigrations());
        
        if (!fs.existsSync(migrationsDir)) return;
        
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // ensures 001_..., 002_... order

        for (const file of files) {
            if (applied.has(file)) continue;

            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            console.log(`Applying migration: ${file}`);
            
            // Execute the migration in a transaction
            this.dbManager.transaction((db) => {
                db.exec(sql);
                db.prepare('INSERT INTO migrations_history (name) VALUES (?)').run(file);
            });
            
            console.log(`Migration ${file} applied successfully.`);
        }
    }
}
