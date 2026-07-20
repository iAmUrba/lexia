import { DatabaseManager } from '../infrastructure/sqlite/DatabaseManager.js';
import { MigrationManager } from '../infrastructure/sqlite/MigrationManager.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifySqlite() {
    console.log('\n--- LEXIA CORE: VERIFY SQLITE INFRASTRUCTURE ---');
    
    // Set temp db path
    const dbPath = path.join(__dirname, '..', '..', 'data', 'test_lexia.db');
    process.env.LEXIA_DB_PATH = dbPath;

    // Clean up before test
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

    let allPassed = true;
    const runTest = (name: string, fn: () => void) => {
        try {
            fn();
            console.log(`✓ ${name}`);
        } catch (e: any) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            allPassed = false;
        }
    };

    const dbManager = DatabaseManager.getInstance();

    runTest('Conectar a BD (Crea archivo si no existe)', () => {
        dbManager.connect();
        if (!fs.existsSync(dbPath)) throw new Error('El archivo de la BD no se creó');
    });

    runTest('Configuraciones PRAGMA (WAL, foreign_keys, synchronous)', () => {
        const db = dbManager.getDb();
        const journal = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
        const fk = db.pragma('foreign_keys', { simple: true });
        const sync = db.pragma('synchronous', { simple: true });

        if (journal.journal_mode.toLowerCase() !== 'wal') throw new Error(`journal_mode no es WAL, es ${journal.journal_mode}`);
        if (fk !== 1) throw new Error('foreign_keys no está ON');
        if (sync !== 2 && sync !== 'FULL') throw new Error(`synchronous no es FULL, es ${sync}`);
    });

    runTest('HealthCheck (ping)', () => {
        if (!dbManager.ping()) throw new Error('Ping a la base de datos falló');
    });

    runTest('Migraciones Transaccionales (001_initial_schema)', () => {
        const migrationsDir = path.join(__dirname, '..', 'infrastructure', 'sqlite', 'migrations');
        const migrationManager = new MigrationManager(dbManager);
        migrationManager.runMigrations(migrationsDir);

        const db = dbManager.getDb();
        // Verificar tabla metadata
        const metadata = db.prepare('SELECT * FROM system_metadata LIMIT 1').get() as any;
        if (!metadata || !metadata.database_uuid) throw new Error('Tabla system_metadata no se pobló correctamente');
    });

    runTest('Rollback en Transacciones', () => {
        const db = dbManager.getDb();
        db.prepare('CREATE TABLE test_rollback (id INTEGER)').run();

        try {
            dbManager.transaction((innerDb) => {
                innerDb.prepare('INSERT INTO test_rollback (id) VALUES (1)').run();
                throw new Error('Simulated failure');
            });
        } catch (e: any) {
            if (e.message !== 'Simulated failure') throw e;
        }

        const count = (db.prepare('SELECT COUNT(*) as c FROM test_rollback').get() as any).c;
        if (count !== 0) throw new Error('El rollback no funcionó, el registro se insertó');
    });

    runTest('Integridad y Cierre (Graceful shutdown)', () => {
        dbManager.close();
        if (dbManager.ping()) throw new Error('Ping debería fallar después del cierre');
    });

    runTest('Benchmark de escritura con transacciones', () => {
        // Reconectamos para benchmark
        dbManager.connect();
        const db = dbManager.getDb();
        db.prepare('CREATE TABLE bench (id INTEGER PRIMARY KEY, val TEXT)').run();
        
        const start = performance.now();
        dbManager.transaction((innerDb) => {
            const stmt = innerDb.prepare('INSERT INTO bench (val) VALUES (?)');
            for (let i = 0; i < 1000; i++) {
                stmt.run(`data_${i}`);
            }
        });
        const elapsed = performance.now() - start;
        
        // Assert 1000 inserts in less than 50ms (usually takes < 10ms with WAL and transactions)
        if (elapsed > 250) throw new Error(`Benchmark muy lento: ${elapsed.toFixed(2)}ms para 1000 inserts`);
        console.log(`  - 1000 inserts en transacción: ${elapsed.toFixed(2)}ms`);
        
        dbManager.close();
    });

    // Cleanup
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
    if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');

    if (allPassed) {
        console.log('\nverify:sqlite: PASSED');
    } else {
        console.log('\nverify:sqlite: FAILED');
        process.exit(1);
    }
}

verifySqlite();
