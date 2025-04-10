import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  filename: text('filename').notNull(),
  content: text('content').notNull(),
  chunkSize: text('chunk_size').notNull(),
  chunkOverlap: text('chunk_overlap').notNull(),
  totalChunks: text('total_chunks').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
