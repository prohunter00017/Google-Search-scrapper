import { analyses, competitorResults, type Analysis, type InsertAnalysis, type CompetitorResult, type InsertCompetitorResult } from "@shared/schema";

export interface IStorage {
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  updateAnalysisStatus(id: number, status: string, results?: any): Promise<Analysis | undefined>;
  getAllAnalyses(): Promise<Analysis[]>;
  
  // Competitor results operations
  createCompetitorResult(result: InsertCompetitorResult): Promise<CompetitorResult>;
  getCompetitorResultsByAnalysis(analysisId: number): Promise<CompetitorResult[]>;
  deleteCompetitorResultsByAnalysis(analysisId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private analyses: Map<number, Analysis>;
  private competitorResults: Map<number, CompetitorResult>;
  private currentAnalysisId: number;
  private currentCompetitorId: number;

  constructor() {
    this.analyses = new Map();
    this.competitorResults = new Map();
    this.currentAnalysisId = 1;
    this.currentCompetitorId = 1;
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentAnalysisId++;
    const analysis: Analysis = {
      ...insertAnalysis,
      id,
      status: "pending",
      results: null,
      createdAt: new Date(),
      completedAt: null,
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async updateAnalysisStatus(id: number, status: string, results?: any): Promise<Analysis | undefined> {
    const analysis = this.analyses.get(id);
    if (!analysis) return undefined;

    const updatedAnalysis: Analysis = {
      ...analysis,
      status,
      results: results || analysis.results,
      completedAt: status === "completed" ? new Date() : analysis.completedAt,
    };
    
    this.analyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  }

  async getAllAnalyses(): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createCompetitorResult(insertResult: InsertCompetitorResult): Promise<CompetitorResult> {
    const id = this.currentCompetitorId++;
    const result: CompetitorResult = {
      ...insertResult,
      id,
    };
    this.competitorResults.set(id, result);
    return result;
  }

  async getCompetitorResultsByAnalysis(analysisId: number): Promise<CompetitorResult[]> {
    return Array.from(this.competitorResults.values())
      .filter(result => result.analysisId === analysisId)
      .sort((a, b) => a.rank - b.rank);
  }

  async deleteCompetitorResultsByAnalysis(analysisId: number): Promise<void> {
    for (const [id, result] of this.competitorResults.entries()) {
      if (result.analysisId === analysisId) {
        this.competitorResults.delete(id);
      }
    }
  }
}

export const storage = new MemStorage();
