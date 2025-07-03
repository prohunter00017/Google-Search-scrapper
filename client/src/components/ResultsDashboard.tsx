import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Heading, Tags, Smile, Table, Download, Code, Eye, Lightbulb, CheckCircle, AlertTriangle, Info, ChevronDown, ChevronRight, Hash, Type } from "lucide-react";
import { AnalysisResults, EntityData } from "@shared/schema";
import { useState } from "react";

interface ResultsDashboardProps {
  analysisId: number;
}

export function ResultsDashboard({ analysisId }: ResultsDashboardProps) {
  const [expandedCompetitors, setExpandedCompetitors] = useState<Set<number>>(new Set());
  
  const { data: results, isLoading, error } = useQuery<AnalysisResults>({
    queryKey: [`/api/analysis/${analysisId}`],
    enabled: !!analysisId,
    retry: 3,
    retryDelay: 1000,
  });

  const toggleCompetitorExpansion = (competitorId: number) => {
    const newExpanded = new Set(expandedCompetitors);
    if (newExpanded.has(competitorId)) {
      newExpanded.delete(competitorId);
    } else {
      newExpanded.add(competitorId);
    }
    setExpandedCompetitors(newExpanded);
  };



  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export/csv`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-analysis-${analysisId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export/json`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-analysis-${analysisId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportHTML = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export/html`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seo-analysis-report-${analysisId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('HTML export failed:', error);
    }
  };

  const handleExportFullContent = async () => {
    try {
      const response = await fetch(`/api/analysis/${analysisId}/export/fullcontent`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `full-content-${analysisId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Full content export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to load analysis results. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (results.status !== 'completed') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-neutral-600">
            Analysis is still in progress...
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, competitors, recommendations } = results;

  // Calculate sentiment distribution
  const sentimentCounts = competitors.reduce(
    (acc, competitor) => {
      if (competitor.sentiment === null || competitor.sentiment === undefined) {
        acc.neutral++;
      } else if (competitor.sentiment > 0.1) {
        acc.positive++;
      } else if (competitor.sentiment < -0.1) {
        acc.negative++;
      } else {
        acc.neutral++;
      }
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const totalSentimentPages = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Average Word Count</p>
                <p className="text-2xl font-bold text-neutral-800">{summary.avgWordCount.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="text-primary text-xl" />
              </div>
            </div>
            <div className="mt-2 text-xs text-secondary">
              <CheckCircle className="inline mr-1" size={12} />
              Optimal content depth
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Avg. Title Length</p>
                <p className="text-2xl font-bold text-neutral-800">{summary.avgTitleLength}</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Heading className="text-secondary text-xl" />
              </div>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              Characters (optimal range)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Common Entities</p>
                <p className="text-2xl font-bold text-neutral-800">{summary.commonEntities.length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Tags className="text-accent text-xl" />
              </div>
            </div>
            <div className="mt-2 text-xs text-neutral-500">
              High-value topics
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-600">Avg. Sentiment</p>
                <p className="text-2xl font-bold text-neutral-800">
                  {summary.avgSentiment > 0 ? '+' : ''}{summary.avgSentiment}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Smile className="text-secondary text-xl" />
              </div>
            </div>
            <div className="mt-2 text-xs text-secondary">
              Positive sentiment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Results with Detailed Analysis */}
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg font-semibold text-neutral-800">
              <Table className="text-primary mr-2" />
              Top 10 Competitor Analysis
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2" size={16} />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON}>
                <Code className="mr-2" size={16} />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportFullContent}>
                <Eye className="mr-2" size={16} />
                Full Content
              </Button>
              <Button size="sm" onClick={handleExportHTML}>
                <FileText className="mr-2" size={16} />
                HTML Report
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-0">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="border-b border-neutral-200">
                <Collapsible 
                  open={expandedCompetitors.has(competitor.id)}
                  onOpenChange={() => toggleCompetitorExpansion(competitor.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50">
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-white text-xs font-semibold rounded-full ${
                          competitor.rank === 1 ? 'bg-primary' : 'bg-neutral-400'
                        }`}>
                          {competitor.rank}
                        </span>
                        <div className="text-left">
                          <div className="text-sm font-medium text-neutral-800">{competitor.domain}</div>
                          <div className="text-xs text-neutral-500 max-w-md truncate">{competitor.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-neutral-800">{competitor.wordCount?.toLocaleString() || 0} words</div>
                          <div className="text-xs text-neutral-500">{competitor.title?.length || 0} char title</div>
                        </div>
                        <Badge variant="secondary">
                          {Array.isArray(competitor.entities) ? competitor.entities.length : 0} entities
                        </Badge>
                        <div className="flex items-center">
                          {expandedCompetitors.has(competitor.id) ? (
                            <ChevronDown className="text-neutral-400" size={16} />
                          ) : (
                            <ChevronRight className="text-neutral-400" size={16} />
                          )}
                        </div>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-6 pb-4 bg-neutral-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* SEO Meta Information */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Info className="text-primary" size={16} />
                            <h4 className="text-sm font-semibold text-neutral-800">SEO Meta Information</h4>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Title Tag</label>
                              <div className="text-sm text-neutral-800 mt-1">{competitor.title || 'No title found'}</div>
                              <div className="text-xs text-neutral-500 mt-1">
                                {competitor.title?.length || 0} characters 
                                {competitor.title && competitor.title.length > 60 && (
                                  <span className="text-orange-500 ml-1">• Too long</span>
                                )}
                                {competitor.title && competitor.title.length < 30 && (
                                  <span className="text-orange-500 ml-1">• Too short</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Meta Description</label>
                              <div className="text-sm text-neutral-800 mt-1">
                                {competitor.metaDescription || 'No meta description found'}
                              </div>
                              <div className="text-xs text-neutral-500 mt-1">
                                {competitor.metaDescription?.length || 0} characters
                                {competitor.metaDescription && competitor.metaDescription.length > 160 && (
                                  <span className="text-orange-500 ml-1">• Too long</span>
                                )}
                                {competitor.metaDescription && competitor.metaDescription.length < 120 && (
                                  <span className="text-orange-500 ml-1">• Too short</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Heading Structure */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Hash className="text-primary" size={16} />
                            <h4 className="text-sm font-semibold text-neutral-800">Heading Structure</h4>
                          </div>
                          
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {competitor.headings && Array.isArray(competitor.headings) && competitor.headings.length > 0 ? (
                              competitor.headings.map((heading: any, idx: number) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <Badge 
                                    variant={heading.level === 1 ? 'default' : 'outline'}
                                    className="text-xs shrink-0 mt-0.5"
                                  >
                                    H{heading.level}
                                  </Badge>
                                  <div className="text-sm text-neutral-700 break-words">
                                    {heading.text}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-neutral-500">No headings found</div>
                            )}
                          </div>
                          
                          {/* Heading Summary */}
                          <div className="pt-2 border-t border-neutral-200">
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4].map(level => {
                                const count = competitor.headings && Array.isArray(competitor.headings) 
                                  ? competitor.headings.filter((h: any) => h.level === level).length 
                                  : 0;
                                return (
                                  <div key={level} className="text-xs text-neutral-500">
                                    <span className="font-medium">H{level}:</span> {count}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Styled Elements */}
                        {competitor.styledElements && (
                          (competitor.styledElements.emphasis?.length > 0) ||
                          (competitor.styledElements.strong?.length > 0) ||
                          (competitor.styledElements.italic?.length > 0)
                        ) && (
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Type className="text-primary" size={16} />
                              <h4 className="text-sm font-semibold text-neutral-800">Styled Content Elements</h4>
                            </div>
                            
                            <div className="space-y-3">
                              {competitor.styledElements.emphasis?.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-orange-600 mb-2 uppercase tracking-wide">
                                    Emphasis (&lt;em&gt;) - {competitor.styledElements.emphasis.length} found
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                    {competitor.styledElements.emphasis.slice(0, 8).map((item: any, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className="inline-block px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-md max-w-40 truncate"
                                        title={item.text}
                                      >
                                        {item.text}
                                      </span>
                                    ))}
                                    {competitor.styledElements.emphasis.length > 8 && (
                                      <span className="text-xs text-neutral-500 px-2 py-1">
                                        +{competitor.styledElements.emphasis.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {competitor.styledElements.strong?.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-blue-600 mb-2 uppercase tracking-wide">
                                    Strong (&lt;strong&gt;) - {competitor.styledElements.strong.length} found
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                    {competitor.styledElements.strong.slice(0, 8).map((item: any, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-md max-w-40 truncate"
                                        title={item.text}
                                      >
                                        {item.text}
                                      </span>
                                    ))}
                                    {competitor.styledElements.strong.length > 8 && (
                                      <span className="text-xs text-neutral-500 px-2 py-1">
                                        +{competitor.styledElements.strong.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {competitor.styledElements.italic?.length > 0 && (
                                <div>
                                  <div className="text-xs font-medium text-purple-600 mb-2 uppercase tracking-wide">
                                    Italic (&lt;i&gt;) - {competitor.styledElements.italic.length} found
                                  </div>
                                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                    {competitor.styledElements.italic.slice(0, 8).map((item: any, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className="inline-block px-2 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-md max-w-40 truncate"
                                        title={item.text}
                                      >
                                        {item.text}
                                      </span>
                                    ))}
                                    {competitor.styledElements.italic.length > 8 && (
                                      <span className="text-xs text-neutral-500 px-2 py-1">
                                        +{competitor.styledElements.italic.length - 8} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Additional Metrics */}
                      <div className="mt-6 pt-4 border-t border-neutral-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-neutral-800">{competitor.wordCount?.toLocaleString() || 0}</div>
                            <div className="text-xs text-neutral-500">Total Words</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-neutral-800">
                              {Array.isArray(competitor.entities) ? competitor.entities.length : 0}
                            </div>
                            <div className="text-xs text-neutral-500">Entities</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-neutral-800">
                              {competitor.headings && Array.isArray(competitor.headings) ? competitor.headings.length : 0}
                            </div>
                            <div className="text-xs text-neutral-500">Total Headings</div>
                          </div>
                          <div>
                            <div className={`text-lg font-semibold ${
                              (competitor.sentiment || 0) > 0.1 ? 'text-green-600' : 
                              (competitor.sentiment || 0) < -0.1 ? 'text-red-600' : 'text-neutral-600'
                            }`}>
                              {competitor.sentiment ? 
                                (competitor.sentiment > 0 ? '+' : '') + competitor.sentiment.toFixed(2) 
                                : 'N/A'
                              }
                            </div>
                            <div className="text-xs text-neutral-500">Sentiment</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Entity Analysis & Sentiment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Entities */}
        <Card>
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="flex items-center text-lg font-semibold text-neutral-800">
              <Tags className="text-primary mr-2" />
              Most Common Entities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {summary.commonEntities.slice(0, 5).map((entity: EntityData, index: number) => (
              <div key={entity.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                    index === 0 ? 'bg-primary/10' : index === 1 ? 'bg-secondary/10' : 'bg-accent/10'
                  }`}>
                    <Tags className={`${
                      index === 0 ? 'text-primary' : index === 1 ? 'text-secondary' : 'text-accent'
                    }`} size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-800">{entity.name}</div>
                    <div className="text-xs text-neutral-500">{entity.type} • High salience</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-neutral-800">
                    {entity.salience.toFixed(2)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {entity.mentions}/{summary.totalPages} pages
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader className="border-b border-neutral-200">
            <CardTitle className="flex items-center text-lg font-semibold text-neutral-800">
              <Smile className="text-primary mr-2" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-secondary rounded mr-3"></div>
                  <span className="text-sm font-medium text-neutral-700">Positive</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-secondary h-2 rounded-full" 
                      style={{width: `${totalSentimentPages > 0 ? (sentimentCounts.positive / totalSentimentPages) * 100 : 0}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{sentimentCounts.positive} pages</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-neutral-400 rounded mr-3"></div>
                  <span className="text-sm font-medium text-neutral-700">Neutral</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-neutral-400 h-2 rounded-full" 
                      style={{width: `${totalSentimentPages > 0 ? (sentimentCounts.neutral / totalSentimentPages) * 100 : 0}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{sentimentCounts.neutral} pages</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 rounded mr-3"></div>
                  <span className="text-sm font-medium text-neutral-700">Negative</span>
                </div>
                <div className="flex items-center">
                  <div className="w-32 bg-neutral-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-red-400 h-2 rounded-full" 
                      style={{width: `${totalSentimentPages > 0 ? (sentimentCounts.negative / totalSentimentPages) * 100 : 0}%`}}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-neutral-800">{sentimentCounts.negative} pages</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-neutral-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {summary.avgSentiment > 0 ? '+' : ''}{summary.avgSentiment}
                </div>
                <div className="text-sm text-neutral-600">Average Sentiment Score</div>
                <div className="text-xs text-neutral-500 mt-1">
                  {summary.avgSentiment > 0.1 ? 'Consistently positive content tone' : 
                   summary.avgSentiment < -0.1 ? 'Negative content tone' : 'Neutral content tone'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Panel */}
      <Card>
        <CardHeader className="border-b border-neutral-200">
          <CardTitle className="flex items-center text-lg font-semibold text-neutral-800">
            <Lightbulb className="text-accent mr-2" />
            SEO Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {recommendations.slice(0, Math.ceil(recommendations.length / 2)).map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <CheckCircle className="text-secondary" size={12} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {recommendations.slice(Math.ceil(recommendations.length / 2)).map((recommendation, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <Info className="text-primary" size={12} />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
