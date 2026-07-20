import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  fileHash: text('file_hash'),
  status: text('status').default('NUEVO'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const documentText = sqliteTable('document_text', {
  id: text('id').primaryKey(), // references documents.id
  text: text('text').notNull(),
  ocrMethod: text('ocr_method').notNull(),
  extractedAt: integer('extracted_at', { mode: 'timestamp' }).notNull(),
});

export const documentEvidence = sqliteTable('document_evidence', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  type: text('type').notNull(), // RADICADO, SPOA, PROCESADO
  value: text('value').notNull(),
  page: integer('page').notNull().default(1),
  confidence: real('confidence').notNull().default(1.0),
});

export const expedientes = sqliteTable('expedientes', {
  id: text('id').primaryKey(), // e.g. 540016000727202600039
  driveId: text('drive_id'),
  folderId: text('folder_id'),
  path: text('path'),
  estado: text('estado'),
  lastScannedAt: integer('last_scanned_at', { mode: 'timestamp' }),
});

export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  expedienteId: text('expediente_id').notNull(),
  role: text('role').notNull(), // PROCESADO, VICTIMA, FISCAL, DEFENSOR
  name: text('name').notNull(),
  cedula: text('cedula'),
});

export const actuaciones = sqliteTable('actuaciones', {
  id: text('id').primaryKey(),
  expedienteId: text('expediente_id').notNull(),
  documentId: text('document_id'),
  type: text('type').notNull(), // AUTO, AUDIENCIA, MEMORIAL
  fecha: integer('fecha', { mode: 'timestamp' }),
  descripcion: text('descripcion'),
});

export const logs = sqliteTable('logs', {
  id: text('id').primaryKey(),
  documentId: text('document_id'),
  action: text('action').notNull(),
  details: text('details'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const investigations = sqliteTable('investigations', {
  id: text('id').primaryKey(), // documentId
  documentId: text('document_id').notNull(),
  estado: text('estado').notNull(), // ENCONTRADO, POSIBLE, NO_IDENTIFICADO
  expedienteId: text('expediente_id'),
  resultado: text('resultado'),
  telemetria: text('telemetria'), // JSON
  cadenaEvidencias: text('cadena_evidencias'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
