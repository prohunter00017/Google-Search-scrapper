import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  country: text("country").notNull().default("US"),
  language: text("language").notNull().default("en"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  results: jsonb("results"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const competitorResults = pgTable("competitor_results", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id").notNull(),
  rank: integer("rank").notNull(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  title: text("title"),
  metaDescription: text("meta_description"),
  content: text("content"),
  fullContent: text("full_content"),
  wordCount: integer("word_count"),
  entities: jsonb("entities"),
  sentiment: real("sentiment"),
  headings: jsonb("headings"),
  images: jsonb("images"),
  links: jsonb("links"),
  structuredData: jsonb("structured_data"),
  styledElements: jsonb("styled_elements"),
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  keyword: true,
  country: true,
  language: true,
});

export const insertCompetitorResultSchema = createInsertSchema(competitorResults).omit({
  id: true,
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type CompetitorResult = typeof competitorResults.$inferSelect;
export type InsertCompetitorResult = z.infer<typeof insertCompetitorResultSchema>;

// API Response types
export interface AnalysisConfig {
  keyword: string;
  country: string;
  language: string;
  entityExtraction: boolean;
  sentimentAnalysis: boolean;
  imageAnalysis: boolean;
}

export interface EntityData {
  name: string;
  type: string;
  salience: number;
  mentions: number;
  knowledgeGraphId?: string;
}

export interface SentimentData {
  score: number;
  magnitude: number;
  label: 'positive' | 'neutral' | 'negative';
}

export interface AnalysisResults {
  id: number;
  keyword: string;
  country: string;
  language: string;
  status: string;
  competitors: CompetitorResult[];
  summary: {
    avgWordCount: number;
    avgTitleLength: number;
    commonEntities: EntityData[];
    avgSentiment: number;
    totalPages: number;
  };
  recommendations: string[];
  createdAt: string;
  completedAt?: string;
}
