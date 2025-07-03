import type { Express } from "express";
import { createServer, type Server } from "http";
import { insertAnalysisSchema, type AnalysisConfig, type AnalysisResults } from "@shared/schema";
import { analysisService } from "./services/analyzer";
import { z } from "zod";

function generateHtmlReport(results: AnalysisResults): string {
  const currentDate = new Date().toLocaleDateString();
  const avgTitleLength = Math.round(results.summary.avgTitleLength);
  const avgWordCount = Math.round(results.summary.avgWordCount);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SEO Competitor Analysis Report - ${results.keyword}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6; 
            color: #333; 
            background: #f8fafc;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            padding: 30px;
            background: #f8fafc;
        }
        .summary-card { 
            background: white; 
            padding: 25px; 
            border-radius: 8px; 
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .summary-card h3 { color: #4a5568; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .summary-card .value { font-size: 2rem; font-weight: bold; color: #2d3748; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            color: #2d3748; 
            margin-bottom: 20px; 
            padding-bottom: 10px; 
            border-bottom: 2px solid #e2e8f0;
            font-size: 1.5rem;
        }
        .competitor { 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            overflow: hidden;
        }
        .competitor-header { 
            background: #f7fafc; 
            padding: 20px; 
            border-bottom: 1px solid #e2e8f0;
        }
        .rank { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            text-align: center; 
            line-height: 24px; 
            font-size: 0.9rem; 
            font-weight: bold; 
            margin-right: 10px;
        }
        .rank.first { background: #48bb78; }
        .competitor-title { font-size: 1.1rem; font-weight: 600; color: #2d3748; }
        .competitor-domain { font-size: 0.9rem; color: #718096; margin-top: 5px; }
        .competitor-content { padding: 20px; }
        .metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); 
            gap: 15px; 
            margin-bottom: 25px;
        }
        .metric { text-align: center; }
        .metric-value { font-size: 1.3rem; font-weight: bold; color: #2d3748; }
        .metric-label { font-size: 0.8rem; color: #718096; text-transform: uppercase; letter-spacing: 0.5px; }
        .meta-info { 
            background: #f7fafc; 
            padding: 15px; 
            border-radius: 6px; 
            margin-bottom: 20px;
        }
        .meta-info h4 { color: #4a5568; margin-bottom: 10px; font-size: 0.9rem; text-transform: uppercase; }
        .meta-value { color: #2d3748; margin-bottom: 8px; }
        .meta-length { font-size: 0.8rem; color: #718096; }
        .headings { 
            background: #f7fafc; 
            padding: 15px; 
            border-radius: 6px;
        }
        .headings h4 { color: #4a5568; margin-bottom: 15px; font-size: 0.9rem; text-transform: uppercase; }
        .heading { 
            margin-bottom: 8px; 
            display: flex; 
            align-items: center; 
            gap: 10px;
        }
        .heading-tag { 
            background: #667eea; 
            color: white; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 0.7rem; 
            font-weight: bold; 
            min-width: 30px; 
            text-align: center;
        }
        .heading-tag.h1 { background: #48bb78; }
        .heading-tag.h2 { background: #4299e1; }
        .heading-tag.h3 { background: #9f7aea; }
        .heading-tag.h4 { background: #f6ad55; }
        .heading-text { color: #4a5568; }
        .entities { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 8px; 
            margin-top: 15px;
        }
        .entity { 
            background: #e6fffa; 
            color: #234e52; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.8rem; 
            border: 1px solid #b2f5ea;
        }
        .styled-elements { 
            background: #f7fafc; 
            padding: 15px; 
            border-radius: 6px; 
            margin-bottom: 20px;
        }
        .styled-elements h4 { color: #4a5568; margin-bottom: 15px; font-size: 0.9rem; text-transform: uppercase; }
        .styled-group { margin-bottom: 15px; }
        .styled-group-title { 
            font-size: 0.8rem; 
            font-weight: 600; 
            color: #4a5568; 
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .styled-items { 
            display: flex; 
            flex-wrap: wrap; 
            gap: 6px;
        }
        .styled-item { 
            background: white; 
            padding: 4px 10px; 
            border-radius: 4px; 
            font-size: 0.8rem; 
            border: 1px solid #e2e8f0;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .styled-item.emphasis { border-color: #f6ad55; background: #fffaf0; color: #c05621; }
        .styled-item.strong { border-color: #4299e1; background: #ebf8ff; color: #2b6cb0; }
        .styled-item.italic { border-color: #9f7aea; background: #faf5ff; color: #6b46c1; }
        .full-content { 
            background: #f7fafc; 
            padding: 20px; 
            border-radius: 8px; 
            margin-top: 20px;
            border: 1px solid #e2e8f0;
        }
        .full-content h4 { 
            color: #4a5568; 
            margin-bottom: 15px; 
            font-size: 0.9rem; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .content-preview { 
            max-height: 300px; 
            overflow-y: auto; 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            border: 1px solid #e2e8f0;
            font-family: monospace;
            font-size: 0.8rem;
            line-height: 1.4;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .content-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 10px;
            margin-bottom: 15px;
        }
        .content-stat {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
        }
        .content-stat-value {
            font-size: 1.1rem;
            font-weight: bold;
            color: #2d3748;
        }
        .content-stat-label {
            font-size: 0.7rem;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .recommendations { 
            background: #f7fafc; 
            padding: 25px; 
            border-radius: 8px; 
            margin-top: 30px;
        }
        .recommendations h3 { color: #2d3748; margin-bottom: 15px; }
        .recommendation { 
            background: white; 
            padding: 15px; 
            border-radius: 6px; 
            margin-bottom: 10px; 
            border-left: 4px solid #667eea;
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            color: #718096; 
            background: #f7fafc; 
            border-top: 1px solid #e2e8f0;
        }
        @media print {
            body { padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SEO Competitor Analysis Report</h1>
            <p>Keyword: "${results.keyword}" | Country: ${results.country} | Language: ${results.language}</p>
            <p>Generated on ${currentDate}</p>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Average Word Count</h3>
                <div class="value">${avgWordCount.toLocaleString()}</div>
            </div>
            <div class="summary-card">
                <h3>Average Title Length</h3>
                <div class="value">${avgTitleLength}</div>
            </div>
            <div class="summary-card">
                <h3>Common Entities</h3>
                <div class="value">${results.summary.commonEntities.length}</div>
            </div>
            <div class="summary-card">
                <h3>Pages Analyzed</h3>
                <div class="value">${results.summary.totalPages}</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>Top 10 Competitor Analysis</h2>
                ${results.competitors.map(competitor => `
                    <div class="competitor">
                        <div class="competitor-header">
                            <span class="rank ${competitor.rank === 1 ? 'first' : ''}">${competitor.rank}</span>
                            <div class="competitor-title">${competitor.title || 'No title found'}</div>
                            <div class="competitor-domain">${competitor.domain}</div>
                        </div>
                        <div class="competitor-content">
                            <div class="metrics">
                                <div class="metric">
                                    <div class="metric-value">${(competitor.wordCount || 0).toLocaleString()}</div>
                                    <div class="metric-label">Words</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${(competitor.title || '').length}</div>
                                    <div class="metric-label">Title Length</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${Array.isArray(competitor.entities) ? competitor.entities.length : 0}</div>
                                    <div class="metric-label">Entities</div>
                                </div>
                                <div class="metric">
                                    <div class="metric-value">${Array.isArray(competitor.headings) ? competitor.headings.length : 0}</div>
                                    <div class="metric-label">Headings</div>
                                </div>
                            </div>

                            <div class="meta-info">
                                <h4>SEO Meta Information</h4>
                                <div class="meta-value">
                                    <strong>Title:</strong> ${competitor.title || 'No title found'}
                                    <div class="meta-length">${(competitor.title || '').length} characters</div>
                                </div>
                                <div class="meta-value">
                                    <strong>Meta Description:</strong> ${competitor.metaDescription || 'No meta description found'}
                                    <div class="meta-length">${(competitor.metaDescription || '').length} characters</div>
                                </div>
                            </div>

                            ${competitor.headings && Array.isArray(competitor.headings) && competitor.headings.length > 0 ? `
                                <div class="headings">
                                    <h4>Heading Structure</h4>
                                    ${competitor.headings.map((heading: any) => `
                                        <div class="heading">
                                            <span class="heading-tag h${heading.level}">H${heading.level}</span>
                                            <span class="heading-text">${heading.text}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}

                            ${competitor.styledElements && (
                                (competitor.styledElements.emphasis && competitor.styledElements.emphasis.length > 0) ||
                                (competitor.styledElements.strong && competitor.styledElements.strong.length > 0) ||
                                (competitor.styledElements.italic && competitor.styledElements.italic.length > 0)
                            ) ? `
                                <div class="styled-elements">
                                    <h4>Styled Content Elements</h4>
                                    ${competitor.styledElements.emphasis && competitor.styledElements.emphasis.length > 0 ? `
                                        <div class="styled-group">
                                            <div class="styled-group-title">Emphasis (<em>) - ${competitor.styledElements.emphasis.length} found</div>
                                            <div class="styled-items">
                                                ${competitor.styledElements.emphasis.slice(0, 10).map((item: any) => `
                                                    <span class="styled-item emphasis" title="${item.text}">${item.text}</span>
                                                `).join('')}
                                                ${competitor.styledElements.emphasis.length > 10 ? `<span class="styled-item">... +${competitor.styledElements.emphasis.length - 10} more</span>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${competitor.styledElements.strong && competitor.styledElements.strong.length > 0 ? `
                                        <div class="styled-group">
                                            <div class="styled-group-title">Strong (<strong>) - ${competitor.styledElements.strong.length} found</div>
                                            <div class="styled-items">
                                                ${competitor.styledElements.strong.slice(0, 10).map((item: any) => `
                                                    <span class="styled-item strong" title="${item.text}">${item.text}</span>
                                                `).join('')}
                                                ${competitor.styledElements.strong.length > 10 ? `<span class="styled-item">... +${competitor.styledElements.strong.length - 10} more</span>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                    ${competitor.styledElements.italic && competitor.styledElements.italic.length > 0 ? `
                                        <div class="styled-group">
                                            <div class="styled-group-title">Italic (<i>) - ${competitor.styledElements.italic.length} found</div>
                                            <div class="styled-items">
                                                ${competitor.styledElements.italic.slice(0, 10).map((item: any) => `
                                                    <span class="styled-item italic" title="${item.text}">${item.text}</span>
                                                `).join('')}
                                                ${competitor.styledElements.italic.length > 10 ? `<span class="styled-item">... +${competitor.styledElements.italic.length - 10} more</span>` : ''}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}

                            ${competitor.entities && Array.isArray(competitor.entities) && competitor.entities.length > 0 ? `
                                <div class="entities">
                                    ${competitor.entities.slice(0, 10).map((entity: any) => `
                                        <span class="entity">${entity.name}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                            
                            <div class="full-content">
                                <h4>📄 Complete Page Content</h4>
                                <div class="content-stats">
                                    <div class="content-stat">
                                        <div class="content-stat-value">${competitor.fullContent ? Math.round(competitor.fullContent.length / 1024) : 0}</div>
                                        <div class="content-stat-label">KB Size</div>
                                    </div>
                                    <div class="content-stat">
                                        <div class="content-stat-value">${competitor.fullContent ? competitor.fullContent.split('\n').length : 0}</div>
                                        <div class="content-stat-label">Lines</div>
                                    </div>
                                    <div class="content-stat">
                                        <div class="content-stat-value">${competitor.fullContent ? (competitor.fullContent.match(/</g) || []).length : 0}</div>
                                        <div class="content-stat-label">HTML Tags</div>
                                    </div>
                                    <div class="content-stat">
                                        <div class="content-stat-value">${competitor.wordCount || 0}</div>
                                        <div class="content-stat-label">Words</div>
                                    </div>
                                </div>
                                <div class="content-preview">${competitor.fullContent ? competitor.fullContent.replace(/</g, '<').replace(/>/g, '>') : 'No content available'}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${results.summary.commonEntities.length > 0 ? `
                <div class="section">
                    <h2>Most Common Entities</h2>
                    <div class="entities">
                        ${results.summary.commonEntities.slice(0, 15).map(entity => `
                            <span class="entity">${entity.name} (${entity.salience.toFixed(2)})</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            ${results.recommendations.length > 0 ? `
                <div class="recommendations">
                    <h3>SEO Recommendations</h3>
                    ${results.recommendations.map(rec => `
                        <div class="recommendation">${rec}</div>
                    `).join('')}
                </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>Report generated by SEO Competitor Analysis Tool</p>
            <p>Analysis ID: ${results.id} | Generated on ${currentDate}</p>
        </div>
    </div>
</body>
</html>`;
}

const analysisConfigSchema = insertAnalysisSchema.extend({
  entityExtraction: z.boolean().default(true),
  sentimentAnalysis: z.boolean().default(true),
  imageAnalysis: z.boolean().default(false),
  googleApiKey: z.string().min(1, "Google API Key is required"),
  googleCseId: z.string().min(1, "Google Custom Search ID is required"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Start a new analysis
  app.post("/api/analysis", async (req, res) => {
    try {
      const config = analysisConfigSchema.parse(req.body);
      const analysisId = await analysisService.startAnalysis(config);
      
      res.json({ 
        success: true, 
        analysisId,
        message: "Analysis started successfully" 
      });
    } catch (error) {
      console.error("Analysis start error:", error);
      res.status(400).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get analysis results
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const results = await analysisService.getAnalysisResults(id);
      if (!results) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.json(results);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await analysisService.getAllAnalyses();
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Export analysis data as CSV
  app.get("/api/analysis/:id/export/csv", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const results = await analysisService.getAnalysisResults(id);
      if (!results) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Generate CSV content
      const csvHeader = [
        "Rank", "Domain", "URL", "Title", "Meta Description", 
        "Word Count", "Title Length", "Sentiment Score", "Entity Count"
      ].join(",");

      const csvRows = results.competitors.map(competitor => [
        competitor.rank,
        `"${competitor.domain}"`,
        `"${competitor.url}"`,
        `"${(competitor.title || '').replace(/"/g, '""')}"`,
        `"${(competitor.metaDescription || '').replace(/"/g, '""')}"`,
        competitor.wordCount || 0,
        (competitor.title || '').length,
        competitor.sentiment || 0,
        Array.isArray(competitor.entities) ? competitor.entities.length : 0
      ].join(","));

      const csvContent = [csvHeader, ...csvRows].join("\n");

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="seo-analysis-${id}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("CSV export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Export analysis data as JSON
  app.get("/api/analysis/:id/export/json", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const results = await analysisService.getAnalysisResults(id);
      if (!results) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="seo-analysis-${id}.json"`);
      res.json(results);
    } catch (error) {
      console.error("JSON export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Export analysis data as HTML report
  app.get("/api/analysis/:id/export/html", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const results = await analysisService.getAnalysisResults(id);
      if (!results) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      // Generate HTML report
      const html = generateHtmlReport(results);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="seo-analysis-report-${id}.html"`);
      res.send(html);
    } catch (error) {
      console.error("HTML export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Export full content data including complete HTML
  app.get("/api/analysis/:id/export/fullcontent", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid analysis ID" });
      }

      const results = await analysisService.getAnalysisResults(id);
      if (!results) {
        return res.status(404).json({ error: "Analysis not found" });
      }

      const fullContentData = {
        keyword: results.keyword,
        analysisId: results.id,
        country: results.country,
        language: results.language,
        createdAt: results.createdAt,
        competitors: results.competitors.map(competitor => ({
          rank: competitor.rank,
          domain: competitor.domain,
          url: competitor.url,
          title: competitor.title,
          metaDescription: competitor.metaDescription,
          content: competitor.content,
          fullContent: competitor.fullContent,
          wordCount: competitor.wordCount,
          headings: competitor.headings,
          styledElements: competitor.styledElements,
          entities: competitor.entities,
          images: competitor.images,
          links: competitor.links,
          structuredData: competitor.structuredData
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="full-content-${results.keyword.replace(/\s+/g, '-')}-${id}.json"`);
      res.json(fullContentData);
    } catch (error) {
      console.error("Full content export error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}