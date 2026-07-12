import { pgTable, uuid, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const works = pgTable("works", {
  id: uuid("id").primaryKey(),
  eventId: uuid("event_id").notNull(),
  description: text("description").notNull(),
  state: text("state").notNull(),
  version: integer("version").notNull(),
  createdAt: timestamp("created_at").notNull(),
  completedAt: timestamp("completed_at"),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey(),
  workId: uuid("work_id").notNull().references(() => works.id),
  state: text("state").notNull(),
  content: text("content"),
  version: integer("version").notNull(),
});

export const domainEvents = pgTable("domain_events", {
  eventId: uuid("event_id").primaryKey(),
  aggregateId: uuid("aggregate_id").notNull(),
  aggregateVersion: integer("aggregate_version").notNull(),
  type: text("type").notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  payload: jsonb("payload").notNull(),
});

export const outbox = pgTable("outbox", {
  id: uuid("id").primaryKey(),
  eventId: uuid("event_id").notNull().references(() => domainEvents.eventId),
  status: text("status").notNull(), // PENDING, PUBLISHED
  publishedAt: timestamp("published_at"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
});
