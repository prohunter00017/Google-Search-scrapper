import { googleApisService } from './googleApis';
import { webScraperService } from './scraper';
import { storage } from '../storage';
import { EntityData, SentimentData, AnalysisConfig, AnalysisResults } from '@shared/schema';

export class AnalysisService {
  async startAnalysis(config: AnalysisConfig): Promise<number> {
    // Create analysis record
    const analysis = await storage.createAnalysis({
      keyword: config.keyword,
      country: config.country,
      language: config.language,
    });

    // Start background processing
    this.processAnalysis(analysis.id, config).catch(error => {
      console.error(`Analysis ${analysis.id} failed:`, error);
      storage.updateAnalysisStatus(analysis.id, 'failed', { error: error.message });
    });

    return analysis.id;
  }

  private async processAnalysis(analysisId: number, config: AnalysisConfig): Promise<void> {
    try {
      // Update status to processing
      await storage.updateAnalysisStatus(analysisId, 'processing');

      // Step 1: Get search results from Google
      console.log(`Starting Google search for: ${config.keyword}`);
      const searchResults = await googleApisService.searchGoogle(
        config.keyword,
        config.googleApiKey,
        config.googleCseId,
        config.country,
        config.language
      );

      if (searchResults.length === 0) {
        throw new Error('No search results found');
      }

      // Step 2: Scrape each competitor page
      const urls = searchResults.map(result => result.link);
      console.log(`Scraping ${urls.length} competitor pages...`);
      const scrapedData = await webScraperService.scrapeMultiplePages(urls, 2000);

      // Step 3: Analyze each page
      console.log('Analyzing competitor pages...');
      const competitorResults = [];

      for (let i = 0; i < searchResults.length; i++) {
        const searchResult = searchResults[i];
        const scraped = scrapedData.get(searchResult.link);

        if (!scraped) {
          console.warn(`Skipping ${searchResult.link} - scraping failed`);
          continue;
        }

        // Extract entities if enabled
        let entities: EntityData[] = [];
        if (config.entityExtraction && scraped.content) {
          try {
            entities = await googleApisService.analyzeEntities(scraped.content, config.googleApiKey);
          } catch (error) {
            console.warn(`Entity extraction failed for ${searchResult.link}:`, error);
          }
        }

        // Analyze sentiment if enabled
        let sentiment: SentimentData | null = null;
        if (config.sentimentAnalysis && scraped.content) {
          try {
            sentiment = await googleApisService.analyzeSentiment(scraped.content, config.googleApiKey);
          } catch (error) {
            console.warn(`Sentiment analysis failed for ${searchResult.link}:`, error);
          }
        }

        // Create competitor result
        const competitorResult = await storage.createCompetitorResult({
          analysisId,
          rank: i + 1,
          url: searchResult.link,
          domain: this.extractDomain(searchResult.link),
          title: scraped.title || searchResult.title,
          metaDescription: scraped.metaDescription || searchResult.snippet,
          content: scraped.content,
          fullContent: scraped.fullContent,
          wordCount: scraped.wordCount,
          entities: entities,
          sentiment: sentiment?.score || null,
          headings: scraped.headings,
          images: scraped.images,
          links: scraped.links,
          structuredData: scraped.structuredData,
          styledElements: scraped.styledElements,
        });

        competitorResults.push(competitorResult);

        // Small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 4: Generate analysis summary
      const summary = this.generateSummary(competitorResults);
      const recommendations = this.generateRecommendations(competitorResults, config.keyword);

      // Step 5: Update analysis with results
      const results = {
        summary,
        recommendations,
        totalCompetitors: competitorResults.length,
        searchResultsCount: searchResults.length,
      };

      await storage.updateAnalysisStatus(analysisId, 'completed', results);
      console.log(`Analysis ${analysisId} completed successfully`);

    } catch (error) {
      console.error(`Analysis ${analysisId} failed:`, error);
      await storage.updateAnalysisStatus(analysisId, 'failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  private generateSummary(competitors: any[]) {
    const validCompetitors = competitors.filter(c => c.wordCount && c.wordCount > 0);
    
    const avgWordCount = validCompetitors.length > 0 
      ? Math.round(validCompetitors.reduce((sum, c) => sum + c.wordCount, 0) / validCompetitors.length)
      : 0;

    const avgTitleLength = competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + (c.title?.length || 0), 0) / competitors.length)
      : 0;

    // Find most common entities
    const entityMap = new Map<string, { count: number; totalSalience: number; type: string }>();
    
    competitors.forEach(competitor => {
      if (competitor.entities && Array.isArray(competitor.entities)) {
        competitor.entities.forEach((entity: EntityData) => {
          const key = entity.name.toLowerCase();
          if (entityMap.has(key)) {
            const existing = entityMap.get(key)!;
            existing.count++;
            existing.totalSalience += entity.salience;
          } else {
            entityMap.set(key, {
              count: 1,
              totalSalience: entity.salience,
              type: entity.type
            });
          }
        });
      }
    });

    const commonEntities = Array.from(entityMap.entries())
      .filter(([_, data]) => data.count >= Math.ceil(competitors.length * 0.3)) // At least 30% of pages
      .map(([name, data]) => ({
        name,
        type: data.type,
        salience: data.totalSalience / data.count,
        mentions: data.count
      }))
      .sort((a, b) => b.salience - a.salience)
      .slice(0, 10);

    // Calculate average sentiment
    const sentimentScores = competitors
      .filter(c => c.sentiment !== null && c.sentiment !== undefined)
      .map(c => c.sentiment);
    
    const avgSentiment = sentimentScores.length > 0
      ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length
      : 0;

    return {
      avgWordCount,
      avgTitleLength,
      commonEntities,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      totalPages: competitors.length
    };
  }

  private generateRecommendations(competitors: any[], keyword: string): string[] {
    const recommendations: string[] = [];
    const summary = this.generateSummary(competitors);

    // Word count recommendation
    if (summary.avgWordCount > 0) {
      recommendations.push(
        `Target content length around ${summary.avgWordCount} words to match top-ranking competitors.`
      );
    }

    // Title length recommendation
    if (summary.avgTitleLength > 0) {
      const optimal = summary.avgTitleLength >= 50 && summary.avgTitleLength <= 60;
      if (!optimal) {
        recommendations.push(
          `Optimize title length to 50-60 characters. Current competitor average is ${summary.avgTitleLength} characters.`
        );
      } else {
        recommendations.push(
          `Maintain title length around ${summary.avgTitleLength} characters for optimal performance.`
        );
      }
    }

    // Entity recommendations
    if (summary.commonEntities.length > 0) {
      const topEntities = summary.commonEntities.slice(0, 5).map(e => e.name).join(', ');
      recommendations.push(
        `Include high-value entities in your content: ${topEntities}. These appear frequently in top-ranking pages.`
      );
    }

    // Sentiment recommendation
    if (summary.avgSentiment > 0.1) {
      recommendations.push(
        `Maintain positive content tone. Top competitors show consistently positive sentiment (avg: ${summary.avgSentiment}).`
      );
    } else if (summary.avgSentiment < -0.1) {
      recommendations.push(
        `Consider adopting a more positive content tone to match successful competitors.`
      );
    }

    // Structured data recommendation
    const structuredDataUsage = competitors.filter(c => 
      c.structuredData && Array.isArray(c.structuredData) && c.structuredData.length > 0
    ).length;
    
    if (structuredDataUsage > competitors.length * 0.5) {
      recommendations.push(
        `Implement structured data markup. ${structuredDataUsage} out of ${competitors.length} top competitors use structured data.`
      );
    }

    return recommendations;
  }

  async getAnalysisResults(analysisId: number): Promise<AnalysisResults | null> {
    const analysis = await storage.getAnalysis(analysisId);
    if (!analysis) return null;

    const competitors = await storage.getCompetitorResultsByAnalysis(analysisId);

    return {
      id: analysis.id,
      keyword: analysis.keyword,
      country: analysis.country,
      language: analysis.language,
      status: analysis.status,
      competitors,
      summary: analysis.results?.summary || {
        avgWordCount: 0,
        avgTitleLength: 0,
        commonEntities: [],
        avgSentiment: 0,
        totalPages: 0
      },
      recommendations: analysis.results?.recommendations || [],
      createdAt: analysis.createdAt?.toISOString() || '',
      completedAt: analysis.completedAt?.toISOString()
    };
  }

  async getAllAnalyses(): Promise<AnalysisResults[]> {
    const analyses = await storage.getAllAnalyses();
    const results: AnalysisResults[] = [];

    for (const analysis of analyses) {
      const competitors = await storage.getCompetitorResultsByAnalysis(analysis.id);
      
      results.push({
        id: analysis.id,
        keyword: analysis.keyword,
        country: analysis.country,
        language: analysis.language,
        status: analysis.status,
        competitors,
        summary: analysis.results?.summary || {
          avgWordCount: 0,
          avgTitleLength: 0,
          commonEntities: [],
          avgSentiment: 0,
          totalPages: 0
        },
        recommendations: analysis.results?.recommendations || [],
        createdAt: analysis.createdAt?.toISOString() || '',
        completedAt: analysis.completedAt?.toISOString()
      });
    }

    return results;
  }
}

export const analysisService = new AnalysisService();